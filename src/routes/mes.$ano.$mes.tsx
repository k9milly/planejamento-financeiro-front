import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { KpiCard } from "@/components/finance/KpiCard";
import { useTransactions } from "@/components/finance/transactions-context";
import { MONTHS, formatBRL, formatDate, getMonth } from "@/lib/finance-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mes/$ano/$mes")({
  head: () => ({
    meta: [
      { title: "Detalhes do Mês | Planejamento Financeiro" },
      {
        name: "description",
        content: "Resumo do mês com entradas, saídas, categorias e lista completa de lançamentos.",
      },
      { property: "og:title", content: "Detalhes do Mês | Planejamento Financeiro" },
      {
        property: "og:description",
        content: "Veja o desempenho financeiro de um mês específico em detalhes.",
      },
    ],
  }),
  component: MonthDetail,
});

function MonthDetail() {
  const { ano, mes } = Route.useParams();
  const { items } = useTransactions();

  const year = Number(ano);
  const month = Math.min(12, Math.max(1, Number(mes) || 1));
  const label = `${MONTHS[month - 1]} de ${year}`;

  const rows = useMemo(
    () =>
      items
        .filter((t) => Number(t.date.slice(0, 4)) === year && getMonth(t) === month)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [items, year, month],
  );

  const income = rows.filter((t) => t.type === "receita").reduce((a, t) => a + t.amount, 0);
  const expense = rows.filter((t) => t.type === "despesa").reduce((a, t) => a + t.amount, 0);
  const balance = income - expense;
  const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const pending = rows.filter((t) => t.status === "pendente");

  const byCategory = Object.entries(
    rows
      .filter((t) => t.type === "despesa")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const maxCat = byCategory[0]?.value ?? 1;
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <AppShell
      title={`Detalhes de ${MONTHS[month - 1]}`}
      subtitle={label}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/mes/$ano/$mes" params={{ ano: String(prev.y), mes: String(prev.m) }}>
              ← {MONTHS[prev.m - 1]}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/mes/$ano/$mes" params={{ ano: String(next.y), mes: String(next.m) }}>
              {MONTHS[next.m - 1]} →
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Saldo do Mês" value={formatBRL(balance)} hint={label} icon={Wallet} />
        <KpiCard
          label="Entradas"
          value={formatBRL(income)}
          hint={`${rows.filter((t) => t.type === "receita").length} lançamentos`}
          icon={ArrowUpRight}
          tone="income"
        />
        <KpiCard
          label="Saídas"
          value={formatBRL(expense)}
          hint={`${rows.filter((t) => t.type === "despesa").length} lançamentos`}
          icon={ArrowDownRight}
          tone="expense"
        />
        <KpiCard
          label="Taxa de Poupança"
          value={`${savingRate.toFixed(1)}%`}
          hint={pending.length ? `${pending.length} pendente(s)` : "Tudo pago"}
          icon={PiggyBank}
          tone={savingRate >= 20 ? "income" : "expense"}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <section className="panel p-5">
          <h2 className="mb-4 text-base font-semibold">Saídas por categoria</h2>
          {byCategory.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma saída neste mês.</p>
          )}
          <ul className="space-y-3">
            {byCategory.map((c) => (
              <li key={c.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="tabular-nums">{formatBRL(c.value)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-surface-2">
                  <div
                    className="h-2 rounded-full bg-expense"
                    style={{ width: `${(c.value / maxCat) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel overflow-x-auto xl:col-span-2">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="border-b border-border px-4 py-3 font-medium">Data</th>
                <th className="border-b border-border px-4 py-3 font-medium">Descrição</th>
                <th className="border-b border-border px-4 py-3 font-medium">Categoria</th>
                <th className="border-b border-border px-4 py-3 text-right font-medium">Valor</th>
                <th className="border-b border-border px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-accent/40">
                  <td className="border-b border-border px-4 py-3 text-muted-foreground">
                    {formatDate(t.date)}
                  </td>
                  <td className="border-b border-border px-4 py-3">{t.description}</td>
                  <td className="border-b border-border px-4 py-3 text-muted-foreground">
                    {t.category}
                  </td>
                  <td
                    className={`border-b border-border px-4 py-3 text-right tabular-nums ${t.type === "receita" ? "text-income" : "text-expense"}`}
                  >
                    {t.type === "receita" ? "+" : "−"} {formatBRL(t.amount)}
                  </td>
                  <td className="border-b border-border px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${t.status === "pago" ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted-foreground"}`}
                    >
                      {t.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum lançamento em {label}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
