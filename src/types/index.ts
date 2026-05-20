export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "PREPARING"
  | "DELIVERED"
  | "CANCELLED";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartStore {
  tenantSlug: string | null;
  tableId: string | null;
  customerName: string | null;
  email: string | null;
  items: CartItem[];
  includeTip: boolean;
  tipPercent: number;
  setSession: (tenantSlug: string, tableId: string, name: string, email?: string) => void;
  addItem: (product: { id: string; name: string; price: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setIncludeTip: (include: boolean) => void;
  setTipPercent: (percent: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTip: () => number;
  getTotal: () => number;
}
