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
  tableId: string | null;
  customerName: string | null;
  email: string | null;
  items: CartItem[];
  includeTip: boolean;
  setSession: (tableId: string, name: string, email?: string) => void;
  addItem: (product: { id: string; name: string; price: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setIncludeTip: (include: boolean) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTip: () => number;
  getTotal: () => number;
}