"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, Search } from "lucide-react";
import { type Order } from "@/lib/orders";
import Pagination from "@/components/admin/Pagination";
import { useLanguage } from "@/contexts/LanguageContext";

interface ApiOrderItem {
  id: number;
  product_id: string;
  quantity: number;
  total_price: string;
  product: {
    id: string;
    name: string;
    sku: string;
    selling_price: string;
  };
}

interface ApiOrder {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_price: string;
  store_id: string;
  created_at: string;
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
  store?: {
    id: string;
    name: string;
    store_code: string;
  };
  orderItems: ApiOrderItem[];
}

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

        const params = new URLSearchParams({
          limit: itemsPerPage.toString(),
          offset: ((currentPage - 1) * itemsPerPage).toString(),
        });

        // Add search parameter if search query exists
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const response = await fetch(`${API_BASE_URL}/api/orders?${params.toString()}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          
          // Handle different response formats
          let ordersData: ApiOrder[] = [];
          let total = 0;
          
          if (result.data && Array.isArray(result.data)) {
            ordersData = result.data;
            total = result.total || result.data.length;
          } else if (Array.isArray(result)) {
            ordersData = result;
            total = result.length;
          } else if (result.orders && Array.isArray(result.orders)) {
            ordersData = result.orders;
            total = result.total || result.orders.length;
          }

          // Transform API response to match Order interface
          const transformedOrders: Order[] = ordersData.map((order: ApiOrder) => {
            // Ensure orderItems is an array
            const orderItems = Array.isArray(order.orderItems) ? order.orderItems : [];
            
            return {
              id: String(order.id),
              orderNumber: order.invoice_number || `ORD-${order.id}`,
              customerName: order.customer_name || "Walk-in Customer",
              total: parseFloat(order.total_price) || 0,
              status: "completed" as Order["status"], // Default to completed since API doesn't provide status
              createdAt: order.created_at || new Date().toISOString(),
              items: orderItems.map((item: ApiOrderItem) => ({
                id: item.product?.id || item.product_id || "",
                sku: item.product?.sku || "",
                name: item.product?.name || "Unknown Product",
                price: parseFloat(item.product?.selling_price) || parseFloat(item.total_price) / item.quantity || 0,
                quantity: item.quantity || 0,
              })),
            };
          });

          setOrders(transformedOrders);
          setTotalItems(total);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch orders:", response.status, errorData);
          setOrders([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, searchQuery, API_BASE_URL, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedOrders = orders;

  const getStatusBadge = (status: Order["status"]) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("orders.title")}</h1>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by order number, customer name, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {searchQuery && !isLoading && (
          <p className="text-sm text-gray-500 mt-3">
            Found {totalItems} order{totalItems !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                      {t("common.loading") || "Loading..."}
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery
                      ? "No orders found matching your search."
                      : "No orders yet. Start by creating an order from the Cashier page."}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customerName || "Walk-in Customer"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      Rp {order.total.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          // Show order details
                          const itemsList = order.items
                            .map((item) => `${item.name} (${item.quantity}x)`)
                            .join("\n");
                          if (typeof window !== "undefined") {
                            window.alert(
                              `Order #${order.orderNumber}\n\n` +
                                `Customer: ${order.customerName || "Walk-in Customer"}\n` +
                                `Date: ${formatDate(order.createdAt)}\n` +
                                `Status: ${order.status}\n\n` +
                                `Items:\n${itemsList}\n\n` +
                                `Total: Rp ${order.total.toLocaleString("id-ID")}`
                            );
                          }
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && paginatedOrders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        )}
      </div>
    </div>
  );
}
