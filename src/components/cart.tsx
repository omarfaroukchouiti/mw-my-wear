"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartDesign = {
  /** Serialized fabric.js scene for this side. */
  design?: string;
  /** Small PNG preview of this side. */
  preview?: string;
};

export type CartLine = {
  key: string;
  slug: string;
  type: string;
  colorHex: string;
  colorNameAr: string;
  colorNameEn: string;
  size: string;
  price: number;
  qty: number;
  front?: CartDesign;
  back?: CartDesign;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (line: Omit<CartLine, "key">) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mw.cart.v1";

function hash(value: string): string {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return (result >>> 0).toString(36);
}

/**
 * A line is unique per garment + colour + size + design. Both sides take part
 * in the key so two customers with different back prints never merge.
 */
function lineKey(line: Omit<CartLine, "key">): string {
  const design = [line.front?.design ?? "", line.back?.design ?? ""].join("~");
  return [line.slug, line.colorHex, line.size, design ? hash(design) : ""].join("|");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed as CartLine[]);
      }
    } catch {
      // Corrupt or blocked storage: start with an empty cart.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage full or disabled; the cart still works for this session.
    }
  }, [lines, ready]);

  const add = useCallback((incoming: Omit<CartLine, "key">) => {
    const key = lineKey(incoming);
    setLines((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, qty: line.qty + incoming.qty } : line,
        );
      }
      return [...current, { ...incoming, key }];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      subtotal: lines.reduce((sum, line) => sum + line.qty * line.price, 0),
      add,
      remove,
      clear,
    }),
    [lines, ready, add, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
