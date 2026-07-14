import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "../../lib/trpc";
import { STATUS_PEDIDO, labelStatusPedido, corStatusPedido } from "@shared/const";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Badge, EmptyState, campoBase } from "./AdminUI";

function ListaPedidos() {
  const { data: pedidos = [], isLoading } = trpc.pedidos.listar.useQuery();
  const [filtro, setFiltro] = useState<string>("todos");

  const pedidosFiltrados =
    filtro === "todos" ? pedidos : pedidos.filter((p) => p.status === filtro);

  return (
    <AdminLayout
      titulo="Pedidos"
      acoes={
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={`${campoBase} mt-0 w-auto min-w-[10rem] py-2`}
        >
          <option value="todos">Todos os status</option>
          {STATUS_PEDIDO.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.label}
            </option>
          ))}
        </select>
      }
    >
      {isLoading && <p className="text-sm text-[#8C7A6B]">Carregando…</p>}

      {!isLoading && pedidosFiltrados.length === 0 && (
        <EmptyState>Nenhum pedido encontrado.</EmptyState>
      )}

      {pedidosFiltrados.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] text-left text-xs uppercase tracking-wide text-[#8C7A6B]">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Data</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                  <td className="px-5 py-3 font-mono text-xs text-[#2B2420]">{p.codigoPedido}</td>
                  <td className="px-3 py-3 text-[#2B2420]">{p.clienteNome}</td>
                  <td className="px-3 py-3">
                    <Badge cor={corStatusPedido(p.status)}>{labelStatusPedido(p.status)}</Badge>
                  </td>
                  <td className="px-3 py-3 text-[#6b6459]">
                    R$ {Number(p.total).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-3 py-3 text-[#6b6459]">
                    {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${p.codigoPedido}`}
                      className="text-sm font-medium text-terracota hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AdminLayout>
  );
}

export default function AdminPedidos() {
  return (
    <AdminGuard>
      <ListaPedidos />
    </AdminGuard>
  );
}
