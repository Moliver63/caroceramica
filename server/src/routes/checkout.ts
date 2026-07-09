import { Router } from "express";
import { db } from "../db";
import { pedidos, itensPedido } from "../db/schema";
import { buscarOuCriarCliente, criarCobranca, buscarQrCodePix } from "../lib/asaas";
import { eq } from "drizzle-orm";

export const checkoutRouter = Router();

interface CriarPedidoBody {
  cliente: { nome: string; email: string; telefone: string; documento: string };
  enderecoEntrega: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    pais: string;
  };
  itens: Array<{
    produtoId: number;
    varianteCorId: number | null;
    quantidade: number;
    precoUnitario: number;
    personalizado: boolean;
    arteCarimboUrl?: string;
    textoCarimbo?: string;
    observacoesCliente?: string;
  }>;
  metodoPagamento: "PIX" | "BOLETO" | "CREDIT_CARD";
}

function gerarCodigoPedido() {
  const ano = new Date().getFullYear();
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `CC-${ano}-${aleatorio}`;
}

// POST /api/checkout
checkoutRouter.post("/", async (req, res) => {
  const body = req.body as CriarPedidoBody;

  // Regra de roteamento de gateway: Brasil -> Asaas.
  // Fora do Brasil -> bloqueado por enquanto (Stripe é fase 2).
  if (body.enderecoEntrega.pais !== "BR") {
    return res.status(400).json({
      erro:
        "Envios internacionais ainda não estão disponíveis. Em breve via Stripe.",
    });
  }

  const subtotal = body.itens.reduce(
    (soma, item) => soma + item.precoUnitario * item.quantidade,
    0
  );
  const custoPersonalizacaoTotal = body.itens
    .filter((i) => i.personalizado)
    .reduce((soma) => soma, 0); // custo já embutido no precoUnitario enviado pelo client

  const total = subtotal; // frete calculado em etapa futura (Correios/Melhor Envio)

  const codigoPedido = gerarCodigoPedido();

  const [pedido] = await db
    .insert(pedidos)
    .values({
      codigoPedido,
      clienteNome: body.cliente.nome,
      clienteEmail: body.cliente.email,
      clienteTelefone: body.cliente.telefone,
      clienteDocumento: body.cliente.documento,
      enderecoEntrega: body.enderecoEntrega,
      status: "aguardando_pagamento",
      gateway: "asaas",
      metodoPagamento:
        body.metodoPagamento === "PIX"
          ? "pix"
          : body.metodoPagamento === "BOLETO"
          ? "boleto"
          : "cartao_credito",
      subtotal: subtotal.toFixed(2),
      custoPersonalizacaoTotal: custoPersonalizacaoTotal.toFixed(2),
      total: total.toFixed(2),
    })
    .returning();

  await db.insert(itensPedido).values(
    body.itens.map((item) => ({
      pedidoId: pedido.id,
      produtoId: item.produtoId,
      varianteCorId: item.varianteCorId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario.toFixed(2),
      personalizado: item.personalizado,
      arteCarimboUrl: item.arteCarimboUrl,
      textoCarimbo: item.textoCarimbo,
      observacoesCliente: item.observacoesCliente,
      statusArte: item.personalizado ? "aguardando_upload" : "nao_aplicavel",
    }))
  );

  // Integração Asaas
  const clienteAsaas = await buscarOuCriarCliente({
    nome: body.cliente.nome,
    email: body.cliente.email,
    documento: body.cliente.documento,
    telefone: body.cliente.telefone,
  });

  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() + 3);

  const cobranca = await criarCobranca({
    clienteAsaasId: clienteAsaas.id,
    valor: total,
    descricao: `Pedido ${codigoPedido} — Caro Cerâmica`,
    metodoPagamento: body.metodoPagamento,
    vencimento: vencimento.toISOString().split("T")[0],
    referenciaExterna: codigoPedido,
  });

  await db
    .update(pedidos)
    .set({ gatewayReferenciaId: cobranca.id })
    .where(eq(pedidos.id, pedido.id));

  let pix: { qrCodePix?: string; copiaECola?: string } = {};
  if (body.metodoPagamento === "PIX") {
    const qr = await buscarQrCodePix(cobranca.id);
    pix = { qrCodePix: qr.encodedImage, copiaECola: qr.payload };
  }

  res.status(201).json({
    codigoPedido,
    gateway: "asaas",
    linkPagamento: cobranca.invoiceUrl,
    ...pix,
    totalCentavos: Math.round(total * 100),
  });
});

// POST /api/checkout/webhook — recebido pelo Asaas em mudanças de status
checkoutRouter.post("/webhook", async (req, res) => {
  const { event, payment } = req.body;

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    await db
      .update(pedidos)
      .set({ status: "pago", atualizadoEm: new Date() })
      .where(eq(pedidos.gatewayReferenciaId, payment.id));
  }

  res.sendStatus(200);
});
