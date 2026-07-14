import { Link } from "wouter";
import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";

function ListaClientes() {
  const { data: clientes = [], isLoading } = trpc.clientes.listar.useQuery();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin/produtos" className="text-sm text-marrom hover:text-terracota">
        ‹ Voltar aos produtos
      </Link>

      <h1 className="mt-2 font-serif text-2xl text-marrom-escuro">Admin — Clientes</h1>
      <p className="mt-1 text-sm text-marrom">
        Pessoas que já finalizaram pelo menos um pedido (diferente da lista de
        e-mails da newsletter).
      </p>

      {isLoading && <p className="mt-6 text-marrom">Carregando…</p>}

      {!isLoading && clientes.length === 0 && (
        <p className="mt-6 text-marrom">Nenhum pedido finalizado ainda.</p>
      )}

      {clientes.length > 0 && (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-borda text-left text-marrom">
              <th className="py-2">Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Pedidos</th>
              <th>Total gasto</th>
              <th>Último pedido</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.email} className="border-b border-borda/50">
                <td className="py-2">{c.nome}</td>
                <td>{c.email}</td>
                <td>{c.telefone}</td>
                <td>{c.totalPedidos}</td>
                <td>R$ {Number(c.totalGasto).toFixed(2).replace(".", ",")}</td>
                <td>{new Date(c.ultimoPedidoEm).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminClientes() {
  return (
    <AdminGuard>
      <ListaClientes />
    </AdminGuard>
  );
}
