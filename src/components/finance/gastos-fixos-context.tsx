import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { gastosFixos as seed, type GastoFixo } from "@/lib/finance-data";

interface Store {
  items: GastoFixo[];
  add: (gasto: Omit<GastoFixo, "id" | "situacoes">) => void;
  update: (id: string, gasto: Omit<GastoFixo, "id" | "situacoes">) => void;
  remove: (id: string) => void;
  marcarSituacao: (id: string, mes: number, situacao: "pago" | "pendente") => void;
}

const Ctx = createContext<Store | null>(null);

export function GastosFixosProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GastoFixo[]>(seed);

  const add = useCallback((gasto: Omit<GastoFixo, "id" | "situacoes">) => {
    setItems((prev) => [...prev, { ...gasto, id: `gf-${Date.now()}`, situacoes: {} }]);
  }, []);
  const update = useCallback((id: string, gasto: Omit<GastoFixo, "id" | "situacoes">) => {
    setItems((prev) => prev.map((g) => (g.id === id ? { ...g, ...gasto } : g)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((g) => g.id !== id));
  }, []);
  const marcarSituacao = useCallback((id: string, mes: number, situacao: "pago" | "pendente") => {
    setItems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, situacoes: { ...g.situacoes, [mes]: situacao } } : g)),
    );
  }, []);

  const value = useMemo(
    () => ({ items, add, update, remove, marcarSituacao }),
    [items, add, update, remove, marcarSituacao],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGastosFixos() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGastosFixos deve ser usado dentro de GastosFixosProvider");
  return ctx;
}
