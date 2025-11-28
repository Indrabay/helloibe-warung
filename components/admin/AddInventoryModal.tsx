"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Search, Upload, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/roles";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface Store {
  id: string;
  name: string;
}

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInventory: (inventory: {
    product_id: string;
    quantity: number;
    expiry_date: string;
    location: string;
    store_id?: string;
  }) => Promise<void>;
  onBulkAdd?: (file: File) => Promise<void>;
}

export default function AddInventoryModal({
  isOpen,
  onClose,
  onAddInventory,
  onBulkAdd,
}: AddInventoryModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userIsSuperAdmin = isSuperAdmin(user?.role);
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    expiry_date: "",
    location: "",
    store_id: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch all products for bulk upload
  useEffect(() => {
    const fetchAllProducts = async () => {
      if (isOpen && activeTab === "bulk") {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

          const response = await fetch(`${API_BASE_URL}/api/products?limit=1000&offset=0`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
              setAllProducts(result.data);
            } else if (Array.isArray(result)) {
              setAllProducts(result);
            }
          }
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      }
    };

    if (isOpen && activeTab === "bulk") {
      fetchAllProducts();
    }
  }, [isOpen, activeTab, API_BASE_URL]);

  // Fetch products with search
  useEffect(() => {
    const fetchProducts = async () => {
      if (isOpen && activeTab === "single") {
        try {
          setIsLoadingProducts(true);
          const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

          const params = new URLSearchParams({
            limit: "100",
            offset: "0",
          });
          
          if (productSearch.trim()) {
            params.append("name", productSearch.trim());
          }

          const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
              setProducts(result.data);
            } else if (Array.isArray(result)) {
              setProducts(result);
            }
          }
        } catch (error) {
          console.error("Error fetching products:", error);
        } finally {
          setIsLoadingProducts(false);
        }
      }
    };

    if (isOpen && activeTab === "single") {
      const timeoutId = setTimeout(() => {
        fetchProducts();
      }, 300); // Debounce search by 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, productSearch, activeTab, API_BASE_URL]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    if (showProductDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProductDropdown]);

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    const searchLower = productSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower))
    );
  });

  // Fetch stores if user is super_admin
  useEffect(() => {
    const fetchStores = async () => {
      if (isOpen && userIsSuperAdmin) {
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

    if (isOpen && userIsSuperAdmin) {
      fetchStores();
    }
  }, [isOpen, userIsSuperAdmin, API_BASE_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.product_id ||
      !formData.quantity ||
      !formData.expiry_date ||
      !formData.location ||
      (userIsSuperAdmin && !formData.store_id)
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddInventory({
        product_id: formData.product_id,
        quantity: parseInt(formData.quantity),
        expiry_date: formData.expiry_date,
        location: formData.location,
        ...(userIsSuperAdmin && formData.store_id && { store_id: formData.store_id }),
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      product_id: "",
      quantity: "",
      expiry_date: "",
      location: "",
      store_id: "",
    });
    setProductSearch("");
    setShowProductDropdown(false);
    setError(null);
    setFile(null);
    setPreview(null);
    setActiveTab("single");
    onClose();
  };

  const handleProductSelect = (product: Product) => {
    setFormData({ ...formData, product_id: product.id });
    setProductSearch(`${product.name}${product.sku ? ` (${product.sku})` : ""}`);
    setShowProductDropdown(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreview(null);

    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      parseCSV(selectedFile);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      parseXLSX(selectedFile);
    } else {
      setError(t("products.unsupportedFileFormat") || "Unsupported file format. Please upload CSV or XLSX file.");
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const inventory = validateInventory(results.data as any[]);
          setPreview(inventory);
        } catch (err) {
          setError(err instanceof Error ? err.message : t("products.failedToParseCSV") || "Failed to parse CSV file");
        }
      },
      error: (error) => {
        setError(`${t("products.errorParsingCSV") || "Error parsing CSV"}: ${error.message}`);
      },
    });
  };

  const parseXLSX = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const inventory = validateInventory(jsonData as any[]);
        setPreview(inventory);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("products.failedToParseXLSX") || "Failed to parse XLSX file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateInventory = (data: any[]): any[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(t("products.noDataInFile") || "No data found in file");
    }

    return data.map((row, index) => {
      const product_id = row.product_id || row.productId || row["product_id"] || row["Product ID"] || "";
      // Also support product name or SKU for backward compatibility
      const productName = row.product || row.Product || row.PRODUCT || row.name || row.Name || "";
      const productSku = row.sku || row.SKU || row.Sku || "";
      const quantity = row.quantity || row.Quantity || row.QUANTITY || 0;
      const expiry_date = row.expiry_date || row.expiryDate || row["expiry_date"] || row["Expiry Date"] || row["expiry date"] || "";
      const location = row.location || row.Location || row.LOCATION || "";
      const store_id = row.store_id || row.storeId || row["store_id"] || row["Store ID"] || "";
      const storeName = row.store || row.Store || row.STORE || "";

      // Determine product_id - use provided ID or find by name/SKU
      let finalProductId = product_id;
      if (!finalProductId && (productName || productSku)) {
        const foundProduct = allProducts.find(
          (p) =>
            (productName && p.name.toLowerCase() === String(productName).toLowerCase()) ||
            (productSku && p.sku && p.sku.toLowerCase() === String(productSku).toLowerCase())
        );
        if (foundProduct) {
          finalProductId = foundProduct.id;
        } else {
          throw new Error(
            `Row ${index + 2}: Product "${productName || productSku}" not found. Please use product_id or ensure the product exists.`
          );
        }
      }

      // Determine store_id - use provided ID or find by name (only for super_admin)
      let finalStoreId = store_id;
      if (userIsSuperAdmin && !finalStoreId && storeName) {
        const foundStore = stores.find(
          (s) => s.name.toLowerCase() === String(storeName).toLowerCase()
        );
        if (foundStore) {
          finalStoreId = foundStore.id;
        } else {
          throw new Error(
            `Row ${index + 2}: Store "${storeName}" not found. Please use store_id or ensure the store name exists.`
          );
        }
      }

      if (!finalProductId || !quantity || !expiry_date || !location) {
        throw new Error(
          `Row ${index + 2}: Missing required fields (product_id, quantity, expiry_date, location)`
        );
      }

      if (userIsSuperAdmin && !finalStoreId) {
        throw new Error(
          `Row ${index + 2}: Missing required field (store_id) for super admin`
        );
      }

      // Validate expiry date is not in the past
      const expiryDate = new Date(expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        throw new Error(
          `Row ${index + 2}: Expiry date cannot be in the past`
        );
      }

      return {
        product_id: String(finalProductId),
        quantity: parseInt(String(quantity)) || 0,
        expiry_date: String(expiry_date),
        location: String(location),
        ...(userIsSuperAdmin && finalStoreId && { store_id: String(finalStoreId) }),
      };
    });
  };

  const handleBulkUpload = async () => {
    if (!file) {
      setError(t("products.noFileSelected") || "No file selected");
      return;
    }

    if (!onBulkAdd) {
      setError("Bulk upload is not available");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await onBulkAdd(file);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("products.failedToUploadProducts") || "Failed to upload inventory");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">{t("inventory.addStock")}</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            {onBulkAdd && (
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("single")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "single"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  {t("inventory.singleEntry") || "Single Inventory"}
                </button>
                <button
                  onClick={() => setActiveTab("bulk")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "bulk"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  {t("inventory.bulkUpload") || "Bulk Upload Inventory"}
                </button>
              </div>
            )}

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {activeTab === "single" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {userIsSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("inventory.store")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.store_id}
                      onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoadingStores}
                    >
                      <option value="">{t("inventory.selectStore")}</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("products.productName")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={productDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                          if (!e.target.value) {
                            setFormData({ ...formData, product_id: "" });
                          }
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder={t("inventory.searchProductPlaceholder") || "Search product by name or SKU..."}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {showProductDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isLoadingProducts ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            {t("common.loading")}
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            {t("products.noProducts")}
                          </div>
                        ) : (
                          filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleProductSelect(product)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                            >
                              <div className="font-medium text-gray-900">{product.name}</div>
                              {product.sku && (
                                <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {!formData.product_id && (
                      <p className="mt-1 text-xs text-red-500">
                        {t("form.required") || "Required"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("inventory.quantity")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("inventory.quantityPlaceholder") || "Enter quantity"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("inventory.expiryDate")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("inventory.location")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("inventory.locationPlaceholder") || "e.g., Aisle 1, Shelf A"}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t("common.saving") : t("inventory.addStock")}
                  </button>
                </div>
              </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("products.uploadCSVXLSX") || "Upload CSV or XLSX File"}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="inventory-file-upload"
                      />
                      <label
                        htmlFor="inventory-file-upload"
                        className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t("inventory.chooseFile") || "Choose File"}
                      </label>
                      {file && (
                        <p className="mt-2 text-sm text-gray-600">{file.name}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {t("products.supportedFormats") || "Supported formats: CSV, XLSX, XLS"}
                      </p>
                      <details className="mt-4 text-left">
                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                          {t("inventory.expectedFormat") || "Expected format"}
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                          <p className="font-medium mb-2">{t("products.csvXLSXColumns") || "CSV/XLSX columns"}:</p>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li><strong>product_id</strong> - {t("inventory.productId") || "Product ID"} ({t("form.required") || "required"})</li>
                            <li><strong>quantity</strong> - {t("inventory.quantity")} ({t("form.required") || "required"})</li>
                            <li><strong>expiry_date</strong> - {t("inventory.expiryDate")} ({t("form.required") || "required"})</li>
                            <li><strong>location</strong> - {t("inventory.location")} ({t("form.required") || "required"})</li>
                            {userIsSuperAdmin && (
                              <li><strong>store_id</strong> - {t("inventory.store")} ({t("form.required") || "required"})</li>
                            )}
                          </ul>
                          <p className="mt-2 text-xs text-gray-500">
                            {t("inventory.productNameSkuFallback") || "You can also use 'product' column with product name or 'sku' with SKU, it will be mapped to product_id if found."}
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>

                  {preview && preview.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {t("products.filePreview") || "File Preview"} ({preview.length} {t("inventory.items") || "items"})
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  {t("products.productName")}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  {t("inventory.quantity")}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  {t("inventory.expiryDate")}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  {t("inventory.location")}
                                </th>
                                {userIsSuperAdmin && (
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    {t("inventory.store")}
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {preview.slice(0, 10).map((item, index) => {
                                const productName = allProducts.find((p) => p.id === item.product_id)?.name || item.product_id || "-";
                                const storeName = userIsSuperAdmin
                                  ? stores.find((s) => s.id === item.store_id)?.name || item.store_id || "-"
                                  : null;
                                return (
                                  <tr key={index}>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {productName}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {item.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {item.expiry_date}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {item.location}
                                    </td>
                                    {userIsSuperAdmin && (
                                      <td className="px-3 py-2 text-sm text-gray-500">
                                        {storeName}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {preview.length > 10 && (
                            <p className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                              ... {t("products.andMoreProducts")?.replace("{{count}}", String(preview.length - 10)) || `and ${preview.length - 10} more items`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!file || uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? t("common.uploading") || "Uploading..." : t("products.uploadFile") || "Upload File"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

