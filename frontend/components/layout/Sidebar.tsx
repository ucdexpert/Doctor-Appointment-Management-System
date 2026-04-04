"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  MessageSquare,
  X,
  Stethoscope,
  Clock,
  UserCircle,
  LogOut,
  Sparkles,
  Heart,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: "patient" | "doctor" | "admin";
}

const navConfig = {
  patient: [
    { href: "/patient/dashboard", label: "Dashboard", icon: Home, badge: "" },
    { href: "/patient/doctors", label: "Find Doctors", icon: Stethoscope, badge: "" },
    { href: "/patient/appointments", label: "Appointments", icon: Calendar, badge: "" },
    { href: "/patient/favorites", label: "Favorites", icon: Heart, badge: "" },
    { href: "/patient/chatbot", label: "AI Assistant", icon: MessageSquare, badge: "AI" },
    { href: "/patient/profile", label: "Profile", icon: Settings, badge: "" },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: Home, badge: "" },
    { href: "/doctor/profile", label: "My Profile", icon: UserCircle, badge: "" },
    { href: "/doctor/schedule", label: "Schedule", icon: Clock, badge: "" },
    { href: "/doctor/appointments", label: "Appointments", icon: Calendar, badge: "" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home, badge: "" },
    { href: "/admin/doctors", label: "Doctors", icon: Stethoscope, badge: "" },
    { href: "/admin/users", label: "Users", icon: Users, badge: "" },
  ],
};

const sidebarVariants = {
  closed: { x: 0 },
  open: { x: 0 },
};

const mobileSidebarVariants = {
  closed: { x: "-100%" },
  open: { x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.3 } },
};

export default function Sidebar({ isOpen, onClose, role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navConfig[role] || [];
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <motion.aside
        variants={sidebarVariants}
        initial="open"
        animate={isOpen ? "open" : "closed"}
        className={`
          fixed top-0 left-0 z-50 h-full w-[280px] bg-gradient-to-b from-white to-gray-50
          lg:static lg:z-auto lg:shadow-none lg:block
          border-r border-gray-200
          flex flex-col
          shadow-xl
          ${isOpen ? 'block' : 'hidden lg:block'}
        `}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-5 py-6 border-b border-gray-200 relative overflow-hidden"
        >
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-50" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-base font-bold text-gray-900 capitalize">
                  {role} Portal
                </h2>
                <p className="text-xs text-gray-500 font-medium">Dashboard</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={item.href}
                  onClick={() => onClose()}
                  className="block"
                >
                  <motion.div
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      group flex items-center justify-between px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-300 relative overflow-hidden
                      ${
                        isActive
                          ? "text-white"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }
                    `}
                  >
                    {/* Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div
                        className={`
                          w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300
                          ${
                            isActive
                              ? "bg-white/20"
                              : "bg-gray-100 group-hover:bg-gray-200"
                          }
                        `}
                      >
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                          }`}
                        />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    
                    {item.badge && (
                      <span
                        className={`
                          px-2.5 py-1 rounded-lg text-xs font-bold relative z-10
                          ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                          }
                        `}
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-4 py-4 border-t border-gray-200"
        >
          <motion.button
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
              <LogOut className="w-4 h-4 text-red-600 group-hover:text-white" />
            </div>
            <span>Logout</span>
          </motion.button>
        </motion.div>
      </motion.aside>
    </>
  );
}
