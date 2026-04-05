import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://doctor-appointment-management-sytem.vercel.app"),
  title: {
    default: "Doctor Appointment System - Book Appointments Online in Pakistan",
    template: "%s | Doctor Appointment System",
  },
  description:
    "Find and book appointments with top doctors in Pakistan. Search by specialization, city, or availability. AI-powered health assistant available 24/7.",
  keywords: [
    "doctor appointment",
    "book doctor Pakistan",
    "online doctor booking",
    "medical appointments",
    "healthcare Pakistan",
    "find doctors near me",
    "telemedicine Pakistan",
    "AI health assistant",
  ],
  authors: [{ name: "Doctor Appointment System" }],
  creator: "Doctor Appointment System",
  publisher: "Doctor Appointment System",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "/",
    title: "Doctor Appointment System - Book Appointments Online in Pakistan",
    description:
      "Find and book appointments with top doctors in Pakistan. AI-powered health assistant available 24/7.",
    siteName: "Doctor Appointment System",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Doctor Appointment System - Online Doctor Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doctor Appointment System - Book Appointments Online in Pakistan",
    description:
      "Find and book appointments with top doctors in Pakistan. AI-powered health assistant available 24/7.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  category: "Healthcare",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={inter.variable}
    >
      <head>
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://doctor-appointment-management-sytem.vercel.app"} />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ReactQueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
