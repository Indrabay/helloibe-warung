"use client";

import { Package, AlertCircle, CheckCircle, Search, Calendar, XCircle, Box } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Pagination from "@/components/admin/Pagination";
import { getInventory, type InventoryItem } from "@/lib/inventory";
import { useLanguage } from "@/contexts/LanguageContext";

export default function InventoryPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [allInventoryItems, setAllInventoryItems] = useState<InventoryItem[]>([]);
  const itemsPerPage = 10;

  // Load inventory from localStorage
  useEffect(() => {
    const inventory = getInventory();
    setAllInventoryItems(inventory);
  }, []);

  // Refresh inventory when window gains focus (to reflect changes from other tabs/pages)
  useEffect(() => {
    const handleFocus = () => {
      const inventory = getInventory();
      setAllInventoryItems(inventory);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const getExpiryStatus = (expiryDate: string) => {
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

  const getExpiryBadge = (expiryDate: string) => {
    const status = getExpiryStatus(expiryDate);
    const expiry = new Date(expiryDate);
    const formattedDate = expiry.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    if (status === "expired") {
      return (
        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          Expired
        </span>
      );
    } else if (status === "near_expiry") {
      return (
        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Near Expiry
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        {formattedDate}
      </span>
    );
  };

  const filteredItems = useMemo(() => {
    return allInventoryItems.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        item.sku.toLowerCase().includes(searchLower) ||
        item.name.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower);
      
      let matchesStatus = true;
      if (statusFilter === "expired") {
        matchesStatus = getExpiryStatus(item.expiry_date) === "expired";
      } else if (statusFilter === "near_expiry") {
        matchesStatus = getExpiryStatus(item.expiry_date) === "near_expiry";
      } else if (statusFilter === "empty") {
        matchesStatus = item.quantity === 0;
      } else if (statusFilter === "valid") {
        matchesStatus = getExpiryStatus(item.expiry_date) === "valid";
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const expiredCount = allInventoryItems.filter(
    (item) => getExpiryStatus(item.expiry_date) === "expired"
  ).length;
  const nearExpiryCount = allInventoryItems.filter(
    (item) => getExpiryStatus(item.expiry_date) === "near_expiry"
  ).length;
  const emptyStockCount = allInventoryItems.filter((item) => item.quantity === 0).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("inventory.title")}</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Package className="h-4 w-4" />
          {t("inventory.addStock")}
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory by SKU, product name, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid</option>
              <option value="near_expiry">Near Expiry</option>
              <option value="expired">Expired</option>
              <option value="empty">Empty Stock</option>
            </select>
          </div>
        </div>
        {(searchQuery || statusFilter !== "all") && (
          <p className="text-sm text-gray-500 mt-3">
            Found {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{filteredItems.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Near Expiry</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{nearExpiryCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{expiredCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empty Stock</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{emptyStockCount}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Box className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No inventory items found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const expiryStatus = getExpiryStatus(item.expiry_date);
                  const expiryDate = new Date(item.expiry_date);
                  const formattedDate = expiryDate.toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "#f9fafb" }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`text-sm font-semibold ${
                              item.quantity === 0
                                ? "text-red-600"
                                : item.quantity < 10
                                ? "text-yellow-600"
                                : "text-gray-900"
                            }`}
                          >
                            {item.quantity}
                          </div>
                          {item.quantity > 0 && (
                            <div className="ml-4 w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.quantity < 10 ? "bg-yellow-500" : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(100, (item.quantity / 50) * 100)}%`,
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{formattedDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getExpiryBadge(item.expiry_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button className="text-blue-600 hover:text-blue-900 hover:underline">
                            Update
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 hover:underline">
                            History
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredItems.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredItems.length}
          />
        )}
      </div>
    </div>
  );
}
