import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Create Your Account | Doctor Appointment System",
  description: "Sign up as a patient or doctor. Book appointments, manage health records, or join our network of verified doctors.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
