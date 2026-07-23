import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "../../lib/trpc";
import { labelCategoria } from "@shared/const";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Botao, EmptyState } from "./AdminUI";

function formatarReal(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function dataISO(d: Date) {
  return d.toISOString().split("T")[0];
}

const LABEL_METODO: Record<string, string> = {
  pix: "Pix",
  boleto: "Boleto",
  cartao_credito: "Cartão de crédito",
  "não informado": "Não informado",
};

type Preset = "hoje" | "7d" | "30d" | "mes" | "ano" | "personalizado";

function calcularPeriodo(preset: Preset): { desde: string; ate: string } {
  const hoje = new Date();
  const ate = dataISO(hoje);

  if (preset === "hoje") return { desde: ate, ate };
  if (preset === "7d") {
    const d = new Date(hoje);
    d.setDate(d.getDate() - 6);
    return { desde: dataISO(d), ate };
  }
  if (preset === "30d") {
    const d = new Date(hoje);
    d.setDate(d.getDate() - 29);
    return { desde: dataISO(d), ate };
  }
  if (preset === "mes") {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { desde: dataISO(d), ate };
  }
  if (preset === "ano") {
    const d = new Date(hoje.getFullYear(), 0, 1);
    return { desde: dataISO(d), ate };
  }
  return { desde: ate, ate };
}

function CartaoMetrica({
  titulo,
  valor,
  detalhe,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[#8C7A6B]">{titulo}</p>
      <p className={`mt-2 text-2xl font-semibold ${destaque ? "text-terracota" : "text-[#2B2420]"}`}>
        {valor}
      </p>
      {detalhe && <p className="mt-1 text-xs text-[#8C7A6B]">{detalhe}</p>}
    </Card>
  );
}

function Financeiro() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [periodoCustom, setPeriodoCustom] = useState(calcularPeriodo("30d"));

  const periodo = preset === "personalizado" ? periodoCustom : calcularPeriodo(preset);

  const { data, isLoading } = trpc.financeiro.resumo.useQuery(periodo);
  const exportarQuery = trpc.financeiro.exportar.useQuery(periodo, { enabled: false });

  const dadosGrafico = useMemo(
    () =>
      (data?.porDia ?? []).map((d) => ({
        ...d,
        rotulo: new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
      })),
    [data]
  );

  async function exportarCsv() {
    const resultado = await exportarQuery.refetch();
    const linhas = resultado.data ?? [];
    if (linhas.length === 0) return;

    const cabecalho = "codigo_pedido,data,cliente,status,metodo_pagamento,subtotal,frete,total";
    const corpo = linhas.map((l) =>
      [l.codigoPedido, l.data, `"${l.cliente}"`, l.status, l.metodoPagamento, l.subtotal, l.frete, l.total].join(",")
    );
    const csv = [cabecalho, ...corpo].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${periodo.desde}-a-${periodo.ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const PRESETS: { valor: Preset; label: string }[] = [
    { valor: "hoje", label: "Hoje" },
    { valor: "7d", label: "7 dias" },
    { valor: "30d", label: "30 dias" },
    { valor: "mes", label: "Este mês" },
    { valor: "ano", label: "Este ano" },
    { valor: "personalizado", label: "Personalizado" },
  ];

  return (
    <AdminLayout
      titulo="Financeiro"
      acoes={
        <Botao variante="secundario" onClick={exportarCsv} disabled={exportarQuery.isFetching}>
          {exportarQuery.isFetching ? "Gerando…" : "Exportar CSV"}
        </Botao>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPreset(p.valor)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              preset === p.valor
                ? "bg-carvao text-creme"
                : "border border-black/10 bg-white text-[#2B2420] hover:bg-black/[0.03]"
            }`}
          >
            {p.label}
          </button>
        ))}

        {preset === "personalizado" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={periodoCustom.desde}
              onChange={(e) => setPeriodoCustom((p) => ({ ...p, desde: e.target.value }))}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2B2420]"
            />
            <span className="text-sm text-[#8C7A6B]">até</span>
            <input
              type="date"
              value={periodoCustom.ate}
              onChange={(e) => setPeriodoCustom((p) => ({ ...p, ate: e.target.value }))}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2B2420]"
            />
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-[#8C7A6B]">Carregando…</p>}

      {data && (
        <div className="space-y-6">
          {/* Métricas principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CartaoMetrica
              titulo="Faturamento confirmado"
              valor={formatarReal(data.faturamentoConfirmado)}
              detalhe={`${data.pedidosConfirmados} pedido${data.pedidosConfirmados !== 1 ? "s" : ""} pago${data.pedidosConfirmados !== 1 ? "s" : ""}`}
              destaque
            />
            <CartaoMetrica titulo="Ticket médio" valor={formatarReal(data.ticketMedio)} />
            <CartaoMetrica
              titulo="Aguardando pagamento"
              valor={formatarReal(data.faturamentoPendente)}
              detalhe={`${data.pedidosPendentes} pedido${data.pedidosPendentes !== 1 ? "s" : ""} — ainda não é receita`}
            />
            <CartaoMetrica
              titulo="Cancelado"
              valor={formatarReal(data.faturamentoCancelado)}
              detalhe={`${data.pedidosCancelados} pedido${data.pedidosCancelados !== 1 ? "s" : ""}`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CartaoMetrica titulo="Faturamento em produtos" valor={formatarReal(data.faturamentoProdutos)} />
            <CartaoMetrica titulo="Faturamento em frete" valor={formatarReal(data.faturamentoFrete)} />
          </div>

          {/* Gráfico de evolução */}
          <Card className="p-5">
            <p className="text-sm font-semibold text-[#2B2420]">Evolução do faturamento</p>
            <div className="mt-4 h-64">
              {dadosGrafico.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[#8C7A6B]">
                  Sem pedidos pagos nesse período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                    <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: "#8C7A6B" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#8C7A6B" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${v}`}
                    />
                    <Tooltip
                      formatter={(valor) => formatarReal(Number(valor))}
                      labelStyle={{ color: "#2B2420" }}
                      contentStyle={{ borderRadius: 8, border: "1px solid #00000010" }}
                    />
                    <Bar dataKey="faturamento" fill="#B08D6E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Por categoria */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-[#2B2420]">Faturamento por categoria</p>
              {data.porCategoria.length === 0 ? (
                <p className="mt-4 text-sm text-[#8C7A6B]">Sem dados no período.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.porCategoria.map((c) => {
                    const percentual =
                      data.faturamentoProdutos > 0 ? (c.faturamento / data.faturamentoProdutos) * 100 : 0;
                    return (
                      <div key={c.categoria}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#2B2420]">{labelCategoria(c.categoria)}</span>
                          <span className="text-[#6b6459]">{formatarReal(c.faturamento)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
                          <div
                            className="h-full rounded-full bg-terracota"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Métodos de pagamento */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-[#2B2420]">Métodos de pagamento</p>
              {data.porMetodo.length === 0 ? (
                <p className="mt-4 text-sm text-[#8C7A6B]">Sem dados no período.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.porMetodo.map((m) => (
                    <div key={m.metodo} className="flex items-center justify-between text-sm">
                      <span className="text-[#2B2420]">{LABEL_METODO[m.metodo] ?? m.metodo}</span>
                      <span className="text-[#6b6459]">
                        {formatarReal(m.faturamento)} · {m.pedidos} pedido{m.pedidos !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Top produtos */}
          <Card className="overflow-x-auto p-5">
            <p className="text-sm font-semibold text-[#2B2420]">Peças mais vendidas</p>
            {data.topProdutos.length === 0 ? (
              <EmptyState>Sem vendas confirmadas nesse período.</EmptyState>
            ) : (
              <table className="mt-4 w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-[#8C7A6B]">
                    <th className="py-2">Peça</th>
                    <th>Quantidade vendida</th>
                    <th>Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProdutos.map((p) => (
                    <tr key={p.nome} className="border-b border-black/5 last:border-0">
                      <td className="py-2 text-[#2B2420]">{p.nome}</td>
                      <td className="text-[#6b6459]">{p.quantidade}</td>
                      <td className="text-[#6b6459]">{formatarReal(p.faturamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminFinanceiro() {
  return (
    <AdminGuard>
      <Financeiro />
    </AdminGuard>
  );
}
