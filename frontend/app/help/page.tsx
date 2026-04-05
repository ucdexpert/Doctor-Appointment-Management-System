"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ChevronDown,
  Mail,
  MessageSquare,
  Phone,
  ArrowLeft,
  HelpCircle,
  Calendar,
  User,
  CreditCard,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";

const faqs = [
  {
    question: "How do I book an appointment?",
    answer: "Simply click on 'Find Doctors', search for your preferred doctor, select an available time slot, and confirm your booking. You'll receive an instant confirmation.",
  },
  {
    question: "Can I cancel or reschedule my appointment?",
    answer: "Yes! Go to 'My Appointments' in your dashboard, select the appointment you want to modify, and choose either cancel or reschedule. Please do this at least 24 hours before your scheduled time.",
  },
  {
    question: "How do I find a specialist doctor?",
    answer: "Use the 'Find Doctors' page and filter by specialty, location, or availability. You can also use our AI chatbot to get personalized doctor recommendations.",
  },
  {
    question: "Is my personal information secure?",
    answer: "Absolutely! We use industry-standard encryption and security measures to protect your personal and medical information. Your data is never shared without your consent.",
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach us via email at hk202504@gmail.com, call us at +92 300 1234567, or use the live chat feature on our platform.",
  },
  {
    question: "Can I book an appointment for someone else?",
    answer: "Currently, appointments can only be booked for the registered account holder. We're working on adding family member booking soon.",
  },
];

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Help Center</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900 placeholder-gray-400"
          />
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: Calendar, label: "Book Appointment", href: "/patient/doctors" },
            { icon: User, label: "My Profile", href: "/patient/profile" },
            { icon: CreditCard, label: "Billing", href: "/patient/appointments" },
            { icon: Shield, label: "Privacy", href: "/privacy" },
          ].map((item, index) => (
            <Link key={index} href={item.href}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-lg transition-all"
              >
                <item.icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 text-gray-600 border-t border-gray-100 pt-4"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center"
        >
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-blue-100 mb-6">
            Our support team is here to assist you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold text-sm"
              >
                <Mail className="w-4 h-4" />
                Contact Us
              </motion.div>
            </Link>
            <Link href="/patient/chatbot">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold text-sm border border-white/30"
              >
                <MessageSquare className="w-4 h-4" />
                AI Chat Support
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
