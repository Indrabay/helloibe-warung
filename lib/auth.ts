export interface User {
  id: string;
  email: string;
  name: string;
}

// Mock user database
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
  },
];

// Mock session storage (in a real app, use cookies or server-side session)
let currentSession: { user: User } | null = null;

export const mockAuth = {
  /**
   * Authenticate user with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User } | null> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock authentication logic
    if (email === "admin@example.com" && password === "admin123") {
      const user = mockUsers.find((u) => u.email === email);
      if (user) {
        currentSession = { user };
        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_session", JSON.stringify(currentSession));
        }
        return { user };
      }
    }

    return null;
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    currentSession = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_session");
    }
  },

  /**
   * Get the current session
   */
  getSession(): { user: User } | null {
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

