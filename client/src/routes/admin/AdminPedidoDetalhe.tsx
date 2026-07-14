import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "wouter";
import { trpc } from "../../lib/trpc";
import { STATUS_PEDIDO, labelStatusPedido, corStatusPedido } from "@shared/const";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Badge, Label, campoBase } from "./AdminUI";

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[#8C7A6B]">{titulo}</p>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

function Detalhe() {
  const { codigo } = useParams<{ codigo: string }>();
  const utils = trpc.useUtils();

  const { data: pedido, isLoading } = trpc.pedidos.buscarPorCodigo.useQuery(
    { codigoPedido: codigo ?? "" },
    { enabled: !!codigo }
  );

  const [transportadora, setTransportadora] = useState("");
  const [codigoRastreio, setCodigoRastreio] = useState("");

  useEffect(() => {
    if (!pedido) return;
    setTransportadora(pedido.transportadora ?? "");
    setCodigoRastreio(pedido.codigoRastreio ?? "");
  }, [pedido]);

  const atualizarStatus = trpc.pedidos.atualizarStatus.useMutation({
    onSuccess: () => utils.pedidos.buscarPorCodigo.invalidate({ codigoPedido: codigo }),
  });

  if (isLoading)
    return (
      <AdminLayout titulo="Pedido">
        <p className="text-sm text-[#8C7A6B]">Carregando…</p>
      </AdminLayout>
    );
  if (!pedido)
    return (
      <AdminLayout titulo="Pedido">
        <p className="text-sm text-[#8C7A6B]">Pedido não encontrado.</p>
      </AdminLayout>
    );

  const endereco = pedido.enderecoEntrega;

  function mudarStatus(novoStatus: string) {
    if (!pedido) return;
    atualizarStatus.mutate({
      codigoPedido: pedido.codigoPedido,
      status: novoStatus as typeof pedido.status,
      ...(transportadora.trim() && { transportadora: transportadora.trim() }),
      ...(codigoRastreio.trim() && { codigoRastreio: codigoRastreio.trim() }),
    });
  }

  return (
    <AdminLayout
      titulo={`Pedido ${pedido.codigoPedido}`}
      acoes={<Badge cor={corStatusPedido(pedido.status)}>{labelStatusPedido(pedido.status)}</Badge>}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Secao titulo="Itens do pedido">
            <div className="space-y-3">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-black/5 pb-3 last:border-0 last:pb-0">
                  {item.produto.imagens?.[0] && (
                    <img
                      src={item.produto.imagens[0]}
                      alt=""
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2B2420]">
                      {item.quantidade}× {item.produto.nome}
                    </p>
                    {(item.varianteCor || item.varianteArgila) && (
                      <p className="mt-0.5 text-xs text-[#8C7A6B]">
                        {item.varianteArgila && `Argila: ${item.varianteArgila.nome}`}
                        {item.varianteArgila && item.varianteCor && " · "}
                        {item.varianteCor && `Esmalte: ${item.varianteCor.nome}`}
                      </p>
                    )}
                    {item.personalizado && (
                      <div className="mt-2 rounded-lg bg-terracota/[0.06] p-2.5 text-xs text-[#2B2420]">
                        <p className="font-medium">Personalizado</p>
                        {item.textoCarimbo && <p>Texto: {item.textoCarimbo}</p>}
                        {item.arteCarimboUrl && (
                          <a
                            href={item.arteCarimboUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-terracota underline"
                          >
                            Ver arte enviada
                          </a>
                        )}
                        {item.observacoesCliente && <p>Obs: {item.observacoesCliente}</p>}
                      </div>
                    )}
                  </div>
                  <p className="flex-shrink-0 text-sm text-[#2B2420]">
                    R$ {Number(item.precoUnitario).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
            </div>
          </Secao>

          <Secao titulo="Linha do tempo">
            <div className="space-y-4 border-l-2 border-black/10 pl-4">
              {pedido.eventos.map((evento) => (
                <div key={evento.id}>
                  <p className="text-sm font-medium text-[#2B2420]">
                    {labelStatusPedido(evento.status)}
                  </p>
                  {evento.descricao && (
                    <p className="text-xs text-[#8C7A6B]">{evento.descricao}</p>
                  )}
                  <p className="text-xs text-[#8C7A6B]/70">
                    {new Date(evento.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </Secao>
        </div>

        <div className="space-y-6">
          <Secao titulo="Atualizar status">
            <select
              value={pedido.status}
              onChange={(e) => mudarStatus(e.target.value)}
              disabled={atualizarStatus.isPending}
              className={campoBase}
            >
              {STATUS_PEDIDO.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="mt-4 space-y-3">
              <div>
                <Label>Transportadora</Label>
                <input
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                  placeholder="Ex: Jadlog, Correios"
                  className={campoBase}
                />
              </div>
              <div>
                <Label>Código de rastreio</Label>
                <input
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value)}
                  placeholder="Ex: JD123456789BR"
                  className={campoBase}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#8C7A6B]">
              Preenche transportadora e código antes de mudar pra "Enviado" — o
              e-mail automático pro cliente já sai com esses dados.
            </p>
          </Secao>

          <Secao titulo="Cliente">
            <p className="text-sm font-medium text-[#2B2420]">{pedido.clienteNome}</p>
            <p className="mt-1 text-sm text-[#6b6459]">{pedido.clienteEmail}</p>
            <p className="text-sm text-[#6b6459]">{pedido.clienteTelefone}</p>
            <p className="text-sm text-[#6b6459]">{pedido.clienteDocumento}</p>
          </Secao>

          <Secao titulo="Endereço de entrega">
            {endereco ? (
              <p className="text-sm text-[#2B2420]">
                {endereco.logradouro}, {endereco.numero}
                {endereco.complemento && ` — ${endereco.complemento}`}
                <br />
                {endereco.bairro} — {endereco.cidade}/{endereco.uf}
                <br />
                CEP {endereco.cep}
              </p>
            ) : (
              <p className="text-sm text-[#8C7A6B]">Não informado.</p>
            )}
          </Secao>

          <Secao titulo="Pagamento">
            <div className="space-y-1.5 text-sm text-[#2B2420]">
              <p className="flex justify-between">
                <span className="text-[#8C7A6B]">Subtotal</span>
                <span>R$ {Number(pedido.subtotal).toFixed(2).replace(".", ",")}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#8C7A6B]">Frete</span>
                <span>R$ {Number(pedido.frete ?? 0).toFixed(2).replace(".", ",")}</span>
              </p>
              <p className="flex justify-between border-t border-black/5 pt-1.5 font-medium">
                <span>Total</span>
                <span>R$ {Number(pedido.total).toFixed(2).replace(".", ",")}</span>
              </p>
              <p className="flex justify-between pt-1 text-xs text-[#8C7A6B]">
                <span>Gateway</span>
                <span className="capitalize">{pedido.gateway}</span>
              </p>
            </div>
          </Secao>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminPedidoDetalhe() {
  return (
    <AdminGuard>
      <Detalhe />
    </AdminGuard>
  );
}
