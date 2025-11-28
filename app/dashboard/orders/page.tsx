"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, Search } from "lucide-react";
import { getOrders, type Order } from "@/lib/orders";
import Pagination from "@/components/admin/Pagination";
import { useLanguage } from "@/contexts/LanguageContext";

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Load orders from localStorage
    setOrders(getOrders());
    
    // Listen for storage changes (when new orders are added from cashier)
    const handleStorageChange = () => {
      setOrders(getOrders());
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Also check periodically for changes (since storage event only fires in other tabs)
    const interval = setInterval(() => {
      setOrders(getOrders());
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query))
      );
    });
  }, [orders, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

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
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-3">
            Found {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {orders.length === 0
                      ? "No orders yet. Start by creating an order from the Cashier page."
                      : "No orders found matching your search."}
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
        {filteredOrders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredOrders.length}
          />
        )}
      </div>
    </div>
  );
}
