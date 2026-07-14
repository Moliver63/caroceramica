import { Link, useParams } from "wouter";
import { trpc } from "../../lib/trpc";
import { STATUS_PEDIDO, labelStatusPedido, corStatusPedido } from "@shared/const";
import AdminGuard from "./AdminGuard";

function Detalhe() {
  const { codigo } = useParams<{ codigo: string }>();
  const utils = trpc.useUtils();

  const { data: pedido, isLoading } = trpc.pedidos.buscarPorCodigo.useQuery(
    { codigoPedido: codigo ?? "" },
    { enabled: !!codigo }
  );

  const atualizarStatus = trpc.pedidos.atualizarStatus.useMutation({
    onSuccess: () => utils.pedidos.buscarPorCodigo.invalidate({ codigoPedido: codigo }),
  });

  if (isLoading) return <div className="p-10 text-center text-marrom">Carregando…</div>;
  if (!pedido) return <div className="p-10 text-center text-marrom">Pedido não encontrado.</div>;

  const endereco = pedido.enderecoEntrega;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/pedidos" className="text-sm text-marrom hover:text-terracota">
        ‹ Voltar aos pedidos
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-marrom-escuro">
          Pedido <span className="font-mono">{pedido.codigoPedido}</span>
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${corStatusPedido(pedido.status)}`}
        >
          {labelStatusPedido(pedido.status)}
        </span>
      </div>

      <div className="mt-6">
        <label className="text-sm text-marrom">Atualizar status</label>
        <select
          value={pedido.status}
          onChange={(e) =>
            atualizarStatus.mutate({ codigoPedido: pedido.codigoPedido, status: e.target.value as typeof pedido.status })
          }
          disabled={atualizarStatus.isPending}
          className="mt-1 block w-full max-w-xs rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
        >
          {STATUS_PEDIDO.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-borda p-4">
          <p className="eyebrow text-marrom/60">Cliente</p>
          <p className="mt-2 text-marrom-escuro">{pedido.clienteNome}</p>
          <p className="text-sm text-marrom">{pedido.clienteEmail}</p>
          <p className="text-sm text-marrom">{pedido.clienteTelefone}</p>
          <p className="text-sm text-marrom">{pedido.clienteDocumento}</p>
        </div>

        <div className="rounded-lg border border-borda p-4">
          <p className="eyebrow text-marrom/60">Endereço de entrega</p>
          {endereco ? (
            <p className="mt-2 text-sm text-marrom-escuro">
              {endereco.logradouro}, {endereco.numero}
              {endereco.complemento && ` — ${endereco.complemento}`}
              <br />
              {endereco.bairro} — {endereco.cidade}/{endereco.uf}
              <br />
              CEP {endereco.cep}
            </p>
          ) : (
            <p className="mt-2 text-sm text-marrom">Não informado.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-borda p-4">
        <p className="eyebrow text-marrom/60">Pagamento</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-marrom-escuro sm:grid-cols-4">
          <p>Subtotal: R$ {Number(pedido.subtotal).toFixed(2).replace(".", ",")}</p>
          <p>Frete: R$ {Number(pedido.frete ?? 0).toFixed(2).replace(".", ",")}</p>
          <p className="font-medium">
            Total: R$ {Number(pedido.total).toFixed(2).replace(".", ",")}
          </p>
          <p className="capitalize">Gateway: {pedido.gateway}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="eyebrow text-marrom/60">Itens do pedido</p>
        <div className="mt-3 space-y-3">
          {pedido.itens.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border border-borda p-4">
              {item.produto.imagens?.[0] && (
                <img
                  src={item.produto.imagens[0]}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-marrom-escuro">
                  {item.quantidade}× {item.produto.nome}
                </p>
                {(item.varianteCor || item.varianteArgila) && (
                  <p className="text-xs text-marrom">
                    {item.varianteArgila && `Argila: ${item.varianteArgila.nome}`}
                    {item.varianteArgila && item.varianteCor && " · "}
                    {item.varianteCor && `Esmalte: ${item.varianteCor.nome}`}
                  </p>
                )}
                {item.personalizado && (
                  <div className="mt-1 rounded bg-terracota/10 p-2 text-xs text-marrom-escuro">
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
              <p className="text-marrom-escuro">
                R$ {Number(item.precoUnitario).toFixed(2).replace(".", ",")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPedidoDetalhe() {
  return (
    <AdminGuard>
      <Detalhe />
    </AdminGuard>
  );
}
