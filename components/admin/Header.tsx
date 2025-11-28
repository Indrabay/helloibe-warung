"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleLanguageChange = (lang: "en" | "in") => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    if (isDropdownOpen || isLangDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isLangDropdownOpen]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-end h-16 px-4 sm:px-6 gap-3">
        {/* Language Switcher */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Change Language"
          >
            <Globe className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 uppercase">{language}</span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isLangDropdownOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {/* Language Dropdown Menu */}
          {isLangDropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                  language === "en"
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="uppercase">EN</span>
                <span className="ml-2">English</span>
              </button>
              <button
                onClick={() => handleLanguageChange("in")}
                className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                  language === "in"
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="uppercase">IN</span>
                <span className="ml-2">Indonesia</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isDropdownOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || "Administrator"}</p>
                {user?.store && (
                  <p className="text-xs text-gray-500 mt-1">{user.store.name}</p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                {t("common.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

