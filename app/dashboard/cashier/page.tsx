"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Minus, Trash2, ShoppingCart, QrCode } from "lucide-react";
import QRScanner from "@/components/admin/QRScanner";
import { createOrder, saveOrder, type OrderItem } from "@/lib/orders";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  selling_price: number;
}

export default function CashierPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const products: Product[] = [
    { id: "1", name: "Nasi Goreng", sku: "NG-001", category: "Main Course", selling_price: 25000 },
    { id: "2", name: "Mie Ayam", sku: "MA-001", category: "Main Course", selling_price: 20000 },
    { id: "3", name: "Es Teh Manis", sku: "ETM-001", category: "Beverage", selling_price: 5000 },
    { id: "4", name: "Es Jeruk", sku: "EJ-001", category: "Beverage", selling_price: 6000 },
    { id: "5", name: "Ayam Goreng", sku: "AG-001", category: "Main Course", selling_price: 30000 },
  ];

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.selling_price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleQRScan = (decodedText: string) => {
    const product = products.find((p) => p.sku === decodedText);
    if (product) {
      addToCart(product);
    } else {
      setSearchQuery(decodedText);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Convert cart items to order items
    const orderItems: OrderItem[] = cart.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    // Create and save order
    const order = createOrder(orderItems);
    saveOrder(order);

    // Show success message
    if (typeof window !== "undefined") {
      window.alert(
        `Order ${order.orderNumber} created successfully!\n\nTotal: Rp ${total.toLocaleString("id-ID")}`
      );
    }

    // Clear cart
    setCart([]);
    
    // Optionally redirect to orders page
    // router.push("/dashboard/orders");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Panel */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Selection</h2>
          
          {/* Search Bar */}
          <div className="relative flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              title="Scan QR Code"
            >
              <QrCode className="h-5 w-5" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
            {filteredProducts.map((product, index) => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(product)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="text-sm font-medium text-gray-900 mb-1">{product.name}</div>
                <div className="text-xs text-gray-500 mb-2">{product.sku}</div>
                <div className="text-sm font-semibold text-blue-600">
                  Rp {product.selling_price.toLocaleString("id-ID")}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Cart</h2>
            {cart.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Cart is empty</p>
              <p className="text-sm mt-1">Add products to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                {cart.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.sku}</div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => updateQuantity(item.id, -1)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </motion.button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <motion.button
                        onClick={() => updateQuantity(item.id, 1)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </motion.button>
                      <motion.button
                        onClick={() => removeFromCart(item.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 rounded hover:bg-red-100 transition-colors ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>
                <motion.button
                  onClick={handleCheckout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                >
                  Checkout
                </motion.button>
                <button
                  onClick={() => setCart([])}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  );
}

