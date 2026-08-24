import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { wishlistPadrao as seed, type Desejo } from "@/lib/finance-data";

interface Store {
  items: Desejo[];
  add: (desejo: Omit<Desejo, "id">) => void;
  update: (id: string, desejo: Partial<Omit<Desejo, "id">>) => void;
  remove: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Desejo[]>(seed);

  const add = useCallback((desejo: Omit<Desejo, "id">) => {
    setItems((prev) => [...prev, { ...desejo, id: `w-${Date.now()}` }]);
  }, []);
  const update = useCallback((id: string, desejo: Partial<Omit<Desejo, "id">>) => {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, ...desejo } : d)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const value = useMemo(() => ({ items, add, update, remove }), [items, add, update, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist deve ser usado dentro de WishlistProvider");
  return ctx;
}
