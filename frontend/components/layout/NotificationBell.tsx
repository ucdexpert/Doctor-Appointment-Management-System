"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Loader2, CheckCheck, Trash2, X, Eye, Calendar, AlertCircle, Info } from "lucide-react";
import { notificationsAPI } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getMyNotifications(20);
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to load notifications");
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Failed to load unread count");
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await notificationsAPI.markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    setNotifications(notifications.map(n =>
      n.id === notification.id ? { ...n, is_read: true } : n
    ));

    if (notification.link) {
      router.push(notification.link);
    }

    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const getTypeConfig = (type: string) => {
    switch(type) {
      case 'success':
        return { icon: CheckCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'warning':
        return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'error':
        return { icon: X, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
      default:
        return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPreviewText = (message: string) => {
    if (message.length > 80) {
      return message.substring(0, 80) + '...';
    }
    return message;
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: isOpen ? Infinity : 0, repeatDelay: 2 }}
        >
          <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
        </motion.div>
        
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - mobile only */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-x-0 top-0 z-[70] sm:absolute sm:inset-x-auto sm:top-3 sm:right-0 sm:z-50 w-full sm:w-[420px] bg-white rounded-b-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-gray-200/80 max-h-[85vh] sm:max-h-[600px] overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Close button - mobile only */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="sm:hidden p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      aria-label="Close notifications"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white text-base">Notifications</h3>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </>
                      )}
                    </button>
                  )}
                </div>
                {/* Unread count badge */}
                {unreadCount > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-white/80">
                      {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[calc(85vh-100px)] sm:max-h-[500px]">
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 px-4"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                      <Bell className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">All caught up!</p>
                    <p className="text-xs text-gray-400 text-center">No notifications yet</p>
                  </motion.div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {notifications.map((notification, index) => {
                        const config = getTypeConfig(notification.type);
                        const IconComponent = config.icon;
                        
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 relative ${
                              !notification.is_read ? 'bg-gradient-to-r from-blue-50/50 to-transparent' : ''
                            }`}
                          >
                            {/* Unread indicator */}
                            {!notification.is_read && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                            )}

                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center`}>
                                <IconComponent className={`w-5 h-5 ${config.color}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  <button
                                    onClick={(e) => deleteNotification(notification.id, e)}
                                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    style={{ opacity: 0.6 }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {getPreviewText(notification.message)}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    {formatTime(notification.created_at)}
                                  </span>
                                  {!notification.is_read && (
                                    <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5">
                                      <Eye className="w-3 h-3" />
                                      New
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="sticky bottom-0 border-t border-gray-100 bg-gray-50 p-3 text-center">
                  <button
                    onClick={() => router.push('/notifications')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View all notifications →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
