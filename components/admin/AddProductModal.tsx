"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Plus } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Product {
  name: string;
  category: string;
  sku: string;
  selling_price: number;
  purchase_price: number;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
  onBulkAdd: (products: Product[]) => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onAddProduct,
  onBulkAdd,
}: AddProductModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sku: "",
    selling_price: "",
    purchase_price: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Product[] | null>(null);

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.name ||
      !formData.category ||
      !formData.sku ||
      !formData.selling_price ||
      !formData.purchase_price
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const product: Product = {
      name: formData.name,
      category: formData.category,
      sku: formData.sku,
      selling_price: parseFloat(formData.selling_price),
      purchase_price: parseFloat(formData.purchase_price),
    };

    onAddProduct(product);
    handleClose();
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
      setError("Unsupported file format. Please upload CSV or XLSX file.");
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const products = validateProducts(results.data as any[]);
          setPreview(products);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to parse CSV file");
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
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

        const products = validateProducts(jsonData as any[]);
        setPreview(products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse XLSX file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateProducts = (data: any[]): Product[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No data found in file");
    }

    return data.map((row, index) => {
      const name = row.name || row.Name || row.NAME || "";
      const category = row.category || row.Category || row.CATEGORY || "";
      const sku = row.sku || row.SKU || row.Sku || "";
      const selling_price =
        row.selling_price ||
        row["Selling Price"] ||
        row["selling price"] ||
        row["Selling Price (Rp)"] ||
        0;
      const purchase_price =
        row.purchase_price ||
        row["Purchase Price"] ||
        row["purchase price"] ||
        row["Purchase Price (Rp)"] ||
        0;

      if (!name || !category || !sku) {
        throw new Error(
          `Row ${index + 2}: Missing required fields (name, category, sku)`
        );
      }

      return {
        name: String(name),
        category: String(category),
        sku: String(sku),
        selling_price: parseFloat(String(selling_price)) || 0,
        purchase_price: parseFloat(String(purchase_price)) || 0,
      };
    });
  };

  const handleBulkUpload = () => {
    if (!preview || preview.length === 0) {
      setError("No products to upload");
      return;
    }

    setUploading(true);
    try {
      onBulkAdd(preview);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload products");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      category: "",
      sku: "",
      selling_price: "",
      purchase_price: "",
    });
    setFile(null);
    setPreview(null);
    setError(null);
    setActiveTab("single");
    onClose();
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
          <h2 className="text-xl font-semibold text-gray-900">Add Products</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
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
            Single Product
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
            Bulk Upload
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === "single" ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Nasi Goreng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Course"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., NG-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15000"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV or XLSX File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose File
                  </label>
                  {file && (
                    <p className="mt-2 text-sm text-gray-600">{file.name}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Supported formats: CSV, XLSX, XLS
                  </p>
                  <details className="mt-4 text-left">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      Expected file format
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                      <p className="font-medium mb-2">CSV/XLSX columns:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li><strong>name</strong> - Product name (required)</li>
                        <li><strong>category</strong> - Product category (required)</li>
                        <li><strong>sku</strong> - Product SKU (required)</li>
                        <li><strong>selling_price</strong> - Selling price in Rp (required)</li>
                        <li><strong>purchase_price</strong> - Purchase price in Rp (required)</li>
                      </ul>
                    </div>
                  </details>
                </div>
              </div>

              {preview && preview.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Preview ({preview.length} products)
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Category
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              SKU
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Selling Price
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Purchase Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.slice(0, 10).map((product, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">
                                {product.category}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {product.sku}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                Rp {product.selling_price.toLocaleString("id-ID")}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                Rp {product.purchase_price.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {preview.length > 10 && (
                        <p className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                          ... and {preview.length - 10} more products
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
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!preview || preview.length === 0 || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : `Upload ${preview?.length || 0} Products`}
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

