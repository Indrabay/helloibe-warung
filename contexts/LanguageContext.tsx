"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isSuperAdmin } from "@/lib/roles";
import type { User } from "@/lib/auth";

type Language = "en" | "in";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.clear": "Clear",
    "common.close": "Close",
    "common.loading": "Loading...",
    "common.submit": "Submit",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.view": "View",
    "common.details": "Details",
    "common.actions": "Actions",
    "common.signOut": "Sign out",
    "common.saveChanges": "Save Changes",
    "common.saving": "Saving...",
    "common.createdAt": "Created At",
    "common.updatedAt": "Updated At",
    "common.createdBy": "Created By",
    "common.updatedBy": "Updated By",
    "common.metadata": "Metadata",
    
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.products": "Products",
    "nav.categories": "Categories",
    "nav.inventory": "Inventory",
    "nav.cashier": "Cashier",
    "nav.orders": "Orders",
    "nav.settings": "Settings",
    "nav.stores": "Stores",
    "nav.users": "Users",
    "nav.roles": "Roles",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.revenue": "Revenue",
    "dashboard.totalRevenue": "Total Revenue",
    "dashboard.todayRevenue": "Today's Revenue",
    "dashboard.thisWeek": "This Week",
    "dashboard.thisMonth": "This Month",
    "dashboard.revenueOverview": "Revenue Overview",
    "dashboard.inventoryOverview": "Inventory Overview",
    "dashboard.totalProducts": "Total Products",
    "dashboard.nearExpiry": "Near Expiry Date",
    "dashboard.pastExpiry": "Pass Expiry Date",
    "dashboard.emptyStock": "Empty Stock",
    "dashboard.recentOrders": "Recent Orders",
    "dashboard.mostSalesSku": "Most Sales SKU",
    "dashboard.productsNearExpiry": "Products Near Expiry Date",
    "dashboard.productsPassExpiry": "Products Pass Expiry Date",
    "dashboard.emptyStockProducts": "Empty Stock Products",
    "dashboard.orderNumber": "Order Number",
    "dashboard.customer": "Customer",
    "dashboard.items": "Items",
    "dashboard.total": "Total",
    "dashboard.date": "Date",
    "dashboard.rank": "Rank",
    "dashboard.sku": "SKU",
    "dashboard.productName": "Product Name",
    "dashboard.quantitySold": "Quantity Sold",
    "dashboard.orders": "orders",
    "dashboard.revenueFromToday": "Revenue from today",
    "dashboard.revenueThisWeek": "Revenue this week",
    "dashboard.revenueThisMonth": "Revenue this month",
    "dashboard.allProducts": "All products in inventory",
    "dashboard.expiringWithin7Days": "Products expiring within 7 days",
    "dashboard.pastExpiration": "Products past expiration date",
    "dashboard.zeroStock": "Products with zero stock",
    
    // Products
    "products.title": "Products",
    "products.addProduct": "Add Product",
    "products.searchPlaceholder": "Search products by name, category, or SKU...",
    "products.scanQR": "Scan QR Code",
    "products.name": "Name",
    "products.productName": "Product Name",
    "products.detail": "Product Detail",
    "products.category": "Category",
    "products.sku": "SKU",
    "products.sellingPrice": "Selling Price",
    "products.purchasePrice": "Purchase Price",
    "products.noProducts": "No products found",
    
    // Categories
    "categories.title": "Categories",
    "categories.addCategory": "Add Category",
    "categories.editCategory": "Edit Category",
    "categories.name": "Name",
    "categories.description": "Description",
    "categories.searchPlaceholder": "Search categories by name or description...",
    "categories.noCategories": "No categories found",
    "categories.download": "Download All",
    "categories.nameRequired": "Category name is required",
    "categories.duplicateName": "A category with this name already exists",
    "categories.confirmDelete": "Are you sure you want to delete this category?",
    
    // Inventory
    "inventory.title": "Inventory",
    "inventory.addStock": "Add Stock",
    "inventory.searchPlaceholder": "Search inventory by SKU, name, or location...",
    "inventory.sku": "SKU",
    "inventory.name": "Product Name",
    "inventory.quantity": "Quantity",
    "inventory.expiryDate": "Expiry Date",
    "inventory.location": "Location",
    "inventory.status": "Status",
    "inventory.valid": "Valid",
    "inventory.nearExpiry": "Near Expiry",
    "inventory.expired": "Expired",
    "inventory.noInventory": "No inventory found",
    
    // Cashier
    "cashier.title": "Cashier",
    "cashier.productSelection": "Product Selection",
    "cashier.searchPlaceholder": "Search products...",
    "cashier.cart": "Cart",
    "cashier.total": "Total",
    "cashier.checkout": "Checkout",
    "cashier.emptyCart": "Your cart is empty",
    "cashier.addToCart": "Add to Cart",
    
    // Orders
    "orders.title": "Orders",
    "orders.searchPlaceholder": "Search orders by order number, customer name, or product...",
    "orders.orderNumber": "Order Number",
    "orders.customer": "Customer",
    "orders.items": "Items",
    "orders.total": "Total",
    "orders.status": "Status",
    "orders.date": "Date",
    "orders.noOrders": "No orders found",
    
    // Settings
    "settings.title": "Settings",
    "settings.editProfile": "Edit Your Profile",
    "settings.fullName": "Full Name",
    "settings.username": "Username",
    "settings.email": "Email",
    "settings.newPassword": "New Password",
    "settings.confirmPassword": "Confirm New Password",
    "settings.passwordHint": "Leave blank if you don't want to change your password. Minimum 6 characters.",
    "settings.storeInformation": "Store Information",
    "settings.storeName": "Store Name",
    "settings.storeAddress": "Store Address",
    "settings.notAvailable": "Settings are not available for super admin users. Please use the Users page to manage user accounts.",
    
    // Stores
    "stores.title": "Stores",
    "stores.createStore": "Create Store",
    "stores.editStore": "Edit Store",
    "stores.searchPlaceholder": "Search stores by name, address, or phone...",
    "stores.name": "Name",
    "stores.address": "Address",
    "stores.phone": "Phone",
    "stores.noStores": "No stores found",
    "stores.details": "Store Details",
    
    // Users
    "users.title": "Users",
    "users.createUser": "Create User",
    "users.searchPlaceholder": "Search users by name, email, username, or role...",
    "users.name": "Name",
    "users.username": "Username",
    "users.email": "Email",
    "users.role": "Role",
    "users.noUsers": "No users found",
    "users.details": "User Details",
    "users.fullName": "Full Name",
    
    // Roles
    "roles.title": "Roles",
    "roles.createRole": "Create Role",
    "roles.searchPlaceholder": "Search roles by name or description...",
    "roles.name": "Name",
    "roles.level": "Level",
    "roles.description": "Description",
    "roles.noRoles": "No roles found",
    "roles.details": "Role Details",
    "roles.roleName": "Role Name",
    
    // Pagination
    "pagination.showing": "Showing",
    "pagination.to": "to",
    "pagination.of": "of",
    "pagination.results": "results",
    "pagination.page": "Page",
    
    // Form labels
    "form.required": "Required",
    "form.optional": "Optional",
  },
  in: {
    // Common
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Hapus",
    "common.edit": "Edit",
    "common.create": "Buat",
    "common.search": "Cari",
    "common.clear": "Bersihkan",
    "common.close": "Tutup",
    "common.loading": "Memuat...",
    "common.submit": "Kirim",
    "common.back": "Kembali",
    "common.next": "Berikutnya",
    "common.previous": "Sebelumnya",
    "common.view": "Lihat",
    "common.details": "Detail",
    "common.actions": "Aksi",
    "common.signOut": "Keluar",
    "common.saveChanges": "Simpan Perubahan",
    "common.saving": "Menyimpan...",
    "common.createdAt": "Dibuat Pada",
    "common.updatedAt": "Diperbarui Pada",
    "common.createdBy": "Dibuat Oleh",
    "common.updatedBy": "Diperbarui Oleh",
    "common.metadata": "Metadata",
    
    // Navigation
    "nav.dashboard": "Dasbor",
    "nav.products": "Produk",
    "nav.categories": "Kategori",
    "nav.inventory": "Inventori",
    "nav.cashier": "Kasir",
    "nav.orders": "Pesanan",
    "nav.settings": "Pengaturan",
    "nav.stores": "Toko",
    "nav.users": "Pengguna",
    "nav.roles": "Peran",
    
    // Dashboard
    "dashboard.title": "Dasbor",
    "dashboard.revenue": "Pendapatan",
    "dashboard.totalRevenue": "Total Pendapatan",
    "dashboard.todayRevenue": "Pendapatan Hari Ini",
    "dashboard.thisWeek": "Minggu Ini",
    "dashboard.thisMonth": "Bulan Ini",
    "dashboard.revenueOverview": "Ringkasan Pendapatan",
    "dashboard.inventoryOverview": "Ringkasan Inventori",
    "dashboard.totalProducts": "Total Produk",
    "dashboard.nearExpiry": "Mendekati Kedaluwarsa",
    "dashboard.pastExpiry": "Lewat Kedaluwarsa",
    "dashboard.emptyStock": "Stok Kosong",
    "dashboard.recentOrders": "Pesanan Terbaru",
    "dashboard.mostSalesSku": "SKU Terlaris",
    "dashboard.productsNearExpiry": "Produk Mendekati Kedaluwarsa",
    "dashboard.productsPassExpiry": "Produk Lewat Kedaluwarsa",
    "dashboard.emptyStockProducts": "Produk Stok Kosong",
    "dashboard.orderNumber": "Nomor Pesanan",
    "dashboard.customer": "Pelanggan",
    "dashboard.items": "Item",
    "dashboard.total": "Total",
    "dashboard.date": "Tanggal",
    "dashboard.rank": "Peringkat",
    "dashboard.sku": "SKU",
    "dashboard.productName": "Nama Produk",
    "dashboard.quantitySold": "Jumlah Terjual",
    "dashboard.orders": "pesanan",
    "dashboard.revenueFromToday": "Pendapatan dari hari ini",
    "dashboard.revenueThisWeek": "Pendapatan minggu ini",
    "dashboard.revenueThisMonth": "Pendapatan bulan ini",
    "dashboard.allProducts": "Semua produk dalam inventori",
    "dashboard.expiringWithin7Days": "Produk yang akan kedaluwarsa dalam 7 hari",
    "dashboard.pastExpiration": "Produk yang sudah lewat tanggal kedaluwarsa",
    "dashboard.zeroStock": "Produk dengan stok nol",
    
    // Products
    "products.title": "Produk",
    "products.addProduct": "Tambah Produk",
    "products.searchPlaceholder": "Cari produk berdasarkan nama, kategori, atau SKU...",
    "products.scanQR": "Pindai QR Code",
    "products.name": "Nama",
    "products.productName": "Nama Produk",
    "products.detail": "Detail Produk",
    "products.category": "Kategori",
    "products.sku": "SKU",
    "products.sellingPrice": "Harga Jual",
    "products.purchasePrice": "Harga Beli",
    "products.noProducts": "Tidak ada produk ditemukan",
    
    // Categories
    "categories.title": "Kategori",
    "categories.addCategory": "Tambah Kategori",
    "categories.editCategory": "Edit Kategori",
    "categories.name": "Nama",
    "categories.description": "Deskripsi",
    "categories.searchPlaceholder": "Cari kategori berdasarkan nama atau deskripsi...",
    "categories.noCategories": "Tidak ada kategori ditemukan",
    "categories.download": "Unduh Semua",
    "categories.nameRequired": "Nama kategori wajib diisi",
    "categories.duplicateName": "Kategori dengan nama ini sudah ada",
    "categories.confirmDelete": "Apakah Anda yakin ingin menghapus kategori ini?",
    
    // Inventory
    "inventory.title": "Inventori",
    "inventory.addStock": "Tambah Stok",
    "inventory.searchPlaceholder": "Cari inventori berdasarkan SKU, nama, atau lokasi...",
    "inventory.sku": "SKU",
    "inventory.name": "Nama Produk",
    "inventory.quantity": "Jumlah",
    "inventory.expiryDate": "Tanggal Kedaluwarsa",
    "inventory.location": "Lokasi",
    "inventory.status": "Status",
    "inventory.valid": "Valid",
    "inventory.nearExpiry": "Mendekati Kedaluwarsa",
    "inventory.expired": "Kedaluwarsa",
    "inventory.noInventory": "Tidak ada inventori ditemukan",
    
    // Cashier
    "cashier.title": "Kasir",
    "cashier.productSelection": "Pemilihan Produk",
    "cashier.searchPlaceholder": "Cari produk...",
    "cashier.cart": "Keranjang",
    "cashier.total": "Total",
    "cashier.checkout": "Checkout",
    "cashier.emptyCart": "Keranjang Anda kosong",
    "cashier.addToCart": "Tambah ke Keranjang",
    
    // Orders
    "orders.title": "Pesanan",
    "orders.searchPlaceholder": "Cari pesanan berdasarkan nomor pesanan, nama pelanggan, atau produk...",
    "orders.orderNumber": "Nomor Pesanan",
    "orders.customer": "Pelanggan",
    "orders.items": "Item",
    "orders.total": "Total",
    "orders.status": "Status",
    "orders.date": "Tanggal",
    "orders.noOrders": "Tidak ada pesanan ditemukan",
    
    // Settings
    "settings.title": "Pengaturan",
    "settings.editProfile": "Edit Profil Anda",
    "settings.fullName": "Nama Lengkap",
    "settings.username": "Nama Pengguna",
    "settings.email": "Email",
    "settings.newPassword": "Kata Sandi Baru",
    "settings.confirmPassword": "Konfirmasi Kata Sandi Baru",
    "settings.passwordHint": "Kosongkan jika Anda tidak ingin mengubah kata sandi. Minimal 6 karakter.",
    "settings.storeInformation": "Informasi Toko",
    "settings.storeName": "Nama Toko",
    "settings.storeAddress": "Alamat Toko",
    "settings.notAvailable": "Pengaturan tidak tersedia untuk pengguna super admin. Silakan gunakan halaman Pengguna untuk mengelola akun pengguna.",
    
    // Stores
    "stores.title": "Toko",
    "stores.createStore": "Buat Toko",
    "stores.editStore": "Edit Toko",
    "stores.searchPlaceholder": "Cari toko berdasarkan nama, alamat, atau telepon...",
    "stores.name": "Nama",
    "stores.address": "Alamat",
    "stores.phone": "Telepon",
    "stores.noStores": "Tidak ada toko ditemukan",
    "stores.details": "Detail Toko",
    
    // Users
    "users.title": "Pengguna",
    "users.createUser": "Buat Pengguna",
    "users.searchPlaceholder": "Cari pengguna berdasarkan nama, email, nama pengguna, atau peran...",
    "users.name": "Nama",
    "users.username": "Nama Pengguna",
    "users.email": "Email",
    "users.role": "Peran",
    "users.noUsers": "Tidak ada pengguna ditemukan",
    "users.details": "Detail Pengguna",
    "users.fullName": "Nama Lengkap",
    
    // Roles
    "roles.title": "Peran",
    "roles.createRole": "Buat Peran",
    "roles.searchPlaceholder": "Cari peran berdasarkan nama atau deskripsi...",
    "roles.name": "Nama",
    "roles.level": "Level",
    "roles.description": "Deskripsi",
    "roles.noRoles": "Tidak ada peran ditemukan",
    "roles.details": "Detail Peran",
    "roles.roleName": "Nama Peran",
    
    // Pagination
    "pagination.showing": "Menampilkan",
    "pagination.to": "hingga",
    "pagination.of": "dari",
    "pagination.results": "hasil",
    "pagination.page": "Halaman",
    
    // Form labels
    "form.required": "Wajib",
    "form.optional": "Opsional",
  },
};

// Helper function to get default language based on user role
const getDefaultLanguage = (): Language => {
  if (typeof window === "undefined") return "en";
  
  try {
    // Check if user has manually set a language preference
    const savedLang = localStorage.getItem("app_language") as Language;
    if (savedLang === "in" || savedLang === "en") {
      return savedLang;
    }
    
    // If no manual preference, check user role from localStorage
    const authSession = localStorage.getItem("auth_session");
    if (authSession) {
      try {
        const session = JSON.parse(authSession);
        const user: User | undefined = session?.user;
        
        if (user && user.role) {
          // Super admin defaults to English
          if (isSuperAdmin(user.role)) {
            return "en";
          }
          // Other users default to Bahasa Indonesia
          return "in";
        }
      } catch (error) {
        console.error("Error parsing auth session:", error);
      }
    }
    
    // Default fallback (for non-authenticated users)
    return "in";
  } catch (error) {
    console.error("Error getting default language:", error);
    return "in";
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load language from localStorage on mount
  useEffect(() => {
    const defaultLang = getDefaultLanguage();
    setLanguageState(defaultLang);
    
    // If no manual preference was set, save the role-based default
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("app_language");
      if (!savedLang) {
        localStorage.setItem("app_language", defaultLang);
      }
    }
  }, []);

  // Update language when auth session changes (user logs in/out)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      // If auth_session changes, re-check default language
      if (e.key === "auth_session" || e.key === null) {
        const savedLang = localStorage.getItem("app_language");
        // Only update if user hasn't manually set a preference
        if (!savedLang) {
          const defaultLang = getDefaultLanguage();
          setLanguageState(defaultLang);
          localStorage.setItem("app_language", defaultLang);
        }
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for same-tab changes (since storage event doesn't fire in same tab)
    // Only check if no manual preference is set
    const interval = setInterval(() => {
      const savedLang = localStorage.getItem("app_language");
      if (!savedLang) {
        const defaultLang = getDefaultLanguage();
        setLanguageState((currentLang) => {
          if (currentLang !== defaultLang) {
            localStorage.setItem("app_language", defaultLang);
            return defaultLang;
          }
          return currentLang;
        });
      }
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_language", lang);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

