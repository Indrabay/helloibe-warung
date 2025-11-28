"use client";

import { Plus, Search, QrCode, Eye, Edit, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Pagination from "@/components/admin/Pagination";
import QRScanner from "@/components/admin/QRScanner";
import AddProductModal from "@/components/admin/AddProductModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchCategories, type Category } from "@/lib/categories";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/roles";

interface UserRef {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
  sku?: string;
  selling_price: number;
  purchase_price: number;
  created_at?: string;
  created_by?: UserRef | null;
  updated_at?: string;
  updated_by?: UserRef | null;
}

interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const userIsSuperAdmin = isSuperAdmin(user?.role);
  const [searchInput, setSearchInput] = useState("");
  const [skuInput, setSkuInput] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [skuQuery, setSkuQuery] = useState("");
  const [storeQuery, setStoreQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const itemsPerPage = 10;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Fetch stores if user is super_admin
  useEffect(() => {
    const fetchStores = async () => {
      if (userIsSuperAdmin) {
        try {
          setIsLoadingStores(true);
          const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
          
          const response = await fetch(`${API_BASE_URL}/api/stores?limit=100&offset=0`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
              setStores(result.data);
            } else if (Array.isArray(result)) {
              setStores(result);
            }
          }
        } catch (error) {
          console.error("Error fetching stores:", error);
        } finally {
          setIsLoadingStores(false);
        }
      }
    };

    if (userIsSuperAdmin) {
      fetchStores();
    }
  }, [userIsSuperAdmin, API_BASE_URL]);

  // Fetch products from API
  useEffect(() => {
    fetchProducts(currentPage, nameQuery, skuQuery, storeQuery);
  }, [currentPage, nameQuery, skuQuery, storeQuery]);

  const fetchProducts = async (page: number = 1, name: string = "", sku: string = "", store_id: string = "") => {
    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const offset = (page - 1) * itemsPerPage;
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      if (name.trim()) {
        params.append("name", name.trim());
      }
      if (sku.trim()) {
        params.append("sku", sku.trim());
      }
      if (store_id.trim()) {
        params.append("store_id", store_id.trim());
      }
      
      const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Handle response format: {data, limit, offset, total}
        if (result.data && Array.isArray(result.data)) {
          setProducts(result.data);
          setTotalItems(result.total || 0);
        } else if (Array.isArray(result)) {
          // Fallback for old format
          setProducts(result);
          setTotalItems(result.length);
        } else {
          setProducts(result.products || []);
          setTotalItems(result.total || 0);
        }
      } else {
        console.error("Failed to fetch products");
        setProducts([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameQuery(searchInput);
    setSkuQuery(skuInput);
    setStoreQuery(storeFilter);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setNameQuery(searchInput);
      setSkuQuery(skuInput);
      setCurrentPage(1);
    }
  };

  const handleQRScan = (decodedText: string) => {
    setSkuInput(decodedText);
    setSkuQuery(decodedText);
    setCurrentPage(1);
    setIsQRScannerOpen(false);
  };

  const handleAddProduct = async (product: { name: string; category_id: string; sku?: string; selling_price: number; purchase_price: number; store_id?: string }) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(`Product "${product.name}" added successfully!`);
        setIsAddProductModalOpen(false);
        // Refresh products list
        fetchProducts(currentPage, nameQuery, skuQuery, storeQuery);
      } else {
        window.alert(data.error || data.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      window.alert("An error occurred while adding the product");
    }
  };

  const handleBulkAdd = async (file: File) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/products/batch`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(`Bulk upload successful! ${data.count || "Products"} added.`);
        setIsAddProductModalOpen(false);
        // Refresh products list
        fetchProducts(currentPage, nameQuery, skuQuery, storeQuery);
      } else {
        window.alert(data.error || data.message || "Failed to upload products");
      }
    } catch (error) {
      console.error("Error uploading products:", error);
      window.alert("An error occurred while uploading products");
    }
  };

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("products.confirmDelete") || "Are you sure you want to delete this product?")) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        
        const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
          method: "DELETE",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          window.alert(t("products.productDeleted") || "Product deleted successfully");
          fetchProducts(currentPage, nameQuery, skuQuery, storeQuery);
        } else {
          const data = await response.json();
          window.alert(data.error || data.message || t("products.failedToDeleteProduct") || "Failed to delete product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        window.alert(t("products.errorDeletingProduct") || "An error occurred while deleting the product");
      }
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("products.title")}</h1>
        <motion.button
          onClick={() => setIsAddProductModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Product
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
                placeholder={t("products.searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <input
              type="text"
              placeholder="SKU"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit(e as any);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {userIsSuperAdmin && (
            <div className="md:w-48">
              <select
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setStoreQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingStores}
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <motion.button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              title={t("products.scanQR")}
            >
              <QrCode className="h-5 w-5" />
              <span className="hidden sm:inline">{t("products.scanQR")}</span>
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              {t("common.search")}
            </motion.button>
          </div>
        </form>
        {(nameQuery || skuQuery || storeQuery) && (
          <p className="text-sm text-gray-500 mt-3">
            Showing results for{" "}
            {nameQuery && `name: "${nameQuery}"`}
            {nameQuery && (skuQuery || storeQuery) && " and"}
            {skuQuery && ` SKU: "${skuQuery}"`}
            {storeQuery && (nameQuery || skuQuery) && " and"}
            {storeQuery && ` store: "${stores.find(s => s.id === storeQuery)?.name || storeQuery}"`}
            {" "}- {totalItems} product{totalItems !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3">{t("common.loading")}</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t("products.noProducts")}
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category?.name || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        Rp {product.selling_price.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        Rp {product.purchase_price.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <motion.button
                          onClick={() => handleViewDetail(product)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(product.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {products.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAddProduct={handleAddProduct}
        onBulkAdd={handleBulkAdd}
        categories={categories}
      />

      {/* Product Detail Modal */}
      {isDetailModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{t("products.detail")}</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500">{t("products.productName")}</label>
                <p className="mt-1 text-lg text-gray-900">{selectedProduct.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t("products.category") || "Category"}</label>
                <p className="mt-1 text-lg text-gray-900">{selectedProduct.category?.name || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t("products.sku") || "SKU"}</label>
                <p className="mt-1 text-lg text-gray-900">{selectedProduct.sku || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t("products.sellingPrice") || "Selling Price"}</label>
                <p className="mt-1 text-lg text-gray-900">Rp {selectedProduct.selling_price.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t("products.purchasePrice") || "Purchase Price"}</label>
                <p className="mt-1 text-lg text-gray-900">Rp {selectedProduct.purchase_price.toLocaleString("id-ID")}</p>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t("common.metadata") || "Metadata"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("common.createdAt") || "Created At"}</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedProduct.created_at
                        ? new Date(selectedProduct.created_at).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("common.createdBy") || "Created By"}</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedProduct.created_by ? (
                        <span>
                          {selectedProduct.created_by.name} ({selectedProduct.created_by.email})
                        </span>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("common.updatedAt") || "Updated At"}</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedProduct.updated_at
                        ? new Date(selectedProduct.updated_at).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t("common.updatedBy") || "Updated By"}</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedProduct.updated_by ? (
                        <span>
                          {selectedProduct.updated_by.name} ({selectedProduct.updated_by.email})
                        </span>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <motion.button
                onClick={() => setIsDetailModalOpen(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t("common.close") || "Close"}
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  router.push(`/dashboard/products/${selectedProduct.id}/edit`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("common.edit") || "Edit Product"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
