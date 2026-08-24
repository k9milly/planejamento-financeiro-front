import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/finance/AppShell";
import { CATEGORIES } from "@/lib/finance-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Planejamento Financeiro" },
      {
        name: "description",
        content: "Preferências de perfil, moeda, categorias e alertas do seu planejamento.",
      },
      { property: "og:title", content: "Configurações | Planejamento Financeiro" },
      {
        property: "og:description",
        content: "Ajuste perfil, moeda, meta de poupança, categorias e notificações.",
      },
    ],
  }),
  component: ConfigPage,
});

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

        <section className="panel p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm"
              >
                {c}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
