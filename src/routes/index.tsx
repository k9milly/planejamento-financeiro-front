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
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { KpiCard } from "@/components/finance/KpiCard";
import { usePeriod } from "@/components/finance/period-context";
import { useTransactions } from "@/components/finance/transactions-context";
import { MONTHS, formatBRL, formatDate, getMonth } from "@/lib/finance-data";
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
        content: "Acompanhe KPIs, evolução mensal e distribuição de gastos por categoria.",
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
  const { month, year } = usePeriod();

  const inPeriod = items.filter(
    (t) => Number(t.date.slice(0, 4)) === year && (month === 0 || getMonth(t) === month),
  );

  const income = inPeriod.filter((t) => t.type === "receita").reduce((a, t) => a + t.amount, 0);
  const expense = inPeriod.filter((t) => t.type === "despesa").reduce((a, t) => a + t.amount, 0);
  const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const totalBalance = items
    .filter((t) => Number(t.date.slice(0, 4)) === year)
    .reduce((a, t) => a + (t.type === "receita" ? t.amount : -t.amount), 0);

  const monthly = MONTHS.map((label, i) => {
    const rows = items.filter(
      (t) => Number(t.date.slice(0, 4)) === year && getMonth(t) === i + 1,
    );
    const e = rows.filter((t) => t.type === "receita").reduce((a, t) => a + t.amount, 0);
    const s = rows.filter((t) => t.type === "despesa").reduce((a, t) => a + t.amount, 0);
    return { mes: label, Entradas: e, Saídas: s, Saldo: e - s };
  }).filter((m) => m.Entradas > 0 || m["Saídas"] > 0);

  const byCategory = Object.entries(
    inPeriod
      .filter((t) => t.type === "despesa")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const recent = [...inPeriod].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

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
          hint={`${inPeriod.filter((t) => t.type === "receita").length} lançamentos`}
          icon={ArrowUpRight}
          tone="income"
        />
        <KpiCard
          label="Saídas do Período"
          value={formatBRL(expense)}
          hint={`${inPeriod.filter((t) => t.type === "despesa").length} lançamentos`}
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
                <Line type="monotone" dataKey="Saldo" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
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
                    <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
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
                  style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                />
                <span className="text-muted-foreground">{c.name}</span>
                <span className="ml-auto tabular-nums">{formatBRL(c.value)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="mb-4 text-base font-semibold">Lançamentos recentes</h2>
        <ul className="divide-y divide-border">
          {recent.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
              <span className="w-20 shrink-0 text-muted-foreground">{formatDate(t.date)}</span>
              <span className="min-w-0 flex-1 truncate">{t.description}</span>
              <span className="hidden text-muted-foreground sm:block">{t.category}</span>
              <span
                className={`w-32 text-right tabular-nums ${t.type === "receita" ? "text-income" : "text-expense"}`}
              >
                {t.type === "receita" ? "+" : "−"} {formatBRL(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
