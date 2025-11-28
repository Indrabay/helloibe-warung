"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, Trash2, ShoppingCart, QrCode, Save, FolderOpen, X, Check } from "lucide-react";
import QRScanner from "@/components/admin/QRScanner";
import { createOrder, saveOrder, type OrderItem } from "@/lib/orders";
import { deductInventoryFromOrder } from "@/lib/inventory";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSavedCarts, saveCart, updateCart, deleteCart, getCartById, type SavedCart, type CartItem } from "@/lib/carts";

interface Product {
  id: string;
  name: string;
  sku?: string;
  category: {
    id: string;
    name: string;
  };
  selling_price: number;
  quantity?: number; // Quantity from inventory
}

interface InventoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    category?: {
      id: string;
      name: string;
    };
    selling_price?: number;
  };
  quantity: number;
  expiry_date: string;
  location: string;
}

export default function CashierPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([]);
  const [isSaveCartModalOpen, setIsSaveCartModalOpen] = useState(false);
  const [isLoadCartModalOpen, setIsLoadCartModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [currentCartId, setCurrentCartId] = useState<string | null>(null);
  const [cartName, setCartName] = useState("");
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreInventory, setHasMoreInventory] = useState(true);
  const [inventoryOffset, setInventoryOffset] = useState(0);
  const [productScrollContainer, setProductScrollContainer] = useState<HTMLDivElement | null>(null);
  const hasMoreInventoryRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const inventoryOffsetRef = useRef(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const LIMIT = 100;

  // Load saved carts on mount
  useEffect(() => {
    const carts = getSavedCarts();
    setSavedCarts(carts);
  }, []);

  // Fetch inventory when search query changes (only if search query exists)
  useEffect(() => {
    const fetchInventory = async () => {
      // If no search query, clear the list
      if (!searchQuery.trim()) {
        setDisplayedProducts([]);
        setInventory([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

        const params = new URLSearchParams({
          limit: LIMIT.toString(),
          offset: "0",
          search: searchQuery.trim(),
        });

        const inventoryResponse = await fetch(`${API_BASE_URL}/api/inventories?${params.toString()}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (inventoryResponse.ok) {
          const inventoryResult = await inventoryResponse.json();
          const inventoryData = inventoryResult.data && Array.isArray(inventoryResult.data)
            ? inventoryResult.data
            : Array.isArray(inventoryResult)
            ? inventoryResult
            : inventoryResult.inventories || [];
          
          setInventory(inventoryData);
          setInventoryOffset(inventoryData.length);
          const hasMore = inventoryData.length === LIMIT;
          setHasMoreInventory(hasMore);
          hasMoreInventoryRef.current = hasMore;
          inventoryOffsetRef.current = inventoryData.length;

          // Group inventory items by product and aggregate quantities
          const productMap = new Map<string, Product & { quantity: number }>();
          inventoryData.forEach((item: InventoryItem) => {
            const productId = item.product.id;
            if (productMap.has(productId)) {
              const existing = productMap.get(productId)!;
              existing.quantity += item.quantity;
            } else {
              productMap.set(productId, {
                id: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
                category: item.product.category || { id: "", name: "" },
                selling_price: item.product.selling_price || 0,
                quantity: item.quantity,
              });
            }
          });
          
          // Update displayed products with available quantities (will be calculated after inventory state updates)
          setDisplayedProducts(Array.from(productMap.values()));
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [API_BASE_URL, searchQuery]);

  // Load more inventory
  const loadMoreInventory = async () => {
    if (isLoadingMoreRef.current || !hasMoreInventoryRef.current) return;

    try {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: inventoryOffsetRef.current.toString(),
      });

      // Add search parameter if search query exists
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const inventoryResponse = await fetch(`${API_BASE_URL}/api/inventories?${params.toString()}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (inventoryResponse.ok) {
        const inventoryResult = await inventoryResponse.json();
        const inventoryData = inventoryResult.data && Array.isArray(inventoryResult.data)
          ? inventoryResult.data
          : Array.isArray(inventoryResult)
          ? inventoryResult
          : inventoryResult.inventories || [];
        
        if (inventoryData.length > 0) {
          setInventory((prev) => [...prev, ...inventoryData]);
          inventoryOffsetRef.current += inventoryData.length;
          setInventoryOffset(inventoryOffsetRef.current);
          const hasMore = inventoryData.length === LIMIT;
          hasMoreInventoryRef.current = hasMore;
          setHasMoreInventory(hasMore);

          // Group new inventory items by product and aggregate quantities
          const productMap = new Map<string, Product & { quantity: number }>();
          
          // First, add existing displayed products to the map
          displayedProducts.forEach((product) => {
            productMap.set(product.id, { ...product, quantity: product.quantity || 0 });
          });
          
          // Then, add/update with new inventory items
          inventoryData.forEach((item: InventoryItem) => {
            const productId = item.product.id;
            if (productMap.has(productId)) {
              const existing = productMap.get(productId)!;
              existing.quantity += item.quantity;
            } else {
              productMap.set(productId, {
                id: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
                category: item.product.category || { id: "", name: "" },
                selling_price: item.product.selling_price || 0,
                quantity: item.quantity,
              });
            }
          });
          
          setDisplayedProducts(Array.from(productMap.values()));
        } else {
          hasMoreInventoryRef.current = false;
          setHasMoreInventory(false);
        }
      }
    } catch (error) {
      console.error("Error loading more inventory:", error);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  };



  // Get expiry status
  const getExpiryStatus = (expiryDate: string): "valid" | "near_expiry" | "expired" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "expired";
    } else if (diffDays <= 7) {
      return "near_expiry";
    } else {
      return "valid";
    }
  };

  // Calculate total reserved quantity from all saved carts (excluding current cart)
  const reservedQuantities = useMemo(() => {
    const reservedMap = new Map<string, number>();
    
    // Only count saved carts that are NOT the current active cart
    savedCarts.forEach((savedCart) => {
      // Skip the current cart if it's loaded from saved carts
      if (currentCartId && savedCart.id === currentCartId) {
        return; // Don't count it here, it will be counted in the current cart below
      }
      savedCart.items.forEach((item) => {
        const productId = item.id;
        const currentReserved = reservedMap.get(productId) || 0;
        reservedMap.set(productId, currentReserved + item.quantity);
      });
    });
    
    // Also add current cart items (this includes the loaded cart if one is active)
    cart.forEach((item) => {
      const productId = item.id;
      const currentReserved = reservedMap.get(productId) || 0;
      reservedMap.set(productId, currentReserved + item.quantity);
    });
    
    return reservedMap;
  }, [savedCarts, cart, currentCartId]);

  // Calculate total inventory quantity per product (before subtracting reserved)
  const totalInventoryQuantity = useMemo(() => {
    const quantityMap = new Map<string, number>();
    
    inventory
      .filter((item) => {
        const status = getExpiryStatus(item.expiry_date);
        return item.quantity > 0 && (status === "valid" || status === "near_expiry");
      })
      .forEach((item) => {
        const productId = item.product.id;
        const currentQuantity = quantityMap.get(productId) || 0;
        quantityMap.set(productId, currentQuantity + item.quantity);
      });
    
    return quantityMap;
  }, [inventory]);

  // Calculate available inventory quantity per product (subtracting reserved quantities)
  const productInventoryQuantity = useMemo(() => {
    const quantityMap = new Map(totalInventoryQuantity);
    
    // Subtract reserved quantities from all carts
    reservedQuantities.forEach((reservedQty, productId) => {
      const available = quantityMap.get(productId) || 0;
      quantityMap.set(productId, Math.max(0, available - reservedQty));
    });
    
    return quantityMap;
  }, [totalInventoryQuantity, reservedQuantities]);

  // Update displayed products with available quantities (after subtracting reserved)
  const filteredProducts = useMemo(() => {
    return displayedProducts.map((product) => {
      const availableQty = productInventoryQuantity.get(product.id) || 0;
      return {
        ...product,
        quantity: availableQty, // Show available quantity instead of total inventory
      };
    });
  }, [displayedProducts, productInventoryQuantity]);

  const addToCart = (product: Product) => {
    // Get total inventory quantity and available quantity
    const totalQty = totalInventoryQuantity.get(product.id) || 0;
    const availableQuantity = productInventoryQuantity.get(product.id) || 0;
    
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentCartQuantity + 1;

      // Check if new quantity exceeds available inventory
      if (newQuantity > availableQuantity) {
        if (typeof window !== "undefined") {
          const message = t("cashier.insufficientInventory") 
            ? t("cashier.insufficientInventory").replace("{{available}}", String(availableQuantity)).replace("{{requested}}", String(newQuantity))
            : `Insufficient inventory. Available: ${availableQuantity}, Requested: ${newQuantity}`;
          window.alert(message);
        }
        return prevCart; // Don't update cart
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          sku: product.sku || "",
          name: product.name,
          price: product.selling_price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    const availableQuantity = productInventoryQuantity.get(id) || 0;
    
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta;
            
            if (newQuantity <= 0) {
              return null; // Remove item if quantity becomes 0 or negative
            }

            // Check if new quantity exceeds available inventory (only when increasing)
            if (delta > 0 && newQuantity > availableQuantity) {
              if (typeof window !== "undefined") {
                const message = t("cashier.insufficientInventory") 
                  ? t("cashier.insufficientInventory").replace("{{available}}", String(availableQuantity)).replace("{{requested}}", String(newQuantity))
                  : `Insufficient inventory. Available: ${availableQuantity}, Requested: ${newQuantity}`;
                window.alert(message);
              }
              return item; // Keep current quantity
            }

            return { ...item, quantity: newQuantity };
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

  const handleSearch = () => {
    // Clear inventory list before search
    setDisplayedProducts([]);
    setInventory([]);
    setInventoryOffset(0);
    inventoryOffsetRef.current = 0;
    hasMoreInventoryRef.current = true;
    setHasMoreInventory(true);
    // Set search query to trigger API call
    setSearchQuery(searchInput.trim());
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleQRScan = async (decodedText: string) => {
    // Search inventory by SKU
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: "0",
        search: decodedText.trim(), // Use search parameter for QR code scanning
      });

      const inventoryResponse = await fetch(`${API_BASE_URL}/api/inventories?${params.toString()}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (inventoryResponse.ok) {
        const inventoryResult = await inventoryResponse.json();
        const inventoryData = inventoryResult.data && Array.isArray(inventoryResult.data)
          ? inventoryResult.data
          : Array.isArray(inventoryResult)
          ? inventoryResult
          : inventoryResult.inventories || [];
        
        // Find product by SKU in the results
        const inventoryItem = inventoryData.find((item: InventoryItem) => 
          item.product.sku === decodedText
        );

        if (inventoryItem) {
          const product: Product = {
            id: inventoryItem.product.id,
            name: inventoryItem.product.name,
            sku: inventoryItem.product.sku,
            category: inventoryItem.product.category || { id: "", name: "" },
            selling_price: inventoryItem.product.selling_price || 0,
          };
          addToCart(product);
        } else {
          // If not found, set search input and trigger search
          setSearchInput(decodedText);
          setSearchQuery(decodedText);
        }
      } else {
        // If API call fails, set search input and trigger search
        setSearchInput(decodedText);
        setSearchQuery(decodedText);
      }
    } catch (error) {
      console.error("Error searching inventory by SKU:", error);
      // If error, set search input and trigger search
      setSearchInput(decodedText);
      setSearchQuery(decodedText);
    }
  };

  const handleSaveCart = () => {
    if (cart.length === 0) {
      window.alert(t("cashier.cartEmpty") || "Cart is empty. Add items before saving.");
      return;
    }

    if (currentCartId) {
      // Update existing cart
      const updated = updateCart(currentCartId, cart, cartName || undefined);
      if (updated) {
        setSavedCarts(getSavedCarts());
        // Keep currentCartId so the cart remains "active" and is excluded from savedCarts count
        // Only update cartName if a new name was provided
        if (cartName) {
          setCartName(cartName);
        }
        setIsSaveCartModalOpen(false);
        window.alert(t("cashier.cartUpdated") || "Cart updated successfully!");
      }
    } else {
      // Save new cart
      setIsSaveCartModalOpen(true);
    }
  };

  const handleConfirmSaveCart = () => {
    if (cart.length === 0) return;

    try {
      const saved = saveCart(cart, cartName || undefined);
      setSavedCarts(getSavedCarts());
      setCurrentCartId(saved.id);
      setCartName("");
      setIsSaveCartModalOpen(false);
      window.alert(t("cashier.cartSaved") || "Cart saved successfully!");
    } catch (error) {
      window.alert(t("cashier.failedToSaveCart") || "Failed to save cart");
    }
  };

  const handleNewCart = () => {
    if (cart.length > 0) {
      if (!window.confirm(t("cashier.confirmNewCart") || "Create a new cart? Current cart will be cleared.")) {
        return;
      }
    }
    setCart([]);
    setCurrentCartId(null);
    setCartName("");
  };

  const handleLoadCart = (savedCart: SavedCart) => {
    if (cart.length > 0 && !currentCartId) {
      if (!window.confirm(t("cashier.confirmLoadCart") || "Load this cart? Current cart will be replaced.")) {
        return;
      }
    }
    setCart(savedCart.items);
    setCurrentCartId(savedCart.id);
    setCartName(savedCart.name);
    setIsLoadCartModalOpen(false);
  };

  const handleDeleteCart = (cartId: string) => {
    if (window.confirm(t("cashier.confirmDeleteCart") || "Are you sure you want to delete this cart?")) {
      deleteCart(cartId);
      setSavedCarts(getSavedCarts());
      if (currentCartId === cartId) {
        setCurrentCartId(null);
        setCartName("");
      }
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      // Submit order to backend
      const response = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          customer_name: customerName.trim() || "Walk-in Customer",
          grand_total: total,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to create order");
      }

      const orderData = await response.json();

      // Show success message
      if (typeof window !== "undefined") {
        window.alert(
          t("cashier.orderCreatedSuccess") || 
          `Order created successfully!\n\nTotal: Rp ${total.toLocaleString("id-ID")}`
        );
      }

      // Delete saved cart if it was a saved cart
      if (currentCartId) {
        deleteCart(currentCartId);
        setSavedCarts(getSavedCarts());
        setCurrentCartId(null);
        setCartName("");
      }

      // Clear cart and reset customer name
      setCart([]);
      setCustomerName("");
      setIsCheckoutModalOpen(false);
      
      // Optionally redirect to orders page
      // router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      if (typeof window !== "undefined") {
        window.alert(
          error instanceof Error 
            ? error.message 
            : t("cashier.failedToCreateOrder") || "Failed to create order. Please try again."
        );
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Panel */}
      <div className="lg:col-span-2">
        {/* Saved Carts Section */}
        {savedCarts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t("cashier.savedCarts") || "Saved Carts"}</h2>
              <button
                onClick={() => setIsLoadCartModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("cashier.viewAll") || "View All"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {savedCarts.slice(0, 4).map((savedCart, index) => (
                <motion.div
                  key={savedCart.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    currentCartId === savedCart.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleLoadCart(savedCart)}
                >
                  {currentCartId === savedCart.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                      {savedCart.name || t("cashier.unnamedCart") || "Unnamed Cart"}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {savedCart.items.length} {t("cashier.items") || "items"}
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    Rp {savedCart.total.toLocaleString("id-ID")}
                  </div>
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadCart(savedCart);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title={t("cashier.loadCart") || "Load Cart"}
                    >
                      {t("cashier.load") || "Load"}
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCart(savedCart.id);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("cashier.productSelection")}</h2>
          
          {/* Search Bar */}
          <div className="relative flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              title="Search"
            >
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
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
          <div
            ref={setProductScrollContainer}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
              if (scrollBottom < 100 && !isLoadingMoreRef.current && hasMoreInventoryRef.current) {
                loadMoreInventory();
              }
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto"
          >
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p>{t("common.loading")}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>{t("cashier.noProductsFound") || "No products found"}</p>
              </div>
            ) : (
              <>
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
                    <div className="text-xs text-gray-500 mb-1">{product.sku || "-"}</div>
                    {product.quantity !== undefined && (
                      <div className="text-xs text-gray-600 mb-2">
                        {t("cashier.quantity") || "Qty"}: {product.quantity}
                      </div>
                    )}
                    <div className="text-sm font-semibold text-blue-600">
                      Rp {product.selling_price.toLocaleString("id-ID")}
                    </div>
                  </motion.button>
                ))}
                {isLoadingMore && (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">{t("common.loading")}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">{t("cashier.cart")}</h2>
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
                {currentCartId && (
                  <div className="text-xs text-gray-500 mb-2">
                    {t("cashier.savedAs") || "Saved as"}: {cartName || getCartById(currentCartId)?.name}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">{t("cashier.total")}:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    onClick={handleNewCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    title={t("cashier.newCart") || "New Cart"}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("cashier.newCart") || "New"}</span>
                  </motion.button>
                  <motion.button
                    onClick={handleSaveCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentCartId ? t("cashier.updateCart") || "Update" : t("cashier.saveCart") || "Save"}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setIsLoadCartModalOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("cashier.loadCart") || "Load"}</span>
                  </motion.button>
                </div>
                <motion.button
                  onClick={handleCheckout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                >
                  {t("cashier.checkout")}
                </motion.button>
                <button
                  onClick={() => {
                    setCart([]);
                    setCurrentCartId(null);
                    setCartName("");
                  }}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("cashier.clearCart") || "Clear Cart"}
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

      {/* Save Cart Modal */}
      <AnimatePresence>
        {isSaveCartModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setIsSaveCartModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentCartId ? t("cashier.updateCart") || "Update Cart" : t("cashier.saveCart") || "Save Cart"}
                </h3>
                <button
                  onClick={() => {
                    setIsSaveCartModalOpen(false);
                    setCartName("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("cashier.cartName") || "Cart Name"} {t("form.optional") || "(optional)"}
                </label>
                <input
                  type="text"
                  value={cartName}
                  onChange={(e) => setCartName(e.target.value)}
                  placeholder={t("cashier.cartNamePlaceholder") || "Enter cart name..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleConfirmSaveCart();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsSaveCartModalOpen(false);
                    setCartName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <motion.button
                  onClick={handleConfirmSaveCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("common.save")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setIsCheckoutModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("cashier.checkout") || "Checkout"}
                </h3>
                <button
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    setCustomerName("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("cashier.customerName") || "Customer Name"} {t("form.optional") || "(optional)"}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("cashier.customerNamePlaceholder") || "Enter customer name or leave blank for walk-in..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleConfirmCheckout();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t("cashier.total") || "Total"}:</span>
                  <span className="text-xl font-bold text-blue-600">
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {cart.length} {t("cashier.items") || "items"}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    setCustomerName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <motion.button
                  onClick={handleConfirmCheckout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("cashier.confirmCheckout") || "Confirm Checkout"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load Cart Modal */}
      <AnimatePresence>
        {isLoadCartModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setIsLoadCartModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("cashier.loadCart") || "Load Cart"}
                </h3>
                <button
                  onClick={() => setIsLoadCartModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4">
                {savedCarts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>{t("cashier.noSavedCarts") || "No saved carts"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedCarts.map((savedCart) => (
                      <motion.div
                        key={savedCart.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{savedCart.name}</div>
                          <div className="text-sm text-gray-500">
                            {savedCart.items.length} {t("cashier.items") || "items"} • Rp {savedCart.total.toLocaleString("id-ID")}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(savedCart.updatedAt).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() => handleLoadCart(savedCart)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title={t("cashier.loadCart") || "Load Cart"}
                          >
                            <Check className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteCart(savedCart.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title={t("common.delete")}
                          >
                            <Trash2 className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

