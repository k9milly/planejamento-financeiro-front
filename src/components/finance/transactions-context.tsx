import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { transactions as seed, type Lancamento } from "@/lib/finance-data";

interface Store {
  items: Lancamento[];
  add: (tx: Omit<Lancamento, "id">) => void;
  update: (id: string, tx: Omit<Lancamento, "id">) => void;
  remove: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Lancamento[]>(seed);

  const add = useCallback((tx: Omit<Lancamento, "id">) => {
    setItems((prev) => [{ ...tx, id: `new-${Date.now()}` }, ...prev]);
  }, []);
  const update = useCallback((id: string, tx: Omit<Lancamento, "id">) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...tx, id } : t)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ items, add, update, remove }), [items, add, update, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTransactions() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTransactions deve ser usado dentro de TransactionsProvider");
  return ctx;
}
