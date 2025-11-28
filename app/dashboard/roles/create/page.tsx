"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Hash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CreateRolePage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    level: "",
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Timeout fallback
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if not super_admin
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

  if (isLoading && !showContent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user || !user.role || !isSuperAdmin(user.role)) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate level is a number
    const level = parseInt(formData.level, 10);
    if (isNaN(level) || level < 0) {
      setError("Level must be a valid number (0 or greater)!");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: formData.name,
          level: level,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(`Role "${formData.name}" created successfully!`);
        
        // Reset form
        setFormData({
          name: "",
          level: "",
        });
        
        // Redirect to roles list
        router.push("/dashboard/roles");
      } else {
        setError(data.error || data.message || "Failed to create role");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      setError("An error occurred while creating the role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {t("roles.createRole")}
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

          {/* Role Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter role name (e.g., Store Manager)"
              />
            </div>
          </div>

          {/* Level */}
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
              Level <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                id="level"
                name="level"
                required
                min="0"
                value={formData.level}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter level (e.g., 99 for super_admin)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Level determines the role hierarchy. Higher numbers have more privileges (e.g., 99 for super_admin).
            </p>
          </div>

          {/* Submit Button */}
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
                  Creating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Create Role
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

