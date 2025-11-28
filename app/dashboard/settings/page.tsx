"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, AtSign, Lock, Save, Store, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStore, setIsLoadingStore] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    storeAddress: "",
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const isUserSuperAdmin = user?.role && isSuperAdmin(user.role);

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        password: "",
        confirmPassword: "",
        storeName: user.store?.name || "",
      }));
    }
  }, [user]);

  // Load store data if user has a store
  useEffect(() => {
    const fetchStore = async () => {
      if (user?.store?.id) {
        try {
          setIsLoadingStore(true);
          const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
          
          const response = await fetch(`${API_BASE_URL}/api/stores/${user.store.id}`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          if (response.ok) {
            const storeData = await response.json();
            setFormData((prev) => ({
              ...prev,
              storeName: storeData.name || user.store?.name || "",
              storeAddress: storeData.address || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching store:", error);
        } finally {
          setIsLoadingStore(false);
        }
      }
    };

    if (user && !isUserSuperAdmin) {
      fetchStore();
    }
  }, [user, isUserSuperAdmin, API_BASE_URL]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // If password is provided, validate it
    if (formData.password) {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long!");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match!");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      // Update user profile
      const updateUserPayload: {
        name?: string;
        email?: string;
        username?: string;
        password?: string;
      } = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
      };

      // Only include password if it's provided
      if (formData.password) {
        updateUserPayload.password = formData.password;
      }

      const userResponse = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(updateUserPayload),
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        setError(userData.error || userData.message || "Failed to update profile");
        setIsSubmitting(false);
        return;
      }

      // Update store if user has a store
      if (user?.store?.id) {
        const storeResponse = await fetch(`${API_BASE_URL}/api/stores/${user.store.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            name: formData.storeName,
            address: formData.storeAddress,
          }),
        });

        const storeData = await storeResponse.json();

        if (!storeResponse.ok) {
          setError(storeData.error || storeData.message || "Failed to update store");
          setIsSubmitting(false);
          return;
        }
      }

      setSuccess("Profile and store updated successfully!");
      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      
      // Refresh user session if needed
      setTimeout(() => {
        window.location.reload(); // Reload to get updated user data
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is super_admin, show a message that settings are not available
  if (isUserSuperAdmin) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("settings.title")}</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            {t("settings.notAvailable")}
          </p>
        </div>
      </div>
    );
  }

  // If user is not logged in, redirect will happen in layout
  if (!user) {
    return null;
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
        {t("settings.title")}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("settings.editProfile")}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.fullName")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.username")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="username"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.email")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.newPassword")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank to keep current password"
                minLength={6}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t("settings.passwordHint")}
            </p>
          </div>

          {/* Confirm Password */}
          {formData.password && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t("settings.confirmPassword")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required={!!formData.password}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Store Information Section */}
          {user?.store && (
            <>
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("settings.storeInformation")}</h3>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.storeName")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    required
                    value={formData.storeName}
                    onChange={handleChange}
                    disabled={isLoadingStore}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter store name"
                  />
                </div>
              </div>

              {/* Store Address */}
              <div>
                <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.storeAddress")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    id="storeAddress"
                    name="storeAddress"
                    required
                    rows={3}
                    value={formData.storeAddress}
                    onChange={(e) => setFormData((prev) => ({ ...prev, storeAddress: e.target.value }))}
                    disabled={isLoadingStore}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter store address"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("common.saveChanges")}
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
