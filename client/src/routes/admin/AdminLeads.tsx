import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Botao, EmptyState } from "./AdminUI";

function ListaLeads() {
  const { data: leads = [], isLoading } = trpc.leads.listar.useQuery();

  function exportarCsv() {
    const linhas = [
      "email,nome,cadastrado_em",
      ...leads.map(
        (l) =>
          `${l.email},${l.nome ?? ""},${new Date(l.criadoEm).toLocaleDateString("pt-BR")}`
      ),
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads-caro-vargas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout
      titulo="Newsletter"
      acoes={
        <Botao variante="secundario" onClick={exportarCsv} disabled={leads.length === 0}>
          Exportar CSV
        </Botao>
      }
    >
      <p className="-mt-3 mb-6 text-sm text-[#8C7A6B]">
        {leads.length} {leads.length === 1 ? "e-mail cadastrado" : "e-mails cadastrados"} pra receber novidades.
      </p>

      {isLoading && <p className="text-sm text-[#8C7A6B]">Carregando…</p>}

      {!isLoading && leads.length === 0 && (
        <EmptyState>Ninguém cadastrou o e-mail ainda.</EmptyState>
      )}

      {leads.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] text-left text-xs uppercase tracking-wide text-[#8C7A6B]">
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-3 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Cadastrado em</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                  <td className="px-5 py-3 text-[#2B2420]">{l.email}</td>
                  <td className="px-3 py-3 text-[#6b6459]">{l.nome ?? "—"}</td>
                  <td className="px-5 py-3 text-[#6b6459]">
                    {new Date(l.criadoEm).toLocaleDateString("pt-BR")}
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

export default function AdminLeads() {
  return (
    <AdminGuard>
      <ListaLeads />
    </AdminGuard>
  );
}
