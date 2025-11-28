"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import DashboardStatsCard from "@/components/admin/DashboardStatsCard";
import { Package, AlertTriangle, XCircle, Box, DollarSign, TrendingUp, Award } from "lucide-react";
import { getOrders, type Order } from "@/lib/orders";
import { getInventory, type InventoryItem } from "@/lib/inventory";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    // Load orders and inventory from localStorage
    setOrders(getOrders());
    setInventory(getInventory());
    
    // Listen for storage changes
    const handleStorageChange = () => {
      setOrders(getOrders());
      setInventory(getInventory());
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Also check periodically for changes
    const interval = setInterval(() => {
      setOrders(getOrders());
      setInventory(getInventory());
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Calculate revenue metrics
  const revenueData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    const todayRevenue = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today;
      })
      .reduce((sum, order) => sum + order.total, 0);

    const weekRevenue = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= thisWeek;
      })
      .reduce((sum, order) => sum + order.total, 0);

    const monthRevenue = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= thisMonth;
      })
      .reduce((sum, order) => sum + order.total, 0);

    return {
      total: totalRevenue,
      today: todayRevenue,
      week: weekRevenue,
      month: monthRevenue,
      orderCount: orders.length,
    };
  }, [orders]);

  // Calculate inventory stats from actual inventory data
  const dashboardData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let nearExpiryCount = 0;
    let expiredCount = 0;
    let emptyStockCount = 0;
    
    inventory.forEach((item) => {
      const expiry = new Date(item.expiry_date);
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        expiredCount++;
      } else if (diffDays <= 7) {
        nearExpiryCount++;
      }
      
      if (item.quantity === 0) {
        emptyStockCount++;
      }
    });
    
    return {
      totalProducts: inventory.length,
      nearExpiryDate: nearExpiryCount,
      passExpiryDate: expiredCount,
      emptyStock: emptyStockCount,
    };
  }, [inventory]);

  const stats = [
    {
      title: t("dashboard.totalRevenue"),
      value: `Rp ${revenueData.total.toLocaleString("id-ID")}`,
      icon: DollarSign,
      iconColor: "text-green-600",
      iconBgColor: "bg-green-100",
      description: `${revenueData.orderCount} ${t("dashboard.orders")}`,
    },
    {
      title: t("dashboard.todayRevenue"),
      value: `Rp ${revenueData.today.toLocaleString("id-ID")}`,
      icon: TrendingUp,
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100",
      description: t("dashboard.revenueFromToday"),
    },
    {
      title: t("dashboard.thisWeek"),
      value: `Rp ${revenueData.week.toLocaleString("id-ID")}`,
      icon: TrendingUp,
      iconColor: "text-purple-600",
      iconBgColor: "bg-purple-100",
      description: t("dashboard.revenueThisWeek"),
    },
    {
      title: t("dashboard.thisMonth"),
      value: `Rp ${revenueData.month.toLocaleString("id-ID")}`,
      icon: TrendingUp,
      iconColor: "text-indigo-600",
      iconBgColor: "bg-indigo-100",
      description: t("dashboard.revenueThisMonth"),
    },
    {
      title: t("dashboard.totalProducts"),
      value: dashboardData.totalProducts,
      icon: Package,
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100",
      description: t("dashboard.allProducts"),
    },
    {
      title: t("dashboard.nearExpiry"),
      value: dashboardData.nearExpiryDate,
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      iconBgColor: "bg-yellow-100",
      description: t("dashboard.expiringWithin7Days"),
    },
    {
      title: t("dashboard.pastExpiry"),
      value: dashboardData.passExpiryDate,
      icon: XCircle,
      iconColor: "text-red-600",
      iconBgColor: "bg-red-100",
      description: t("dashboard.pastExpiration"),
    },
    {
      title: t("dashboard.emptyStock"),
      value: dashboardData.emptyStock,
      icon: Box,
      iconColor: "text-gray-600",
      iconBgColor: "bg-gray-100",
      description: t("dashboard.zeroStock"),
    },
  ];

  // Calculate most sold SKUs
  const topSellingSKUs = useMemo(() => {
    const skuSales: Record<
      string,
      { sku: string; name: string; quantity: number; revenue: number }
    > = {};

    // Aggregate sales by SKU
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!skuSales[item.sku]) {
          skuSales[item.sku] = {
            sku: item.sku,
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        skuSales[item.sku].quantity += item.quantity;
        skuSales[item.sku].revenue += item.price * item.quantity;
      });
    });

    // Convert to array and sort by quantity sold
    return Object.values(skuSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10
  }, [orders]);

  // Get recent orders for display
  const recentOrders = orders.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6"
      >
        {t("dashboard.title")}
      </motion.h1>
      
      {/* Revenue Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("dashboard.revenueOverview")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.slice(0, 4).map((stat, index) => (
            <DashboardStatsCard key={index} {...stat} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Other Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("dashboard.inventoryOverview")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.slice(4).map((stat, index) => (
            <DashboardStatsCard key={index + 4} {...stat} index={index + 4} />
          ))}
        </div>
      </motion.div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("dashboard.recentOrders")}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.orderNumber")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.customer")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.items")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.total")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.date")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order, index) => {
                  const orderDate = new Date(order.createdAt);
                  const formattedDate = orderDate.toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "#f9fafb" }}
                      className="transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {order.customerName || "Walk-in Customer"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        Rp {order.total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formattedDate}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Most Sales SKU Section */}
      {topSellingSKUs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">{t("dashboard.mostSalesSku")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.rank")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.sku")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.productName")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.quantitySold")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("dashboard.revenue")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topSellingSKUs.map((item, index) => (
                  <motion.tr
                    key={item.sku}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && (
                          <span className="text-yellow-500 mr-2">🥇</span>
                        )}
                        {index === 1 && (
                          <span className="text-gray-400 mr-2">🥈</span>
                        )}
                        {index === 2 && (
                          <span className="text-orange-400 mr-2">🥉</span>
                        )}
                        {index > 2 && (
                          <span className="text-gray-400 mr-2 font-semibold">
                            #{index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                      Rp {item.revenue.toLocaleString("id-ID")}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Near Expiry */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("dashboard.productsNearExpiry")}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-900">Es Teh Manis</p>
                <p className="text-sm text-gray-500">SKU: ETM-001 • Expires in 3 days</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                Warning
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-900">Es Jeruk</p>
                <p className="text-sm text-gray-500">SKU: EJ-001 • Expires in 5 days</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                Warning
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-900">Sate Ayam</p>
                <p className="text-sm text-gray-500">SKU: SG-001 • Expires in 6 days</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                Warning
              </span>
            </div>
          </div>
        </div>

        {/* Products Pass Expiry */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("dashboard.productsPassExpiry")}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-gray-900">Nasi Goreng</p>
                <p className="text-sm text-gray-500">SKU: NG-002 • Expired 2 days ago</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                Expired
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-gray-900">Es Teh Manis</p>
                <p className="text-sm text-gray-500">SKU: ETM-002 • Expired 5 days ago</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                Expired
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-gray-900">Mie Ayam</p>
                <p className="text-sm text-gray-500">SKU: MA-002 • Expired 1 day ago</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                Expired
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty Stock Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("dashboard.emptyStockProducts")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">Nasi Goreng</p>
            <p className="text-sm text-gray-500 mt-1">SKU: NG-002 • Quantity: 0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">Es Campur</p>
            <p className="text-sm text-gray-500 mt-1">SKU: EC-001 • Quantity: 0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">Kerupuk</p>
            <p className="text-sm text-gray-500 mt-1">SKU: KR-001 • Quantity: 0</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
