import { Link } from "wouter";
import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";

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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/produtos" className="text-sm text-marrom hover:text-terracota">
        ‹ Voltar aos produtos
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-marrom-escuro">Admin — Lista de e-mails</h1>
        <button
          onClick={exportarCsv}
          disabled={leads.length === 0}
          className="rounded-full border border-borda px-5 py-2.5 text-sm text-marrom-escuro disabled:opacity-40"
        >
          Exportar CSV
        </button>
      </div>

      <p className="mt-2 text-sm text-marrom">{leads.length} cadastrados</p>

      {isLoading && <p className="mt-6 text-marrom">Carregando…</p>}

      {!isLoading && leads.length === 0 && (
        <p className="mt-6 text-marrom">Ninguém cadastrou o e-mail ainda.</p>
      )}

      {leads.length > 0 && (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-borda text-left text-marrom">
              <th className="py-2">E-mail</th>
              <th>Nome</th>
              <th>Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-borda/50">
                <td className="py-2">{l.email}</td>
                <td>{l.nome ?? "—"}</td>
                <td>{new Date(l.criadoEm).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminLeads() {
  return (
    <AdminGuard>
      <ListaLeads />
    </AdminGuard>
  );
}
