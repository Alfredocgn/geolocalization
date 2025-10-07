import React from "react";

interface GeocodingStatusBadgeProps {
  status: "pending" | "success" | "ambiguous" | "failed";
}

export const GeocodingStatusBadge: React.FC<GeocodingStatusBadgeProps> = ({
  status,
}) => {
  const statusConfig = {
    pending: {
      text: "Pending",
      className: "bg-gray-100 text-gray-800",
      icon: "⏳",
    },
    success: {
      text: "Success",
      className: "bg-green-100 text-green-800",
      icon: "✅",
    },
    ambiguous: {
      text: "Ambiguous",
      className: "bg-yellow-100 text-yellow-800",
      icon: "⚠️",
    },
    failed: {
      text: "Failed",
      className: "bg-red-100 text-red-800",
      icon: "❌",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </span>
  );
};
