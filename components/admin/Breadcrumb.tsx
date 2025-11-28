"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: t("nav.dashboard"), href: "/dashboard" },
    ];

    if (paths.length === 1 && paths[0] === "dashboard") {
      return breadcrumbs;
    }

    // Remove "dashboard" from paths
    const routePaths = paths.slice(1);

    let currentPath = "/dashboard";
    routePaths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Get label for this path
      let label = path;
      
      // Map paths to translation keys
      const pathMap: Record<string, string> = {
        products: t("nav.products"),
        categories: t("nav.categories"),
        inventory: t("nav.inventory"),
        cashier: t("nav.cashier"),
        orders: t("nav.orders"),
        settings: t("nav.settings"),
        stores: t("nav.stores"),
        users: t("nav.users"),
        roles: t("nav.roles"),
        create: t("common.create"),
        edit: t("common.edit"),
      };

      // Check if it's a UUID (for edit pages)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path);
      
      if (isUUID) {
        // If previous path is "stores", "users", or "roles", it's an edit page
        const prevPath = routePaths[index - 1];
        if (prevPath === "stores" || prevPath === "users" || prevPath === "roles") {
          label = t("common.edit");
        } else {
          label = path.substring(0, 8) + "...";
        }
      } else if (pathMap[path]) {
        label = pathMap[path];
      } else {
        // Capitalize first letter
        label = path.charAt(0).toUpperCase() + path.slice(1);
      }

      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.slice(1).map((crumb, index) => (
        <div key={crumb.href} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {index === breadcrumbs.length - 2 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-gray-900 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

