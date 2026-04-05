import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find & Book Doctor Appointments Online | Doctor Appointment System",
  description:
    "Search and book appointments with top doctors in Pakistan. Find doctors by specialization, city, or availability. Instant booking, verified doctors.",
  openGraph: {
    title: "Find & Book Doctor Appointments Online",
    description:
      "Search and book appointments with top doctors in Pakistan. Find doctors by specialization, city, or availability.",
    url: "/patient/doctors",
    type: "website",
  },
  alternates: {
    canonical: "/patient/doctors",
  },
};

export default function DoctorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
