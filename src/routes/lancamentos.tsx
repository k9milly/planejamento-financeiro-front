import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/finance/AppShell";
import { usePeriod } from "@/components/finance/period-context";
import { useTransactions } from "@/components/finance/transactions-context";
import {
  CATEGORIES,
  MONTHS,
  formatBRL,
  formatDate,
  getMonth,
  type Transaction,
  type TxStatus,
  type TxType,
} from "@/lib/finance-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos | Planejamento Financeiro" },
      {
        name: "description",
        content: "Planilha interativa de receitas e despesas com busca, filtros e edição.",
      },
      { property: "og:title", content: "Lançamentos | Planejamento Financeiro" },
      {
        property: "og:description",
        content: "Cadastre, filtre e gerencie todos os seus lançamentos financeiros.",
      },
    ],
  }),
  component: LancamentosPage,
});

const selectCls =
  "h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: CATEGORIES[3] as string,
  amount: "",
  type: "despesa" as TxType,
  status: "pago" as TxStatus,
};

function LancamentosPage() {
  const { items, add, update, remove } = useTransactions();
  const { month, year } = usePeriod();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");
  const [type, setType] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState(emptyForm);

  const rows = useMemo(
    () =>
      items
        .filter((t) => Number(t.date.slice(0, 4)) === year && (month === 0 || getMonth(t) === month))
        .filter((t) =>
          query
            ? `${t.description} ${t.category}`.toLowerCase().includes(query.toLowerCase())
            : true,
        )
        .filter((t) => (category === "todas" ? true : t.category === category))
        .filter((t) => (type === "todos" ? true : t.type === type))
        .filter((t) => (status === "todos" ? true : t.status === status))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [items, year, month, query, category, type, status],
  );

  const total = rows.reduce((a, t) => a + (t.type === "receita" ? t.amount : -t.amount), 0);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setForm({ ...tx, amount: String(tx.amount) });
    setOpen(true);
  }

  function save() {
    const amount = Number(form.amount.replace(",", "."));
    if (!form.description.trim() || !amount) {
      toast.error("Informe descrição e valor válidos.");
      return;
    }
    const payload = {
      date: form.date,
      description: form.description.trim(),
      category: form.category,
      amount,
      type: form.type,
      status: form.status,
    };
    if (editing) {
      update(editing.id, payload);
      toast.success("Lançamento atualizado.");
    } else {
      add(payload);
      toast.success("Lançamento criado.");
    }
    setOpen(false);
  }

  return (
    <AppShell
      title="Lançamentos"
      subtitle={month === 0 ? `Ano ${year}` : `${MONTHS[month - 1]} de ${year}`}
      actions={
        <Button onClick={openNew} className="gap-2">
          <Plus size={16} /> Novo Lançamento
        </Button>
      }
    >
      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por descrição ou categoria"
              className="bg-surface-2 pl-9"
            />
          </div>
          <select
            aria-label="Categoria"
            className={selectCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Tipo"
            className={selectCls}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="todos">Todos os tipos</option>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
          <select
            aria-label="Status"
            className={selectCls}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      <div className="panel mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border px-4 py-3 font-medium">Data</th>
              <th className="border-b border-border px-4 py-3 font-medium">Descrição</th>
              <th className="border-b border-border px-4 py-3 font-medium">Categoria</th>
              <th className="border-b border-border px-4 py-3 text-right font-medium">Valor</th>
              <th className="border-b border-border px-4 py-3 font-medium">Tipo</th>
              <th className="border-b border-border px-4 py-3 font-medium">Status</th>
              <th className="border-b border-border px-4 py-3 text-right font-medium">Ações</th>
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
                  {formatBRL(t.amount)}
                </td>
                <td className="border-b border-border px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${t.type === "receita" ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}
                  >
                    {t.type === "receita" ? "Receita" : "Despesa"}
                  </span>
                </td>
                <td className="border-b border-border px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${t.status === "pago" ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted-foreground"}`}
                  >
                    {t.status === "pago" ? "Pago" : "Pendente"}
                  </span>
                </td>
                <td className="border-b border-border px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir"
                      onClick={() => {
                        remove(t.id);
                        toast.success("Lançamento excluído.");
                      }}
                    >
                      <Trash2 size={16} className="text-expense" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum lançamento encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {rows.length} lançamentos • Saldo filtrado:{" "}
        <span className={total >= 0 ? "text-income" : "text-expense"}>{formatBRL(total)}</span>
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex.: Supermercado do mês"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat">Categoria</Label>
              <select
                id="cat"
                className={selectCls}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tp">Tipo</Label>
              <select
                id="tp"
                className={selectCls}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as TxType })}
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="st">Status</Label>
              <select
                id="st"
                className={selectCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TxStatus })}
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
