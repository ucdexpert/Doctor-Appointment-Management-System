"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  Clock, 
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "patient" | "doctor" | "admin";
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = role === "patient" ? [
    { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patient/doctors", label: "Find Doctors", icon: User },
    { href: "/patient/appointments", label: "Appointments", icon: Calendar },
    { href: "/patient/chatbot", label: "AI Assistant", icon: MessageSquare },
    { href: "/patient/profile", label: "Profile", icon: Settings },
  ] : role === "doctor" ? [
    { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/profile", label: "My Profile", icon: User },
    { href: "/doctor/schedule", label: "Schedule", icon: Clock },
    { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
    { href: "/doctor/profile", label: "Settings", icon: Settings },
  ] : [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/doctors", label: "Doctors", icon: User },
    { href: "/admin/users", label: "Users", icon: Settings },
  ];

  const currentRoute = navItems.find(item => pathname === item.href);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            HealthCare+
          </span>
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
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentRoute?.label || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 capitalize">{user.role}</span>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
