"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Database, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-lg"
        >
          <p className="text-sm text-gray-500 mb-6">
            Last updated: April 5, 2026
          </p>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Introduction
              </h2>
              <p className="text-gray-600 leading-relaxed">
                HealthCare+ ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our doctor appointment booking platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Information We Collect
              </h2>
              <div className="space-y-3 text-gray-600">
                <p className="font-medium text-gray-700">Personal Information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, phone number</li>
                  <li>Date of birth and gender</li>
                  <li>Profile photo</li>
                </ul>
                <p className="font-medium text-gray-700 mt-4">Medical Information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Appointment history and records</li>
                  <li>Health conditions and medications (if provided)</li>
                  <li>Doctor consultations and reviews</li>
                </ul>
                <p className="font-medium text-gray-700 mt-4">Technical Information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>IP address and browser type</li>
                  <li>Device information and operating system</li>
                  <li>Usage data and cookies</li>
                </ul>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                How We Use Your Information
              </h2>
              <ul className="space-y-2 text-gray-600">
                {[
                  "To facilitate appointment booking and management",
                  "To connect you with healthcare providers",
                  "To send appointment reminders and notifications",
                  "To improve our services and user experience",
                  "To provide customer support",
                  "To comply with legal obligations",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We implement industry-standard security measures to protect your personal and medical information. This includes encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Information Sharing
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may share your information with:
              </p>
              <ul className="space-y-2 text-gray-600 mt-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Doctors:</strong> Only relevant medical information needed for your appointment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Service Providers:</strong> Third parties that help us operate our platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Legal Requirements:</strong> When required by law or to protect our rights</span>
                </li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Your Rights
              </h2>
              <ul className="space-y-2 text-gray-600">
                {[
                  "Access and download your personal data",
                  "Correct inaccurate information",
                  "Delete your account and data",
                  "Opt-out of marketing communications",
                  "Restrict or object to data processing",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Contact */}
            <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Questions or Concerns?
              </h2>
              <p className="text-gray-600 mb-3">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:hk202504@gmail.com" className="text-blue-600 hover:underline">
                    hk202504@gmail.com
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Phone:</strong> 0317-0219387
                </p>
                <p className="text-gray-700">
                  <strong>Address:</strong> Karachi, Pakistan
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
