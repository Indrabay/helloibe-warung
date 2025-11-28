"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, MapPin, Phone, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { isSuperAdmin } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

interface StoreData {
  name: string;
  address: string;
  phone: string;
}

export default function EditStorePage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<StoreData>({
    name: "",
    address: "",
    phone: "",
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((!isLoading || showContent) && user !== undefined) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!user.role || !isSuperAdmin(user.role)) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router, showContent]);

  useEffect(() => {
    if (user && isSuperAdmin(user.role) && storeId) {
      fetchStore();
    }
  }, [user, storeId]);

  const fetchStore = async () => {
    try {
      setIsLoadingStore(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
        });
      } else {
        setError("Failed to load store");
      }
    } catch (error) {
      console.error("Error fetching store:", error);
      setError("An error occurred while loading the store");
    } finally {
      setIsLoadingStore(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(`Store "${formData.name}" updated successfully!`);
        router.push("/dashboard/stores");
      } else {
        setError(data.error || data.message || "Failed to update store");
      }
    } catch (error) {
      console.error("Error updating store:", error);
      setError("An error occurred while updating the store. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !showContent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !user.role || !isSuperAdmin(user.role)) {
    return null;
  }

  if (isLoadingStore) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
        {t("stores.editStore")}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Store Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter store name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter street address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <motion.button
              type="button"
              onClick={() => router.back()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Building className="h-4 w-4" />
                  Update Store
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

