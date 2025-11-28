"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Shield, Store, AtSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

interface Role {
  id: string;
  name: string;
  level: number;
}

interface Store {
  id: string;
  name: string;
}

export default function CreateUserPage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    role_id: "",
    store_id: "",
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

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        
        const response = await fetch(`${API_BASE_URL}/api/roles?limit=100&offset=0`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setRoles(result.data);
          } else if (Array.isArray(result)) {
            setRoles(result);
          }
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    if (user && isSuperAdmin(user.role)) {
      fetchRoles();
    }
  }, [user, API_BASE_URL]);

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
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
    };

    if (user && isSuperAdmin(user.role)) {
      fetchStores();
    }
  }, [user, API_BASE_URL]);

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    // Validate required fields
    if (!formData.role_id || !formData.store_id) {
      setError("Please select both role and store!");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role_id: formData.role_id,
          store_id: formData.store_id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.alert(`User "${formData.name}" created successfully!`);
        
        // Reset form
        setFormData({
          username: "",
          email: "",
          name: "",
          password: "",
          confirmPassword: "",
          role_id: "",
          store_id: "",
        });
        
        // Redirect to users list
        router.push("/dashboard/users");
      } else {
        setError(data.error || data.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setError("An error occurred while creating the user. Please try again.");
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
        {t("users.createUser")}
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

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
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
              Email <span className="text-red-500">*</span>
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

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
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

          {/* Role */}
          <div>
            <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <select
                id="role_id"
                name="role_id"
                required
                value={formData.role_id}
                onChange={handleChange}
                disabled={isLoadingRoles}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{isLoadingRoles ? "Loading roles..." : "Select a role"}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} (Level {role.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Store */}
          <div>
            <label htmlFor="store_id" className="block text-sm font-medium text-gray-700 mb-2">
              Store <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <select
                id="store_id"
                name="store_id"
                required
                value={formData.store_id}
                onChange={handleChange}
                disabled={isLoadingStores}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{isLoadingStores ? "Loading stores..." : "Select a store"}</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password (min. 6 characters)"
                minLength={6}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
                minLength={6}
              />
            </div>
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
                  <UserPlus className="h-4 w-4" />
                  Create User
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

