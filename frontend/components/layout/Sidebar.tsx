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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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
    { href: "/patient/chatbot", label: "AI Assistant", icon: MessageSquare, badge: "AI" },
    { href: "/patient/profile", label: "Profile", icon: UserCircle, badge: "" },
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[272px] bg-white
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          border-r border-gray-100
          flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {role === "patient" ? "Patient" : role === "doctor" ? "Doctor" : "Admin"}
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`
                  group flex items-center justify-between px-3.5 py-2.5 rounded-xl
                  text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                      ${
                        isActive
                          ? "bg-white/20"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`
                      px-2 py-0.5 rounded-md text-[10px] font-bold
                      ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-100 text-indigo-600"
                      }
                    `}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
