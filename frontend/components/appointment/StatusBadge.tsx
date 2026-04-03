"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "confirmed" | "cancelled" | "completed";
  className?: string;
}

const statusConfig: Record<
  string,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof Clock;
    label: string;
  }
> = {
  pending: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
    icon: Clock,
    label: "Pending",
  },
  confirmed: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    icon: CheckCircle,
    label: "Confirmed",
  },
  cancelled: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    icon: XCircle,
    label: "Cancelled",
  },
  completed: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    icon: Calendar,
    label: "Completed",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1 w-fit",
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
