import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { accounts as seed, type Conta } from "@/lib/finance-data";

interface Store {
  items: Conta[];
  add: (conta: Omit<Conta, "id">) => void;
  update: (id: string, conta: Omit<Conta, "id">) => void;
  remove: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Conta[]>(seed);

  const add = useCallback((conta: Omit<Conta, "id">) => {
    setItems((prev) => [...prev, { ...conta, id: `conta-${Date.now()}` }]);
  }, []);
  const update = useCallback((id: string, conta: Omit<Conta, "id">) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...conta, id } : c)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(() => ({ items, add, update, remove }), [items, add, update, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccounts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccounts deve ser usado dentro de AccountsProvider");
  return ctx;
}
