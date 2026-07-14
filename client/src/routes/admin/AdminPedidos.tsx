import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "../../lib/trpc";
import { STATUS_PEDIDO, labelStatusPedido, corStatusPedido } from "@shared/const";
import AdminGuard from "./AdminGuard";

function ListaPedidos() {
  const { data: pedidos = [], isLoading } = trpc.pedidos.listar.useQuery();
  const [filtro, setFiltro] = useState<string>("todos");

  const pedidosFiltrados =
    filtro === "todos" ? pedidos : pedidos.filter((p) => p.status === filtro);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin/produtos" className="text-sm text-marrom hover:text-terracota">
        ‹ Voltar aos produtos
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-marrom-escuro">Admin — Pedidos</h1>

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="rounded-lg border border-borda bg-creme px-3 py-2 text-sm text-marrom-escuro"
        >
          <option value="todos">Todos os status</option>
          {STATUS_PEDIDO.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="mt-6 text-marrom">Carregando…</p>}

      {!isLoading && pedidosFiltrados.length === 0 && (
        <p className="mt-6 text-marrom">Nenhum pedido encontrado.</p>
      )}

      {pedidosFiltrados.length > 0 && (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-borda text-left text-marrom">
              <th className="py-2">Código</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Total</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map((p) => (
              <tr key={p.id} className="border-b border-borda/50">
                <td className="py-2 font-mono text-xs">{p.codigoPedido}</td>
                <td>{p.clienteNome}</td>
                <td>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${corStatusPedido(p.status)}`}
                  >
                    {labelStatusPedido(p.status)}
                  </span>
                </td>
                <td>R$ {Number(p.total).toFixed(2).replace(".", ",")}</td>
                <td>{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</td>
                <td>
                  <Link
                    href={`/admin/pedidos/${p.codigoPedido}`}
                    className="text-terracota hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminPedidos() {
  return (
    <AdminGuard>
      <ListaPedidos />
    </AdminGuard>
  );
}
