"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterProps {
  hide?: boolean;
}

const DASHBOARD_PREFIXES = ["/patient", "/doctor", "/admin"];

export default function Footer({ hide = false }: FooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide on dashboard routes
  const isDashboardRoute = DASHBOARD_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const shouldHide = hide || isDashboardRoute;

  if (shouldHide) return null;

  return (
    <footer className="bg-white border-t border-gray-200 py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + Copyright */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm text-gray-600">
            © {currentYear} HealthCare+. All rights reserved.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Find Doctors
          </Link>
          <Link
            href="/register"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Register
          </Link>
          <a
            href="mailto:contact@healthcare.com"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
