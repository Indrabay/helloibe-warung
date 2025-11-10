export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: "completed" | "pending" | "processing";
  createdAt: string;
  customerName?: string;
}

const STORAGE_KEY = "warung_orders";

export const getOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveOrder = (order: Order): void => {
  if (typeof window === "undefined") return;
  try {
    const orders = getOrders();
    orders.unshift(order); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Failed to save order:", error);
  }
};

export const createOrder = (
  items: OrderItem[],
  customerName?: string
): Order => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orders = getOrders();
  const orderNumber = `ORD-${String(orders.length + 1).padStart(3, "0")}`;
  const orderId = `order-${Date.now()}`;

  return {
    id: orderId,
    orderNumber,
    items,
    total,
    status: "completed",
    createdAt: new Date().toISOString(),
    customerName: customerName || "Walk-in Customer",
  };
};

