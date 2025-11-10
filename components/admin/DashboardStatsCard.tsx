"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  description?: string;
  index?: number;
}

export default function DashboardStatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100",
  description,
  index = 0,
}: DashboardStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-lg shadow p-6 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="text-3xl font-bold text-gray-900 mt-2"
          >
            {value}
          </motion.p>
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
          className={`p-3 ${iconBgColor} rounded-lg`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </motion.div>
      </div>
    </motion.div>
  );
}
