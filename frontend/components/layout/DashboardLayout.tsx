"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Shield,
  Sparkles
} from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {currentRoute?.label || "Dashboard"}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {currentRoute ? `Manage your ${currentRoute?.label.toLowerCase()}` : 'Overview of your account'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-100">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm" style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)' }}></div>
              <span className="text-sm font-medium text-gray-700 capitalize">{user.role}</span>
            </div>

            {/* User Avatar + Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl p-1.5 transition-all group"
              >
                {photoUrl && !imageError ? (
                  <div className="relative">
                    <img
                      src={photoUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-indigo-200 transition-all"
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold ring-2 ring-gray-100 group-hover:ring-indigo-200 transition-all shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all hidden md:block ${
                    showUserMenu ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                  />
                  <div 
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                    style={{ animation: 'slideDown 0.3s ease-out' }}
                  >
                    {/* User Info Header */}
                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 relative overflow-hidden">
                      {/* Decorative circles */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          {photoUrl && !imageError ? (
                            <img
                              src={photoUrl}
                              alt={user.name}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/50 shadow-lg"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold ring-2 ring-white/50">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-base font-bold text-white">{user.name}</p>
                            <p className="text-xs text-indigo-100">{user.email}</p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                          <Sparkles className="w-3 h-3 text-yellow-300" />
                          <span className="text-xs font-medium text-white capitalize">{user.role} Account</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-3">
                      {/* Dashboard Link */}
                      <Link
                        href={`/${user.role}/dashboard`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all group"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">Dashboard</p>
                          <p className="text-xs text-gray-500">Go to your dashboard</p>
                        </div>
                      </Link>

                      {/* Profile Link */}
                      <Link
                        href={`/${user.role}/profile`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all group mt-1"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">Profile Settings</p>
                          <p className="text-xs text-gray-500">Manage your account</p>
                        </div>
                      </Link>

                      {/* Divider */}
                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all group mt-1"
                      >
                        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 transition-all shadow-md">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Logout</p>
                          <p className="text-xs text-red-400">Sign out of your account</p>
                        </div>
                      </button>
                    </div>
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
