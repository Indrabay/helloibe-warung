"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, User as UserIcon, Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/roles";
import Pagination from "@/components/admin/Pagination";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserRef {
  id: string;
  name: string;
  email: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    level: number;
  };
  created_at?: string;
  created_by?: UserRef | null;
  updated_at?: string;
  updated_by?: UserRef | null;
}

export default function UsersPage() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const itemsPerPage = 10;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((!authLoading || showContent) && user !== undefined) {
      if (!user || !isSuperAdmin(user?.role)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router, showContent]);

  useEffect(() => {
    if (user && isSuperAdmin(user.role)) {
      fetchUsers(currentPage, searchQuery);
    }
  }, [user, currentPage, searchQuery]);

  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = async (page: number = 1, search: string = "") => {
    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const offset = (page - 1) * itemsPerPage;
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      if (search.trim()) {
        params.append("search", search.trim());
      }
      
      const response = await fetch(`${API_BASE_URL}/api/users?${params.toString()}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Handle new response format: {data, limit, offset, total}
        if (result.data && Array.isArray(result.data)) {
          setUsers(result.data);
          setTotalItems(result.total || 0);
        } else if (Array.isArray(result)) {
          // Fallback for old format
          setUsers(result);
          setTotalItems(result.length);
        } else {
          setUsers(result.users || []);
          setTotalItems(result.total || 0);
        }
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        window.alert("User deleted successfully!");
        // Refresh the list
        fetchUsers(currentPage, searchQuery);
      } else {
        const data = await response.json();
        window.alert(data.error || data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      window.alert("An error occurred while deleting the user");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedUsers = users;

  if (authLoading && !showContent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !isSuperAdmin(user?.role)) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("users.title")}</h1>
        <motion.button
          onClick={() => router.push("/dashboard/users/create")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t("users.createUser")}
        </motion.button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, username, or role..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            Search
          </motion.button>
        </form>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-3">
            Showing results for "{searchQuery}" - {totalItems} user{totalItems !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{u.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {u.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <motion.button
                            onClick={() => handleViewDetail(u)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-green-600 hover:text-green-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => router.push(`/dashboard/users/${u.id}/edit`)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(u.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{t("users.details")}</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-lg text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="mt-1 text-lg text-gray-900">{selectedUser.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-lg text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <div className="mt-1">
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {selectedUser.role.name}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">(Level {selectedUser.role.level})</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.created_at
                        ? new Date(selectedUser.created_at).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.created_by ? (
                        <span>
                          {selectedUser.created_by.name} ({selectedUser.created_by.email})
                        </span>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.updated_at
                        ? new Date(selectedUser.updated_at).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated By</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.updated_by ? (
                        <span>
                          {selectedUser.updated_by.name} ({selectedUser.updated_by.email})
                        </span>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <motion.button
                onClick={() => setIsDetailModalOpen(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  router.push(`/dashboard/users/${selectedUser.id}/edit`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit User
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

