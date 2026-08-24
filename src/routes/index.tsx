import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { CalendarioVencimentos } from "@/components/finance/CalendarioVencimentos";
import { KpiCard } from "@/components/finance/KpiCard";
import { useAccounts } from "@/components/finance/accounts-context";
import { useCategories } from "@/components/finance/categories-context";
import { usePeriod } from "@/components/finance/period-context";
import { useTransactions } from "@/components/finance/transactions-context";
import { MONTHS, categoriaPorId, formatBRL, formatDate, getMonth } from "@/lib/finance-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Planejamento Financeiro" },
      {
        name: "description",
        content: "Visão geral de saldo, entradas, saídas e taxa de poupança do mês.",
      },
      { property: "og:title", content: "Dashboard | Planejamento Financeiro" },
      {
        property: "og:description",
        content: "Acompanhe KPIs, contas, calendário e distribuição de gastos por categoria.",
      },
    ],
  }),
  component: Dashboard,
});

const DONUT_COLORS = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--primary)",
];

function Dashboard() {
  const { items } = useTransactions();
  const { items: accounts } = useAccounts();
  const { items: categorias } = useCategories();
  const { month, year } = usePeriod();

  const inPeriod = items.filter(
    (t) => Number(t.data.slice(0, 4)) === year && (month === 0 || getMonth(t) === month),
  );

  // Simplificação de mock (igual à de Lançamentos): só entrada/saída contam
  // nos KPIs de fluxo — guardado, retirado, rendimento, perda e
  // transferência dependem de conta/destino, e ficam para a integração real.
  const income = inPeriod.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const expense = inPeriod.filter((t) => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);
  const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const totalBalance = items
    .filter((t) => Number(t.data.slice(0, 4)) === year)
    .reduce((a, t) => a + (t.tipo === "entrada" ? t.valor : t.tipo === "saida" ? -t.valor : 0), 0);

  const monthly = MONTHS.map((label, i) => {
    const rows = items.filter((t) => Number(t.data.slice(0, 4)) === year && getMonth(t) === i + 1);
    const e = rows.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
    const s = rows.filter((t) => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);
    return { mes: label, Entradas: e, Saídas: s, Saldo: e - s };
  }).filter((m) => m.Entradas > 0 || m["Saídas"] > 0);

  const byCategory = Object.entries(
    inPeriod
      .filter((t) => t.tipo === "saida")
      .reduce<Record<string, number>>((acc, t) => {
        const nome = categoriaPorId(t.categoriaId)?.nome ?? "Sem categoria";
        acc[nome] = (acc[nome] ?? 0) + t.valor;
        return acc;
      }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const recent = [...inPeriod].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6);

  const mesCalendario = month === 0 ? null : month;

  return (
    <AppShell
      title="Dashboard"
      subtitle={month === 0 ? `Visão do ano ${year}` : `${MONTHS[month - 1]} de ${year}`}
      actions={
        month !== 0 ? (
          <Button asChild size="sm" className="gap-2">
            <Link to="/mes/$ano/$mes" params={{ ano: String(year), mes: String(month) }}>
              Ver detalhes de {MONTHS[month - 1]}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Saldo Total"
          value={formatBRL(totalBalance)}
          hint={`Acumulado em ${year}`}
          icon={Wallet}
        />
        <KpiCard
          label="Entradas do Período"
          value={formatBRL(income)}
          hint={`${inPeriod.filter((t) => t.tipo === "entrada").length} lançamentos`}
          icon={ArrowUpRight}
          tone="income"
        />
        <KpiCard
          label="Saídas do Período"
          value={formatBRL(expense)}
          hint={`${inPeriod.filter((t) => t.tipo === "saida").length} lançamentos`}
          icon={ArrowDownRight}
          tone="expense"
        />
        <KpiCard
          label="Taxa de Poupança"
          value={`${savingRate.toFixed(1)}%`}
          hint={savingRate >= 20 ? "Acima da meta de 20%" : "Abaixo da meta de 20%"}
          icon={PiggyBank}
          tone={savingRate >= 20 ? "income" : "expense"}
        />
      </div>

      {/* Saldo inteligente: fatura em aberto (dívida) nunca soma com saldo
          disponível — cada card mostra só a métrica certa para o tipo da
          conta, com a cor de despesa/receita reforçando a diferença. */}
      <section className="panel mt-6 p-5">
        <header className="mb-4">
          <h2 className="text-base font-semibold">Contas</h2>
          <p className="text-xs text-muted-foreground">
            Saldo disponível nas contas correntes; fatura em aberto nos cartões — nunca somados.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {accounts.map((conta) => (
            <div
              key={conta.id}
              className="surface-2 rounded-xl border border-border bg-surface-2 p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${conta.cor}26`, color: conta.cor }}
                >
                  {conta.tipo === "cartao_credito" ? (
                    <CreditCard size={15} />
                  ) : (
                    <Wallet size={15} />
                  )}
                </span>
                <p className="truncate text-sm font-medium">{conta.nome}</p>
              </div>
              {conta.tipo === "cartao_credito" ? (
                <>
                  <p className="mt-3 text-xl font-semibold tabular-nums text-expense">
                    {formatBRL(conta.faturaEmAberto ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    fatura em aberto • vence dia {conta.diaVencimentoFatura}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-xl font-semibold tabular-nums text-income">
                    {formatBRL(conta.saldo)}
                  </p>
                  <p className="text-xs text-muted-foreground">saldo disponível</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <section className="panel p-5 xl:col-span-2">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Entradas vs Saídas</h2>
            <p className="text-xs text-muted-foreground">Evolução mensal em {year}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {monthly.map((m) => (
                <Link
                  key={m.mes}
                  to="/mes/$ano/$mes"
                  params={{ ano: String(year), mes: String(MONTHS.indexOf(m.mes) + 1) }}
                  className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {m.mes}
                </Link>
              ))}
            </div>
          </header>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Entradas" fill="var(--income)" radius={[6, 6, 0, 0]} barSize={18} />
                <Bar dataKey="Saídas" fill="var(--expense)" radius={[6, 6, 0, 0]} barSize={18} />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Saídas por Categoria</h2>
            <p className="text-xs text-muted-foreground">Distribuição do período</p>
          </header>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={3}
                  stroke="none"
                >
                  {byCategory.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={
                        categorias.find((c) => c.nome === entry.name)?.cor ??
                        DONUT_COLORS[i % DONUT_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => formatBRL(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-2">
            {byCategory.slice(0, 5).map((c, i) => (
              <li key={c.name} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background:
                      categorias.find((cat) => cat.nome === c.name)?.cor ??
                      DONUT_COLORS[i % DONUT_COLORS.length],
                  }}
                />
                <span className="text-muted-foreground">{c.name}</span>
                <span className="ml-auto tabular-nums">{formatBRL(c.value)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <section className="panel p-5 xl:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Lançamentos recentes</h2>
          <ul className="divide-y divide-border">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="w-20 shrink-0 text-muted-foreground">{formatDate(t.data)}</span>
                <span className="min-w-0 flex-1 truncate">{t.descricao}</span>
                <span className="hidden text-muted-foreground sm:block">
                  {categoriaPorId(t.categoriaId)?.nome ?? "—"}
                </span>
                <span
                  className={`w-32 text-right tabular-nums ${t.tipo === "entrada" ? "text-income" : t.tipo === "saida" ? "text-expense" : ""}`}
                >
                  {t.tipo === "entrada" ? "+" : t.tipo === "saida" ? "−" : ""} {formatBRL(t.valor)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 text-base font-semibold">Calendário de Vencimentos</h2>
          {mesCalendario ? (
            <CalendarioVencimentos year={year} month={mesCalendario} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Escolha um mês específico no filtro do cabeçalho para ver o calendário.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
