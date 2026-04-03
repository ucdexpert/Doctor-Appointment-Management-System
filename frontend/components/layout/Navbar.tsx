"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  hide?: boolean;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

const DASHBOARD_PREFIXES = ["/patient", "/doctor", "/admin"];

export default function Navbar({ hide = false, onMenuClick, showMobileMenu = true }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Hide on dashboard routes
  const isDashboardRoute = DASHBOARD_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const shouldHide = hide || isDashboardRoute;

  if (shouldHide) return null;

  const isHomePage = pathname === "/";

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline">
            HealthCare+
          </span>
        </Link>

        {/* Desktop Navigation - Only on Home Page */}
        {isHomePage && (
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link href="/patient/doctors" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Find Doctors
            </Link>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href={`/${user.role}/dashboard`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  Sign Up
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle (for dashboard pages) */}
          {!isHomePage && showMobileMenu && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
