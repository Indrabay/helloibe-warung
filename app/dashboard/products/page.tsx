"use client";

import { Plus, Search, QrCode } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Pagination from "@/components/admin/Pagination";
import QRScanner from "@/components/admin/QRScanner";
import AddProductModal from "@/components/admin/AddProductModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  selling_price: number;
  purchase_price: number;
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const itemsPerPage = 10;

  const allProducts: Product[] = [
    {
      id: "1",
      name: "Nasi Goreng",
      category: "Main Course",
      sku: "NG-001",
      selling_price: 25000,
      purchase_price: 15000,
    },
    {
      id: "2",
      name: "Mie Ayam",
      category: "Main Course",
      sku: "MA-001",
      selling_price: 20000,
      purchase_price: 12000,
    },
    {
      id: "3",
      name: "Es Teh Manis",
      category: "Beverage",
      sku: "ETM-001",
      selling_price: 5000,
      purchase_price: 2000,
    },
    {
      id: "4",
      name: "Es Jeruk",
      category: "Beverage",
      sku: "EJ-001",
      selling_price: 6000,
      purchase_price: 2500,
    },
    {
      id: "5",
      name: "Ayam Goreng",
      category: "Main Course",
      sku: "AG-001",
      selling_price: 30000,
      purchase_price: 18000,
    },
  ];

  const categories = ["all", ...Array.from(new Set(allProducts.map((p) => p.category)))];

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter, allProducts]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <motion.button
                onClick={() => setIsQRScannerOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                title="Scan QR Code"
              >
                <QrCode className="h-5 w-5" />
                <span className="hidden sm:inline">Scan QR</span>
              </motion.button>
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-3">
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
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
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => (
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
                      <div className="text-sm text-gray-500">{product.category}</div>
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
                        <button className="text-blue-600 hover:text-blue-900 hover:underline">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredProducts.length}
          />
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={(decodedText) => {
          // Set the scanned QR code as the search query
          setSearchQuery(decodedText);
          setIsQRScannerOpen(false);
        }}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAddProduct={(product) => {
          // TODO: Add product to backend/state
          console.log("Add product:", product);
          // For now, just show a success message
          if (typeof window !== "undefined") {
            window.alert(`Product "${product.name}" added successfully!`);
          }
        }}
        onBulkAdd={(products) => {
          // TODO: Add products to backend/state
          console.log("Bulk add products:", products);
          // For now, just show a success message
          if (typeof window !== "undefined") {
            window.alert(`${products.length} products added successfully!`);
          }
        }}
      />
    </div>
  );
}
