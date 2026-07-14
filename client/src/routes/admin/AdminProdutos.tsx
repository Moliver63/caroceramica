import { Link } from "wouter";
import { trpc } from "../../lib/trpc";
import { labelCategoria } from "@shared/const";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Badge, BotaoLink, EmptyState } from "./AdminUI";

function ListaProdutos() {
  const { data: produtos = [], isLoading } = trpc.produtos.listar.useQuery();

  return (
    <AdminLayout
      titulo="Produtos"
      acoes={
        <BotaoLink href="/admin/produtos/novo" variante="primario">
          + Nova peça
        </BotaoLink>
      }
    >
      {isLoading && <p className="text-sm text-[#8C7A6B]">Carregando…</p>}

      {!isLoading && produtos.length === 0 && (
        <EmptyState>Nenhuma peça cadastrada ainda.</EmptyState>
      )}

      {produtos.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] text-left text-xs uppercase tracking-wide text-[#8C7A6B]">
                <th className="px-5 py-3 font-medium">Peça</th>
                <th className="px-3 py-3 font-medium">Categoria</th>
                <th className="px-3 py-3 font-medium">Preço</th>
                <th className="px-3 py-3 font-medium">Estoque</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                  <td className="px-5 py-3 font-medium text-[#2B2420]">{p.nome}</td>
                  <td className="px-3 py-3 text-[#6b6459]">{labelCategoria(p.categoria)}</td>
                  <td className="px-3 py-3 text-[#6b6459]">
                    {p.precoSobConsulta ? "Sob consulta" : `R$ ${Number(p.precoBase).toFixed(2).replace(".", ",")}`}
                  </td>
                  <td className="px-3 py-3 text-[#6b6459]">
                    {p.controlarEstoque ? p.estoque : <span className="text-[#8C7A6B]/60">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <Badge cor={p.ativo ? "bg-esmalte-claro text-esmalte" : "bg-black/5 text-[#8C7A6B]"}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/produtos/${p.slug}/editar`}
                      className="text-sm font-medium text-terracota hover:underline"
                    >
                      Editar
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

export default function AdminProdutos() {
  return (
    <AdminGuard>
      <ListaProdutos />
    </AdminGuard>
  );
}
