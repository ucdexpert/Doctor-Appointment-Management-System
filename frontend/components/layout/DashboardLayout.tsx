"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, User, LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "patient" | "doctor" | "admin";
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getPhotoUrl = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith("/")) {
      return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${photoUrl}`;
    }
    return photoUrl;
  };

  const photoUrl = getPhotoUrl(user?.photo_url);

  // Reset image error when photoUrl changes (must be before early returns)
  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

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

  const patientNav = [
    { href: "/patient/dashboard", label: "Dashboard" },
    { href: "/patient/doctors", label: "Find Doctors" },
    { href: "/patient/appointments", label: "Appointments" },
    { href: "/patient/chatbot", label: "AI Assistant" },
    { href: "/patient/profile", label: "Profile" },
  ];
  const doctorNav = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/profile", label: "My Profile" },
    { href: "/doctor/schedule", label: "Schedule" },
    { href: "/doctor/appointments", label: "Appointments" },
  ];
  const adminNav = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/users", label: "Users" },
  ];

  const navMap = { patient: patientNav, doctor: doctorNav, admin: adminNav };
  const currentRoute = navMap[role].find(item => pathname === item.href);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />

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

            {/* User Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
              >
                {photoUrl && !imageError ? (
                  <img
                    src={photoUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    {/* Dashboard Link */}
                    <Link
                      href={`/${user.role}/dashboard`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
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
