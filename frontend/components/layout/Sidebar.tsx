"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, MessageSquare, Settings, X, Stethoscope, FileText, Clock, UserCircle } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: "patient" | "doctor" | "admin";
}

const navConfig = {
  patient: [
    { href: "/patient/dashboard", label: "Dashboard", icon: Home },
    { href: "/patient/doctors", label: "Find Doctors", icon: Stethoscope },
    { href: "/patient/appointments", label: "Appointments", icon: Calendar },
    { href: "/patient/chatbot", label: "AI Assistant", icon: MessageSquare },
    { href: "/patient/profile", label: "Profile", icon: UserCircle },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: Home },
    { href: "/doctor/profile", label: "My Profile", icon: UserCircle },
    { href: "/doctor/schedule", label: "Schedule", icon: Clock },
    { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { href: "/admin/users", label: "Users", icon: Users },
  ],
};

export default function Sidebar({ isOpen, onClose, role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navConfig[role] || [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 capitalize">
            {role} Portal
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
