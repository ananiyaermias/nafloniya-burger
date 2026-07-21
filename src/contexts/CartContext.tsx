import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Burger } from "@/data/burgers";

export interface CartCustomization {
  remove: string;
  add: string;
  extras: string[];
}

export interface CartItem {
  burger: Burger;
  quantity: number;
  customization: CartCustomization;
}

interface CartContextType {
  items: CartItem[];
  addItem: (burger: Burger, quantity?: number) => void;
  removeItem: (burgerId: number) => void;
  updateQuantity: (burgerId: number, quantity: number) => void;
  updateCustomization: (burgerId: number, customization: Partial<CartCustomization>) => void;
  clearCart: () => void;
  totalItems: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const emptyCustomization = (): CartCustomization => ({ remove: "", add: "", extras: [] });

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((burger: Burger, quantity = 1) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.burger.id === burger.id);
      if (existingItem) {
        return prev.map(item =>
          item.burger.id === burger.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, 10) }
            : item
        );
      }
      return [...prev, { burger, quantity, customization: emptyCustomization() }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((burgerId: number) => {
    setItems(prev => prev.filter(item => item.burger.id !== burgerId));
  }, []);

  const updateQuantity = useCallback((burgerId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(burgerId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.burger.id === burgerId
          ? { ...item, quantity: Math.min(quantity, 10) }
          : item
      )
    );
  }, [removeItem]);

  const updateCustomization = useCallback((burgerId: number, customization: Partial<CartCustomization>) => {
    setItems(prev =>
      prev.map(item =>
        item.burger.id === burgerId
          ? { ...item, customization: { ...item.customization, ...customization } }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateCustomization,
        clearCart,
        totalItems,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
