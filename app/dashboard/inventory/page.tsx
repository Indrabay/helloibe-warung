"use client";

import { Package, AlertCircle, CheckCircle, Search, Calendar, XCircle, Box } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Pagination from "@/components/admin/Pagination";
import { useLanguage } from "@/contexts/LanguageContext";
import AddInventoryModal from "@/components/admin/AddInventoryModal";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/roles";

interface InventoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  quantity: number;
  expiry_date: string;
  location: string;
  created_at?: string;
  updated_at?: string;
}

export default function InventoryPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userIsSuperAdmin = isSuperAdmin(user?.role);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 100;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch inventory from API
  useEffect(() => {
    fetchInventory(currentPage, searchQuery, statusFilter);
  }, [currentPage, searchQuery, statusFilter]);

  const fetchInventory = async (page: number = 1, search: string = "", status: string = "all") => {
    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const offset = (page - 1) * itemsPerPage;

      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      if (search.trim()) {
        params.append("search", search.trim());
      }
      
      if (status !== "all") {
        params.append("status", status);
      }

      const response = await fetch(`${API_BASE_URL}/api/inventories?${params.toString()}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          setInventoryItems(result.data);
          setTotalItems(result.total || 0);
        } else if (Array.isArray(result)) {
          setInventoryItems(result);
          setTotalItems(result.length);
        } else {
          setInventoryItems(result.inventories || []);
          setTotalItems(result.total || 0);
        }
      } else {
        console.error("Failed to fetch inventory");
        setInventoryItems([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventoryItems([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }
  };

  const handleAddInventory = async (inventory: {
    product_id: string;
    quantity: number;
    expiry_date: string;
    location: string;
    store_id?: string;
  }) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const response = await fetch(`${API_BASE_URL}/api/inventories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(inventory),
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(t("inventory.inventoryAddedSuccess") || "Inventory added successfully!");
        setIsAddModalOpen(false);
        fetchInventory(currentPage, searchQuery, statusFilter);
      } else {
        window.alert(data.error || data.message || (t("inventory.failedToAddInventory") || "Failed to add inventory"));
      }
    } catch (error) {
      console.error("Error adding inventory:", error);
      window.alert(t("inventory.errorAddingInventory") || "An error occurred while adding inventory");
    }
  };

  const handleBulkAdd = async (file: File) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/inventories/batch`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(t("inventory.bulkUploadSuccess") || `Bulk upload successful! ${data.count || "Items"} added.`);
        setIsAddModalOpen(false);
        fetchInventory(currentPage, searchQuery, statusFilter);
      } else {
        window.alert(data.error || data.message || (t("inventory.failedToUploadInventory") || "Failed to upload inventory"));
      }
    } catch (error) {
      console.error("Error uploading inventory:", error);
      window.alert(t("inventory.errorUploadingInventory") || "An error occurred while uploading inventory");
    }
  };

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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate counts from current items (could be improved with API aggregation)
  const expiredCount = inventoryItems.filter(
    (item) => getExpiryStatus(item.expiry_date) === "expired"
  ).length;
  const nearExpiryCount = inventoryItems.filter(
    (item) => getExpiryStatus(item.expiry_date) === "near_expiry"
  ).length;
  const emptyStockCount = inventoryItems.filter((item) => item.quantity === 0).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("inventory.title")}</h1>
        <motion.button
          onClick={() => setIsAddModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Package className="h-4 w-4" />
          {t("inventory.addStock")}
        </motion.button>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("inventory.searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("inventory.allStatus") || "All Status"}</option>
              <option value="valid">{t("inventory.valid")}</option>
              <option value="near_expiry">{t("inventory.nearExpiry")}</option>
              <option value="expired">{t("inventory.expired")}</option>
              <option value="empty">{t("inventory.emptyStock")}</option>
            </select>
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            {t("common.search")}
          </motion.button>
        </form>
        {(searchQuery || statusFilter !== "all") && (
          <p className="text-sm text-gray-500 mt-3">
            {t("pagination.showing")} {totalItems} {t("pagination.results")}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("inventory.totalItems") || "Total Items"}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalItems}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t("dashboard.nearExpiry")}</p>
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
              <p className="text-sm font-medium text-gray-600">{t("dashboard.pastExpiry")}</p>
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
              <p className="text-sm font-medium text-gray-600">{t("dashboard.emptyStock")}</p>
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3">{t("common.loading")}</span>
                    </div>
                  </td>
                </tr>
              ) : inventoryItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t("inventory.noInventory")}
                  </td>
                </tr>
              ) : (
                inventoryItems.map((item, index) => {
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
                        <div className="text-sm font-medium text-gray-900">{item.product?.sku || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.product?.name || "-"}</div>
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
        {inventoryItems.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        )}
      </div>

      {/* Add Inventory Modal */}
      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddInventory={handleAddInventory}
        onBulkAdd={handleBulkAdd}
      />
    </div>
  );
}
