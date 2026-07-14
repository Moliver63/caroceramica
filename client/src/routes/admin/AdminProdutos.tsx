import { Link } from "wouter";
import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";

function ListaProdutos() {
  const { data: produtos = [] } = trpc.produtos.listar.useQuery();
  const logout = trpc.admin.logout.useMutation();
  const utils = trpc.useUtils();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-marrom-escuro">Admin — Produtos</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/leads"
            className="rounded-full border border-borda px-5 py-2.5 text-sm text-marrom-escuro"
          >
            E-mails cadastrados
          </Link>
          <Link
            href="/admin/produtos/novo"
            className="rounded-full bg-marrom-escuro px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a2e26]"
          >
            + Nova peça
          </Link>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => utils.admin.sessaoAtual.invalidate() })}
            className="rounded-full border border-borda px-5 py-2.5 text-sm text-marrom-escuro"
          >
            Sair
          </button>
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-borda text-left text-marrom">
            <th className="py-2">Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Personalizável</th>
            <th>Ativo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id} className="border-b border-borda/50">
              <td className="py-2">{p.nome}</td>
              <td>{p.categoria}</td>
              <td>R$ {Number(p.precoBase).toFixed(2).replace(".", ",")}</td>
              <td>{p.personalizavel ? "Sim" : "Não"}</td>
              <td>{p.ativo ? "Ativo" : "Inativo"}</td>
              <td>
                <Link href={`/admin/produtos/${p.slug}/editar`} className="text-terracota hover:underline">
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {produtos.length === 0 && (
        <p className="mt-6 text-marrom">Nenhuma peça cadastrada ainda.</p>
      )}
    </div>
  );
}

export default function AdminProdutos() {
  return (
    <AdminGuard>
      <ListaProdutos />
    </AdminGuard>
  );
}
