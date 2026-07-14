/**
 * checkout.ts — Router tRPC de checkout/pedidos
 * Localização: server/routers/checkout.ts
 *
 * No frontend, a chamada fica:
 *   trpc.checkout.criarPedido.useMutation()
 *
 * O webhook do Asaas (chamada externa, não vem do nosso client) continua
 * como rota REST simples em server/routes/asaas-webhook.ts.
 */

import { TRPCError } from "@trpc/server";
import { eq, sql, inArray, and, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { pedidos, itensPedido, pedidoEventos, produtos } from "../../shared/schema";
import { buscarOuCriarCliente, criarCobranca, buscarQrCodePix } from "../lib/asaas";
import { enviarEmail, emailPedidoRecebido } from "../lib/email";
import { calcularPorCep } from "./frete";
import { publicProcedure, router } from "../_core/trpc";

const enderecoSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().optional(),
  bairro: z.string(),
  cidade: z.string(),
  uf: z.string(),
  pais: z.string(),
});

const itemPedidoSchema = z.object({
  produtoId: z.number().int(),
  varianteCorId: z.number().int().nullable(),
  varianteArgilaId: z.number().int().nullable().optional(),
  quantidade: z.number().int().positive(),
  precoUnitario: z.number().positive(),
  personalizado: z.boolean(),
  arteCarimboUrl: z.string().optional(),
  textoCarimbo: z.string().optional(),
  observacoesCliente: z.string().optional(),
});

const criarPedidoInput = z.object({
  cliente: z.object({
    nome: z.string().min(1),
    email: z.string().email(),
    telefone: z.string(),
    documento: z.string(),
  }),
  enderecoEntrega: enderecoSchema,
  itens: z.array(itemPedidoSchema).min(1),
  metodoPagamento: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
});

function gerarCodigoPedido() {
  const ano = new Date().getFullYear();
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `CC-${ano}-${aleatorio}`;
}

export const checkoutRouter = router({
  criarPedido: publicProcedure
    .input(criarPedidoInput)
    .mutation(async ({ input }) => {
      // Regra de roteamento de gateway: Brasil -> Asaas. Fora do Brasil -> bloqueado
      // por enquanto (Stripe é fase 2 — decisão do Conselho).
      if (input.enderecoEntrega.pais !== "BR") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Envios internacionais ainda não estão disponíveis. Em breve via Stripe.",
        });
      }

      const subtotal = input.itens.reduce(
        (soma, item) => soma + item.precoUnitario * item.quantidade,
        0
      );
      // Custo de personalização já embutido no precoUnitario enviado pelo client.
      const custoPersonalizacaoTotal = 0;

      // ── Checagem de estoque — só considera produtos com
      // controlarEstoque=true (peças sob encomenda/personalizadas ficam
      // de fora, não têm estoque fixo) ──
      const idsProdutos = input.itens.map((i) => i.produtoId);
      const produtosDoCarrinho = await db.query.produtos.findMany({
        where: inArray(produtos.id, idsProdutos),
      });

      for (const item of input.itens) {
        const produto = produtosDoCarrinho.find((p) => p.id === item.produtoId);
        if (produto?.controlarEstoque && produto.estoque < item.quantidade) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Só temos ${produto.estoque} unidade(s) de "${produto.nome}" em estoque no momento.`,
          });
        }
      }

      const freteCalculado = calcularPorCep(input.enderecoEntrega.cep);
      const valorFrete = freteCalculado?.valor ?? 0;
      const total = subtotal + valorFrete;

      const codigoPedido = gerarCodigoPedido();

      const [pedido] = await db
        .insert(pedidos)
        .values({
          codigoPedido,
          clienteNome: input.cliente.nome,
          clienteEmail: input.cliente.email,
          clienteTelefone: input.cliente.telefone,
          clienteDocumento: input.cliente.documento,
          enderecoEntrega: input.enderecoEntrega,
          status: "aguardando_pagamento",
          gateway: "asaas",
          metodoPagamento:
            input.metodoPagamento === "PIX"
              ? "pix"
              : input.metodoPagamento === "BOLETO"
              ? "boleto"
              : "cartao_credito",
          subtotal: subtotal.toFixed(2),
          custoPersonalizacaoTotal: custoPersonalizacaoTotal.toFixed(2),
          frete: valorFrete.toFixed(2),
          total: total.toFixed(2),
        })
        .returning();

      await db.insert(itensPedido).values(
        input.itens.map((item) => ({
          pedidoId: pedido.id,
          produtoId: item.produtoId,
          varianteCorId: item.varianteCorId,
          varianteArgilaId: item.varianteArgilaId ?? null,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario.toFixed(2),
          personalizado: item.personalizado,
          arteCarimboUrl: item.arteCarimboUrl,
          textoCarimbo: item.textoCarimbo,
          observacoesCliente: item.observacoesCliente,
          statusArte: item.personalizado
            ? ("aguardando_upload" as const)
            : ("nao_aplicavel" as const),
        }))
      );

      // Decremento atômico — o WHERE com estoque >= quantidade evita
      // ficar negativo mesmo em pedidos concorrentes na mesma peça.
      for (const item of input.itens) {
        await db
          .update(produtos)
          .set({ estoque: sql`${produtos.estoque} - ${item.quantidade}` })
          .where(
            and(
              eq(produtos.id, item.produtoId),
              eq(produtos.controlarEstoque, true),
              gte(produtos.estoque, item.quantidade)
            )
          );
      }

      await db.insert(pedidoEventos).values({
        pedidoId: pedido.id,
        status: "aguardando_pagamento",
        descricao: "Pedido recebido, aguardando confirmação de pagamento.",
      });

      // Prazo de produção — usa o maior prazo entre os produtos do carrinho.
      const prazoProducaoDias = Math.max(
        ...produtosDoCarrinho.map((p) => p.prazoProducaoDias),
        30
      );

      await enviarEmail({
        para: input.cliente.email,
        assunto: `Pedido ${codigoPedido} recebido — Caro Vargas Cerâmica`,
        html: emailPedidoRecebido({
          nomeCliente: input.cliente.nome,
          codigoPedido,
          prazoProducaoDias,
        }),
      });

      // Integração Asaas — se falhar, o pedido já foi registrado como
      // "aguardando_pagamento" no banco; o erro é reportado ao cliente
      // sem derrubar o servidor.
      try {
        const clienteAsaas = await buscarOuCriarCliente({
          nome: input.cliente.nome,
          email: input.cliente.email,
          documento: input.cliente.documento,
          telefone: input.cliente.telefone,
        });

        const vencimento = new Date();
        vencimento.setDate(vencimento.getDate() + 3);

        const cobranca = await criarCobranca({
          clienteAsaasId: clienteAsaas.id,
          valor: total,
          descricao: `Pedido ${codigoPedido} — Caro Vargas Cerâmica`,
          metodoPagamento: input.metodoPagamento,
          vencimento: vencimento.toISOString().split("T")[0],
          referenciaExterna: codigoPedido,
        });

        await db
          .update(pedidos)
          .set({ gatewayReferenciaId: cobranca.id })
          .where(eq(pedidos.id, pedido.id));

        let pix: { qrCodePix?: string; copiaECola?: string } = {};
        if (input.metodoPagamento === "PIX") {
          const qr = await buscarQrCodePix(cobranca.id);
          pix = { qrCodePix: qr.encodedImage, copiaECola: qr.payload };
        }

        return {
          sucesso: true as const,
          codigoPedido,
          gateway: "asaas" as const,
          linkPagamento: cobranca.invoiceUrl,
          ...pix,
          frete: valorFrete,
          totalCentavos: Math.round(total * 100),
        };
      } catch (erroGateway) {
        console.error(
          `Falha ao processar pagamento Asaas para o pedido ${codigoPedido}:`,
          erroGateway
        );
        // Pedido já está salvo como "aguardando_pagamento" — retorna sucesso
        // parcial em vez de lançar erro, para o client mostrar o código do
        // pedido ao cliente mesmo quando a cobrança falha (mesmo
        // comportamento do endpoint REST original, que respondia 502 com o
        // codigoPedido no corpo).
        return {
          sucesso: false as const,
          codigoPedido,
          erro:
            "Pedido registrado, mas não foi possível gerar a cobrança agora. " +
            "Nossa equipe entrará em contato para concluir o pagamento.",
        };
      }
    }),
});
