"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Calendar, MessageSquare, Users, FileText } from "lucide-react";

interface EmptyStateProps {
  icon?: "search" | "calendar" | "message" | "users" | "file" | "custom";
  customIcon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const iconMap = {
  search: Search,
  calendar: Calendar,
  message: MessageSquare,
  users: Users,
  file: FileText,
};

export default function EmptyState({
  icon = "search",
  customIcon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const IconComponent = icon !== "custom" ? iconMap[icon] : null;

  return (
    <div
      className={cn(
        "text-center py-12 bg-white rounded-xl border border-gray-200",
        className
      )}
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {customIcon ? (
          customIcon
        ) : IconComponent ? (
          <IconComponent className="w-8 h-8 text-gray-400" />
        ) : null}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
