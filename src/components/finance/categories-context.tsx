import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { categorias as seed, type Categoria } from "@/lib/finance-data";

interface Store {
  items: Categoria[];
  add: (categoria: Omit<Categoria, "id">) => void;
  update: (id: string, categoria: Omit<Categoria, "id">) => void;
  remove: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Categoria[]>(seed);

  const add = useCallback((categoria: Omit<Categoria, "id">) => {
    setItems((prev) => [...prev, { ...categoria, id: `cat-${Date.now()}` }]);
  }, []);
  const update = useCallback((id: string, categoria: Omit<Categoria, "id">) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...categoria, id } : c)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(() => ({ items, add, update, remove }), [items, add, update, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategories() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCategories deve ser usado dentro de CategoriesProvider");
  return ctx;
}
