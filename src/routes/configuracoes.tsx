import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/finance/AppShell";
import { useAccounts } from "@/components/finance/accounts-context";
import { useCategories } from "@/components/finance/categories-context";
import { usePeriod } from "@/components/finance/period-context";
import { formatBRL, type Categoria, type Conta, type TipoConta } from "@/lib/finance-data";
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
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Planejamento Financeiro" },
      {
        name: "description",
        content: "Preferências de perfil, contas, categorias e alertas do seu planejamento.",
      },
      { property: "og:title", content: "Configurações | Planejamento Financeiro" },
      {
        property: "og:description",
        content: "Ajuste perfil, contas, categorias e notificações.",
      },
    ],
  }),
  component: ConfigPage,
});

const selectCls =
  "h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

function ConfigPage() {
  const [alerts, setAlerts] = useState(true);
  const [pending, setPending] = useState(true);

  return (
    <AppShell title="Configurações" subtitle="Preferências da sua conta">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 text-base font-semibold">Perfil</h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" defaultValue="Kamilly Da Rosa" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" defaultValue="kamilly@exemplo.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal">Meta de taxa de poupança (%)</Label>
              <Input id="goal" defaultValue="20" inputMode="numeric" />
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 text-base font-semibold">Alertas</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                Avisar quando um orçamento passar de 80%
                <span className="block text-xs text-muted-foreground">
                  Notificação no painel e por e-mail
                </span>
              </span>
              <Switch checked={alerts} onCheckedChange={setAlerts} />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                Lembrar de lançamentos pendentes
                <span className="block text-xs text-muted-foreground">
                  Resumo semanal das contas em aberto
                </span>
              </span>
              <Switch checked={pending} onCheckedChange={setPending} />
            </label>
          </div>
        </section>

        <ContasSection />
        <CategoriasSection />
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Contas
// ---------------------------------------------------------------------------

type ContaForm = {
  nome: string;
  cor: string;
  tipo: TipoConta;
  diaVencimentoFatura: string;
  saldo: string;
  faturaEmAberto: string;
};

function emptyContaForm(): ContaForm {
  return {
    nome: "",
    cor: "#820ad1",
    tipo: "corrente",
    diaVencimentoFatura: "10",
    saldo: "0",
    faturaEmAberto: "0",
  };
}

function ContasSection() {
  const { items, add, update, remove } = useAccounts();
  const { month, year } = usePeriod();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Conta | null>(null);
  const [form, setForm] = useState<ContaForm>(emptyContaForm());

  // Situação da fatura do mês selecionado — mock local, sem backend ainda
  // (a próxima rodada troca isto pelos três endpoints reais de
  // /anos/{ano}/cartoes/{cartao_id}/fatura). A chave junta conta + período
  // para "pago" não vazar de um mês para o outro ao trocar o filtro.
  const [faturasPagas, setFaturasPagas] = useState<Record<string, boolean>>({});
  const [pagando, setPagando] = useState<Conta | null>(null);
  const [contaPagamentoId, setContaPagamentoId] = useState("");
  const chaveFatura = (contaId: string) => `${contaId}-${year}-${month}`;
  const contasCorrentes = items.filter((c) => c.tipo === "corrente");

  function abrirPagarFatura(conta: Conta) {
    setPagando(conta);
    setContaPagamentoId(contasCorrentes[0]?.id ?? "");
  }

  function confirmarPagamento() {
    if (!pagando) return;
    setFaturasPagas((prev) => ({ ...prev, [chaveFatura(pagando.id)]: true }));
    toast.success(`Fatura da ${pagando.nome} marcada como paga (mock).`);
    setPagando(null);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyContaForm());
    setOpen(true);
  }

  function openEdit(conta: Conta) {
    setEditing(conta);
    setForm({
      nome: conta.nome,
      cor: conta.cor,
      tipo: conta.tipo,
      diaVencimentoFatura: String(conta.diaVencimentoFatura ?? 10),
      saldo: String(conta.saldo),
      faturaEmAberto: String(conta.faturaEmAberto ?? 0),
    });
    setOpen(true);
  }

  function save() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da conta.");
      return;
    }
    const ehCartao = form.tipo === "cartao_credito";
    const payload: Omit<Conta, "id"> = {
      nome: form.nome.trim(),
      cor: form.cor,
      tipo: form.tipo,
      saldo: ehCartao ? 0 : Number(form.saldo.replace(",", ".")) || 0,
      ...(ehCartao
        ? {
            diaVencimentoFatura: Number(form.diaVencimentoFatura) || 10,
            faturaEmAberto: Number(form.faturaEmAberto.replace(",", ".")) || 0,
          }
        : {}),
    };
    if (editing) {
      update(editing.id, payload);
      toast.success("Conta atualizada.");
    } else {
      add(payload);
      toast.success("Conta criada.");
    }
    setOpen(false);
  }

  return (
    <section className="panel p-5 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Contas</h2>
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus size={16} /> Nova conta
        </Button>
      </div>

      <ul className="divide-y divide-border">
        {items.map((conta) => (
          <li key={conta.id} className="flex items-center gap-3 py-3 text-sm">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${conta.cor}26`, color: conta.cor }}
            >
              {conta.tipo === "cartao_credito" ? <CreditCard size={16} /> : <Wallet size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{conta.nome}</p>
              <p className="text-xs text-muted-foreground">
                {conta.tipo === "cartao_credito"
                  ? `Cartão de crédito • vence dia ${conta.diaVencimentoFatura}`
                  : "Conta corrente"}
              </p>
            </div>
            <div className="text-right">
              {conta.tipo === "cartao_credito" ? (
                <>
                  <p className="tabular-nums text-expense">
                    {formatBRL(conta.faturaEmAberto ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    fatura em aberto •{" "}
                    <span
                      className={
                        faturasPagas[chaveFatura(conta.id)]
                          ? "text-income"
                          : "text-muted-foreground"
                      }
                    >
                      {faturasPagas[chaveFatura(conta.id)] ? "paga" : "pendente"}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="tabular-nums text-income">{formatBRL(conta.saldo)}</p>
                  <p className="text-xs text-muted-foreground">saldo disponível</p>
                </>
              )}
            </div>
            {conta.tipo === "cartao_credito" && !faturasPagas[chaveFatura(conta.id)] && (
              <Button size="sm" variant="secondary" onClick={() => abrirPagarFatura(conta)}>
                Pagar fatura
              </Button>
            )}
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar conta"
                onClick={() => openEdit(conta)}
              >
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir conta"
                onClick={() => {
                  remove(conta.id);
                  toast.success("Conta excluída.");
                }}
              >
                <Trash2 size={16} className="text-expense" />
              </Button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma conta cadastrada.
          </li>
        )}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        Saldo inteligente: fatura em aberto é uma dívida (cor de despesa) e nunca entra somada ao
        saldo disponível (cor de receita) —{" "}
        {month === 0 ? `ano ${year}` : "mês selecionado no filtro do cabeçalho"}.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="conta-nome">Nome</Label>
              <Input
                id="conta-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Nubank"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conta-cor">Cor</Label>
              <Input
                id="conta-cor"
                type="color"
                value={form.cor}
                onChange={(e) => setForm({ ...form, cor: e.target.value })}
                className="h-9 w-full p-1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conta-tipo">Tipo</Label>
              <select
                id="conta-tipo"
                className={selectCls}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoConta })}
              >
                <option value="corrente">Conta corrente</option>
                <option value="cartao_credito">Cartão de crédito</option>
              </select>
            </div>
            {form.tipo === "corrente" ? (
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="conta-saldo">Saldo (mock)</Label>
                <Input
                  id="conta-saldo"
                  inputMode="decimal"
                  value={form.saldo}
                  onChange={(e) => setForm({ ...form, saldo: e.target.value })}
                />
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="conta-dia">Dia de vencimento</Label>
                  <Input
                    id="conta-dia"
                    type="number"
                    min={1}
                    max={31}
                    value={form.diaVencimentoFatura}
                    onChange={(e) => setForm({ ...form, diaVencimentoFatura: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conta-fatura">Fatura em aberto (mock)</Label>
                  <Input
                    id="conta-fatura"
                    inputMode="decimal"
                    value={form.faturaEmAberto}
                    onChange={(e) => setForm({ ...form, faturaEmAberto: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pagando} onOpenChange={(v) => !v && setPagando(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Pagar fatura — {pagando?.nome}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Valor em aberto:{" "}
            <span className="font-medium text-expense">
              {formatBRL(pagando?.faturaEmAberto ?? 0)}
            </span>
            . Mock apenas — nenhum saldo é debitado ainda.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="conta-pagamento">De qual conta sai o pagamento?</Label>
            <select
              id="conta-pagamento"
              className={selectCls}
              value={contaPagamentoId}
              onChange={(e) => setContaPagamentoId(e.target.value)}
            >
              {contasCorrentes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPagando(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarPagamento}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

type CategoriaForm = { nome: string; cor: string; ativa: boolean };

function emptyCategoriaForm(): CategoriaForm {
  return { nome: "", cor: "#8b5cf6", ativa: true };
}

function CategoriasSection() {
  const { items, add, update, remove } = useCategories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaForm>(emptyCategoriaForm());

  function openNew() {
    setEditing(null);
    setForm(emptyCategoriaForm());
    setOpen(true);
  }

  function openEdit(categoria: Categoria) {
    setEditing(categoria);
    setForm({ nome: categoria.nome, cor: categoria.cor, ativa: categoria.ativa });
    setOpen(true);
  }

  function save() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }
    if (editing) {
      update(editing.id, form);
      toast.success("Categoria atualizada.");
    } else {
      add(form);
      toast.success("Categoria criada.");
    }
    setOpen(false);
  }

  return (
    <section className="panel p-5 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Categorias</h2>
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus size={16} /> Nova categoria
        </Button>
      </div>

      <ul className="divide-y divide-border">
        {items.map((categoria) => (
          <li key={categoria.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: categoria.cor }}
            />
            <span
              className={`flex-1 truncate ${categoria.ativa ? "" : "text-muted-foreground line-through"}`}
            >
              {categoria.nome}
            </span>
            <Switch
              checked={categoria.ativa}
              onCheckedChange={(ativa) => update(categoria.id, { ...categoria, ativa })}
              aria-label={categoria.ativa ? "Marcar como inativa" : "Marcar como ativa"}
            />
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar categoria"
                onClick={() => openEdit(categoria)}
              >
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir categoria"
                onClick={() => {
                  remove(categoria.id);
                  toast.success("Categoria excluída.");
                }}
              >
                <Trash2 size={16} className="text-expense" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-nome">Nome</Label>
              <Input
                id="cat-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Pets"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-cor">Cor</Label>
              <Input
                id="cat-cor"
                type="color"
                value={form.cor}
                onChange={(e) => setForm({ ...form, cor: e.target.value })}
                className="h-9 w-full p-1"
              />
            </div>
            <label className="flex items-center justify-between text-sm">
              Ativa
              <Switch
                checked={form.ativa}
                onCheckedChange={(ativa) => setForm({ ...form, ativa })}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
