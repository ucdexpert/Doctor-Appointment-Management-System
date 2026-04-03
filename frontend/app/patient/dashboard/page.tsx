"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Users, Star, Loader2, Heart } from "lucide-react";
import { appointmentsAPI } from "@/lib/api";
import { toast } from "sonner";

interface PatientStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await appointmentsAPI.getStats();
        setStats(response.data);
      } catch (err: unknown) {
        console.error("Failed to fetch patient stats:", err);
        setError(true);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-blue-100">
            Take control of your health. Book appointments with top doctors.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<Calendar className="w-6 h-6" />}
            title="Book Appointment"
            description="Find and book a doctor"
            href="/patient/doctors"
            color="from-blue-500 to-cyan-500"
          />
          <QuickActionCard
            icon={<Clock className="w-6 h-6" />}
            title="My Appointments"
            description="View upcoming visits"
            href="/patient/appointments"
            color="from-green-500 to-emerald-500"
          />
          <QuickActionCard
            icon={<Users className="w-6 h-6" />}
            title="My Doctors"
            description="Favorite doctors list"
            href="/patient/doctors"
            color="from-purple-500 to-pink-500"
          />
          <QuickActionCard
            icon={<Star className="w-6 h-6" />}
            title="AI Assistant"
            description="Get health advice"
            href="/patient/chatbot"
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading stats...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-gray-500">
              <p>Failed to load data. Please try again.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Appointments"
                value={stats?.total ?? 0}
                color="text-blue-600"
              />
              <StatCard
                label="Upcoming"
                value={stats?.upcoming ?? 0}
                color="text-green-600"
              />
              <StatCard
                label="Completed"
                value={stats?.completed ?? 0}
                color="text-purple-600"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({ icon, title, description, href, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="block p-5 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all group"
    >
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}

function StatCard({ label, value, color }: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
