import { createFileRoute } from "@tanstack/react-router";
import { Target, Wallet } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { usePeriod } from "@/components/finance/period-context";
import { useTransactions } from "@/components/finance/transactions-context";
import { MONTHS, budgets, formatBRL, getMonth, goals } from "@/lib/finance-data";

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title: "Metas & Orçamentos | Planejamento Financeiro" },
      {
        name: "description",
        content: "Acompanhe orçamentos por categoria e o progresso das suas metas financeiras.",
      },
      { property: "og:title", content: "Metas & Orçamentos | Planejamento Financeiro" },
      {
        property: "og:description",
        content: "Limites mensais por categoria e evolução das metas de poupança.",
      },
    ],
  }),
  component: MetasPage,
});

function Bar({ percent, tone }: { percent: number; tone: "income" | "expense" | "primary" }) {
  const bg =
    tone === "income" ? "bg-income" : tone === "expense" ? "bg-expense" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

function MetasPage() {
  const { items } = useTransactions();
  const { month, year } = usePeriod();

  const spent = (category: string) =>
    items
      .filter(
        (t) =>
          t.category === category &&
          t.type === "despesa" &&
          Number(t.date.slice(0, 4)) === year &&
          (month === 0 || getMonth(t) === month),
      )
      .reduce((a, t) => a + t.amount, 0);

  return (
    <AppShell
      title="Metas & Orçamentos"
      subtitle={month === 0 ? `Ano ${year}` : `${MONTHS[month - 1]} de ${year}`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <header className="mb-5 flex items-center gap-2">
            <Wallet size={18} className="text-primary" />
            <h2 className="text-base font-semibold">Orçamentos por categoria</h2>
          </header>
          <ul className="space-y-5">
            {budgets.map((b) => {
              const used = spent(b.category);
              const limit = month === 0 ? b.limit * 8 : b.limit;
              const pct = (used / limit) * 100;
              return (
                <li key={b.category}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{b.category}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatBRL(used)} / {formatBRL(limit)}
                    </span>
                  </div>
                  <Bar percent={pct} tone={pct > 100 ? "expense" : "income"} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pct > 100
                      ? `Estourou ${formatBRL(used - limit)} do orçamento`
                      : `${(100 - pct).toFixed(0)}% disponível`}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel p-5">
          <header className="mb-5 flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <h2 className="text-base font-semibold">Metas de poupança</h2>
          </header>
          <ul className="space-y-5">
            {goals.map((g) => {
              const pct = (g.saved / g.target) * 100;
              return (
                <li key={g.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{g.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatBRL(g.saved)} / {formatBRL(g.target)}
                    </span>
                  </div>
                  <Bar percent={pct} tone="primary" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pct.toFixed(0)}% concluído • faltam {formatBRL(g.target - g.saved)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
