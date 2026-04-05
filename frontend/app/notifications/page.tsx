"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  Loader2,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Eye,
  Shield,
} from "lucide-react";
import { notificationsAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getMyNotifications(50);
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to load notifications");
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await notificationsAPI.markAsRead(notification.id);
      setNotifications(notifications.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const deleteNotification = async (id: number) => {
    setDeleting(id);
    try {
      await notificationsAPI.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    } finally {
      setDeleting(null);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await Promise.all(notifications.map(n => notificationsAPI.delete(n.id)));
      setNotifications([]);
      toast.success("All notifications deleted");
    } catch (error) {
      toast.error("Failed to delete notifications");
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "success":
        return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", gradient: "from-emerald-500 to-green-600" };
      case "warning":
        return { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", gradient: "from-amber-500 to-orange-600" };
      case "error":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", gradient: "from-red-500 to-rose-600" };
      default:
        return { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", gradient: "from-blue-500 to-indigo-600" };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-500">{unreadCount} unread</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={markAllAsRead}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={deleteAllNotifications}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear all</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500 text-center max-w-sm mb-6">
              You have no notifications right now. Check back later for updates.
            </p>
            <Link href="/patient/doctors">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                <Calendar className="w-4 h-4" />
                Book an Appointment
              </motion.div>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const config = getTypeConfig(notification.type);
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, x: -100, height: 0 }}
                    className={`relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                      !notification.is_read
                        ? "border-blue-200 shadow-md"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                    )}

                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center`}
                        >
                          <IconComponent className={`w-6 h-6 ${config.color}`} />
                        </motion.div>

                        {/* Content */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className={`text-base ${!notification.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              disabled={deleting === notification.id}
                              className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50"
                            >
                              {deleting === notification.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400 font-medium">
                              {formatTime(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                New
                              </span>
                            )}
                            {notification.type === "success" && (
                              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completed
                              </span>
                            )}
                            {notification.type === "warning" && (
                              <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Warning
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
