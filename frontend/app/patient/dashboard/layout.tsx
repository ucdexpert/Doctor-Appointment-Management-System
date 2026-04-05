import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Manage Your Appointments",
  description: "View your upcoming appointments, booking history, and manage your health records.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
