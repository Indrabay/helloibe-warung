export interface Category {
  id: string;
  name: string;
  category_code: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchCategories(): Promise<Category[]> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (response.ok) {
      const result = await response.json();
      // Handle response format: {data, limit, offset, total} or array
      if (result.data && Array.isArray(result.data)) {
        return result.data;
      } else if (Array.isArray(result)) {
        return result;
      } else {
        return result.categories || [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(category: Omit<Category, "id" | "created_at" | "updated_at">): Promise<Category | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(category),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Error creating category:", error);
    return null;
  }
}

export async function updateCategory(id: string, updates: Partial<Omit<Category, "id" | "created_at">>): Promise<Category | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Error updating category:", error);
    return null;
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
}

// Legacy functions for backward compatibility (deprecated, use API functions instead)
export function getCategories(): Category[] {
  console.warn("getCategories() is deprecated. Use fetchCategories() instead.");
  return [];
}

export function saveCategories(_categories: Category[]): void {
  console.warn("saveCategories() is deprecated. Use API functions instead.");
}

export function addCategory(category: Omit<Category, "id" | "created_at" | "updated_at">): Category {
  console.warn("addCategory() is deprecated. Use createCategory() instead.");
  return {
    ...category,
    id: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getCategoryById(_id: string): Category | null {
  console.warn("getCategoryById() is deprecated. Use fetchCategories() and filter instead.");
  return null;
}

