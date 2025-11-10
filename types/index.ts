export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  selling_price: number;
  purchase_price: number;
  description?: string;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

