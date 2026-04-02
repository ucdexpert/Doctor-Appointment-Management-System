"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Users, Star, TrendingUp } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome, Dr. {user?.name}! 🩺
          </h2>
          <p className="text-blue-100">
            Manage your schedule and patient appointments efficiently.
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Today's Appointments"
            value="0"
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="This Week"
            value="0"
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Patients"
            value="0"
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Average Rating"
            value="0.0"
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Calendar className="w-6 h-6" />}
            title="Manage Schedule"
            description="Set your availability"
            href="/doctor/schedule"
            color="from-blue-500 to-cyan-500"
          />
          <QuickActionCard
            icon={<Clock className="w-6 h-6" />}
            title="Appointments"
            description="View all bookings"
            href="/doctor/appointments"
            color="from-green-500 to-emerald-500"
          />
          <QuickActionCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Complete Profile"
            description="Add your details"
            href="/doctor/profile"
            color="from-purple-500 to-pink-500"
          />
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Schedule
          </h3>
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No appointments scheduled for today</p>
            <p className="text-sm mt-2">Set your schedule to start receiving bookings</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-5 bg-white rounded-xl border border-gray-200">
      <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
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
    <a
      href={href}
      className="block p-5 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all group"
    >
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
