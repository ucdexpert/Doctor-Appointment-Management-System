"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale } from "lucide-react";

export default function TermsOfServicePage() {
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
                <Scale className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
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
                Welcome to HealthCare+
              </h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms of Service ("Terms") govern your use of the HealthCare+ platform ("Service"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Account Registration
              </h2>
              <ul className="space-y-2 text-gray-600">
                {[
                  "You must provide accurate and complete information when creating an account",
                  "You are responsible for maintaining the confidentiality of your account",
                  "You must notify us immediately of any unauthorized use of your account",
                  "You must be at least 18 years old to create an account",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Appointment Booking */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Appointment Booking
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>By booking an appointment through our platform, you agree to:</p>
                <ul className="space-y-2">
                  {[
                    "Provide accurate health information for proper doctor matching",
                    "Arrive on time for your scheduled appointment",
                    "Cancel or reschedule at least 24 hours in advance when possible",
                    "Pay any applicable fees as displayed during booking",
                    "Follow the doctor's medical advice and instructions",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Prohibited Activities
              </h2>
              <p className="text-gray-600 mb-3">You may not:</p>
              <ul className="space-y-2 text-gray-600">
                {[
                  "Use the Service for any illegal purpose",
                  "Impersonate another person or provide false information",
                  "Attempt to gain unauthorized access to other accounts or systems",
                  "Harass, abuse, or threaten doctors or other users",
                  "Post fraudulent or misleading reviews",
                  "Use automated systems to scrape or extract data",
                  "Interfere with the proper functioning of the Service",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold flex-shrink-0">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Medical Disclaimer */}
            <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Medical Disclaimer
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                HealthCare+ is a platform that connects patients with doctors. We do not provide medical advice, diagnosis, or treatment. All medical decisions should be made in consultation with qualified healthcare professionals. The information provided on our platform is for informational purposes only and should not replace professional medical advice.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed">
                To the maximum extent permitted by law, HealthCare+ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability for any claims arising from these Terms shall not exceed the amount you paid us in the last 12 months.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Account Termination
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may terminate or suspend your account at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may delete your account at any time through your account settings.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Changes to Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after any modifications constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Contact Us
              </h2>
              <p className="text-gray-600 mb-3 text-sm">
                If you have any questions about these Terms, please contact us:
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
