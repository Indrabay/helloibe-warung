"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Settings, Warehouse, Menu, ShoppingCart, Receipt, Store, UserPlus, Shield, FolderTree, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin, getRoleName } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

const menuItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", labelKey: "nav.products", icon: Package },
  { href: "/dashboard/inventory", labelKey: "nav.inventory", icon: Warehouse },
  { href: "/dashboard/cashier", labelKey: "nav.cashier", icon: ShoppingCart },
  { href: "/dashboard/orders", labelKey: "nav.orders", icon: Receipt },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
];

const superAdminMenuItems = [
  { href: "/dashboard/stores", labelKey: "nav.stores", icon: Store },
  { href: "/dashboard/users", labelKey: "nav.users", icon: UserPlus },
  { href: "/dashboard/roles", labelKey: "nav.roles", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true); // Start as open (for desktop)
  const [isDesktop, setIsDesktop] = useState(true); // Assume desktop initially
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const userIsSuperAdmin = isSuperAdmin(user?.role);

  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsOpen(true); // Always open on desktop
      } else {
        setIsOpen(false); // Closed by default on mobile
      }
    };

    // Check on mount
    if (typeof window !== "undefined") {
      checkDesktop();
      window.addEventListener("resize", checkDesktop);
      return () => window.removeEventListener("resize", checkDesktop);
    }
  }, []);

  // Load expanded state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("expanded_menus");
      if (savedState) {
        try {
          setExpandedMenus(JSON.parse(savedState));
        } catch (error) {
          console.error("Error loading expanded menus:", error);
        }
      }
    }
  }, []);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => {
      const newState = { ...prev, [menuKey]: !prev[menuKey] };
      if (typeof window !== "undefined") {
        localStorage.setItem("expanded_menus", JSON.stringify(newState));
      }
      return newState;
    });
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={
          isDesktop
            ? {}
            : {
                x: isOpen ? 0 : "-100%",
              }
        }
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white",
          isDesktop && "translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between h-16 px-6 border-b border-gray-800"
          >
            <h1 className="text-xl font-bold">{user?.store?.name || "helloibe.me warung"}</h1>
            <button
              className="lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </motion.div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              // Special handling for dashboard - exact match only
              const isActive = item.href === "/dashboard" 
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
              
              // Check if this is Products menu and has submenu
              const isProductsMenu = item.href === "/dashboard/products";
              const hasSubmenu = isProductsMenu;
              const menuKey = item.href;
              const isExpanded = expandedMenus[menuKey] ?? (isProductsMenu && isActive); // Default to expanded if active
              
              return (
                <div key={item.href}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    {hasSubmenu ? (
                      <div
                        className={cn(
                          "flex items-center px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer",
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                        onClick={() => toggleMenu(menuKey)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                        </motion.div>
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                        </motion.div>
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    )}
                  </motion.div>
                  
                  {/* Submenu for Products */}
                  <AnimatePresence>
                    {hasSubmenu && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 mt-1 space-y-1"
                      >
                        <Link
                          href="/dashboard/products"
                          className={cn(
                            "flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm",
                            pathname === "/dashboard/products"
                              ? "bg-blue-500 text-white"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          <span>{t("nav.products")}</span>
                        </Link>
                        <Link
                          href="/dashboard/products/categories"
                          className={cn(
                            "flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm",
                            pathname === "/dashboard/products/categories"
                              ? "bg-blue-500 text-white"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <FolderTree className="mr-2 h-4 w-4" />
                          <span>{t("nav.categories")}</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            
            {/* Super Admin Menu Items */}
            {userIsSuperAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Super Admin
                  </div>
                </div>
                {superAdminMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (menuItems.length + index) * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-purple-600 text-white shadow-lg"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                        </motion.div>
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </>
            )}
          </nav>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 border-t border-gray-800"
          >
            <div className="flex items-center px-4 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.name || "Admin User"}</p>
                <p className="text-xs text-gray-400">{user?.email || "admin@example.com"}</p>
                {user?.role && getRoleName(user.role) && (
                  <p className="text-xs text-purple-400 mt-1 capitalize">{getRoleName(user.role)?.replace("_", " ")}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}

