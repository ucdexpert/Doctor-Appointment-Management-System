"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Menu, X, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide on dashboard routes
  const isDashboardRoute = DASHBOARD_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const shouldHide = hide || isDashboardRoute;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (shouldHide) return null;

  const isHomePage = pathname === "/";

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
            : "bg-white/95 backdrop-blur-md border-b border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 transition-shadow"
              >
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </motion.div>
              <div className="hidden sm:block">
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HealthCare+
                </span>
                <p className="text-[10px] text-gray-500 -mt-1">Your Health, Our Priority</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {isHomePage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden md:flex items-center gap-8"
              >
                {[
                  { href: "/", label: "Home" },
                  { href: "/patient/doctors", label: "Find Doctors" },
                  { href: "/login", label: "Login" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                  </Link>
                ))}
              </motion.div>
            )}

            {/* Right Side */}
            <div className="flex items-center gap-3 md:gap-4">
              {isAuthenticated && user ? (
                <>
                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* User Avatar */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 hover:bg-gray-100 rounded-xl p-2 transition-colors"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="hidden lg:inline text-sm font-medium text-gray-700">
                        {user.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                    </motion.button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden"
                        >
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <p className="text-xs text-blue-600 capitalize mt-1">{user.role}</p>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <Link
                              href={`/${user.role}/dashboard`}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <User className="w-4 h-4" />
                              Dashboard
                            </Link>
                            <Link
                              href={`/${user.role}/profile`}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Settings className="w-4 h-4" />
                              Settings
                            </Link>
                          </div>

                          {/* Logout */}
                          <div className="border-t border-gray-100 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="sm" className="hidden sm:inline-flex border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all">
                        Login
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/30 transition-all">
                        Sign Up
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                href="/"
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/patient/doctors"
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Doctors
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
