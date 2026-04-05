"use client";

import { motion } from "framer-motion";
import { Heart, Mail, Phone, MapPin, Github, Twitter, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterProps {
  hide?: boolean;
}

const DASHBOARD_PREFIXES = ["/patient", "/doctor", "/admin"];

export default function Footer({ hide = false }: FooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const isDashboardRoute = DASHBOARD_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const shouldHide = hide || isDashboardRoute;

  if (shouldHide) return null;

  const footerLinks = {
    quickLinks: [
      { label: "Find Doctors", href: "/patient/doctors" },
      { label: "Book Appointment", href: "/register" },
      { label: "Register", href: "/register" },
      { label: "Login", href: "/login" },
    ],
    support: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200"
    >
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HealthCare+
                </span>
                <p className="text-xs text-gray-500">Your Health, Our Priority</p>
              </div>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Making healthcare accessible, convenient, and affordable for everyone across Pakistan.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Github, href: "https://github.com/ucdexpert", label: "GitHub" },
                { icon: Twitter, href: "https://x.com/HassanKhan20842", label: "Twitter" },
                { icon: Instagram, href: "https://www.instagram.com/uzairkhilji.uzairkhilji/", label: "Instagram" },
                { icon: Linkedin, href: "https://www.linkedin.com/in/muhammad-uzair-066733314/", label: "LinkedIn" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg transition-all duration-300 border border-gray-200"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-blue-600 group-hover:w-3 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-blue-600 group-hover:w-3 transition-all duration-300" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <a href="mailto:hk202504@gmail.com" className="hover:text-blue-600 transition-colors">
                  hk202504@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <a href="tel:03170219387" className="hover:text-blue-600 transition-colors">
                  0317-0219387
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span>Karachi, Pakistan</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-red-500" />
              <span>© {currentYear} HealthCare+. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
