import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Doctor Appointment System",
  description: "Sign in to your account to book appointments, manage appointments, and access your health records.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
