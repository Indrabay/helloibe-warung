export interface Role {
  id: string;
  level: number;
  name: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  store: Store;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface LoginError {
  error: string;
}

// Session storage (in a real app, use cookies or server-side session)
let currentSession: { user: User; token?: string } | null = null;

// Backend API base URL
// Set NEXT_PUBLIC_API_URL in .env.local to override (e.g., NEXT_PUBLIC_API_URL=http://localhost:3001)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const mockAuth = {
  /**
   * Authenticate user with email and password via API
   */
  async signIn(email: string, password: string): Promise<{ user: User } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernameOrEmail: email, password }),
      });

      const data: LoginResponse | LoginError = await response.json();

      if (response.ok && "token" in data && "user" in data) {
        const { user, token } = data as LoginResponse;
        currentSession = { user, token };
        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_session", JSON.stringify(currentSession));
          localStorage.setItem("auth_token", token);
        }
        return { user };
      }

      // Handle error response
      if ("error" in data) {
        console.error("Login error:", data.error);
      }

      return null;
    } catch (error) {
      console.error("Login request failed:", error);
      return null;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    currentSession = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_session");
      localStorage.removeItem("auth_token");
    }
  },

  /**
   * Get the current session
   */
  getSession(): { user: User; token?: string } | null {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth_session");
      if (stored) {
        try {
          currentSession = JSON.parse(stored);
        } catch {
          currentSession = null;
        }
      }
    }
    return currentSession;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },
};

