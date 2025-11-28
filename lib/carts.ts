export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SavedCart {
  id: string;
  name: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "warung_saved_carts";

export const getSavedCarts = (): SavedCart[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartItem[], name?: string): SavedCart => {
  if (typeof window === "undefined") {
    throw new Error("Cannot save cart on server side");
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = new Date().toISOString();
  const cartId = `cart-${Date.now()}`;
  const cartName = name || `Cart ${new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`;

  const savedCart: SavedCart = {
    id: cartId,
    name: cartName,
    items: cart,
    total,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const carts = getSavedCarts();
    carts.unshift(savedCart); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carts));
  } catch (error) {
    console.error("Failed to save cart:", error);
    throw error;
  }

  return savedCart;
};

export const updateCart = (cartId: string, cart: CartItem[], name?: string): SavedCart | null => {
  if (typeof window === "undefined") return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = new Date().toISOString();

  try {
    const carts = getSavedCarts();
    const cartIndex = carts.findIndex((c) => c.id === cartId);
    
    if (cartIndex === -1) return null;

    const updatedCart: SavedCart = {
      ...carts[cartIndex],
      items: cart,
      total,
      updatedAt: now,
      ...(name && { name }),
    };

    carts[cartIndex] = updatedCart;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carts));
    return updatedCart;
  } catch (error) {
    console.error("Failed to update cart:", error);
    return null;
  }
};

export const deleteCart = (cartId: string): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const carts = getSavedCarts();
    const filteredCarts = carts.filter((c) => c.id !== cartId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCarts));
    return true;
  } catch (error) {
    console.error("Failed to delete cart:", error);
    return false;
  }
};

export const getCartById = (cartId: string): SavedCart | null => {
  if (typeof window === "undefined") return null;

  const carts = getSavedCarts();
  return carts.find((c) => c.id === cartId) || null;
};

