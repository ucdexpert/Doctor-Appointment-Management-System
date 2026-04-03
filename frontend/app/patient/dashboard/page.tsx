"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  Loader2, 
  Heart,
  ArrowRight,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  MessageSquare
} from "lucide-react";
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

  // Inject custom styles
  useEffect(() => {
    const id = "dashboard-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Welcome Banner ── */}
        <div 
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl"
          style={{ animation: "fadeSlideUp 0.5s ease-out both" }}
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32">
            <div className="absolute inset-0 bg-white/5 rounded-full animate-ping"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-300" style={{ animation: "float 2s ease-in-out infinite" }} />
              <span className="text-sm font-medium text-indigo-100">Welcome to your health dashboard</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-lg text-indigo-100 max-w-2xl">
              Take control of your health. Book appointments with top doctors and manage your healthcare journey.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link 
                href="/patient/doctors"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/patient/appointments"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-all border border-white/30"
              >
                <Clock className="w-4 h-4" />
                View Appointments
              </Link>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}
        >
          <QuickActionCard
            icon={<Calendar className="w-6 h-6" />}
            title="Book Appointment"
            description="Find and book a doctor"
            href="/patient/doctors"
            color="from-blue-500 to-cyan-500"
            bgColor="from-blue-50 to-cyan-50"
            delay={0.15}
          />
          <QuickActionCard
            icon={<Clock className="w-6 h-6" />}
            title="My Appointments"
            description="View upcoming visits"
            href="/patient/appointments"
            color="from-green-500 to-emerald-500"
            bgColor="from-green-50 to-emerald-50"
            delay={0.2}
          />
          <QuickActionCard
            icon={<Users className="w-6 h-6" />}
            title="My Doctors"
            description="Favorite doctors list"
            href="/patient/favorites"
            color="from-purple-500 to-pink-500"
            bgColor="from-purple-50 to-pink-50"
            delay={0.25}
          />
          <QuickActionCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="AI Assistant"
            description="Get health advice"
            href="/patient/chatbot"
            color="from-orange-500 to-red-500"
            bgColor="from-orange-50 to-red-50"
            delay={0.3}
          />
        </div>

        {/* ── Stats Grid ── */}
        <div 
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Quick Stats</h3>
              <p className="text-sm text-gray-500 mt-1">Your appointment overview</p>
            </div>
            <Link 
              href="/patient/appointments"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-600">Loading stats...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-gray-500">
              <p>Failed to load data. Please try again.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Appointments"
                value={stats?.total ?? 0}
                icon={<Activity className="w-5 h-5" />}
                color="from-blue-500 to-cyan-500"
                bgColor="from-blue-50 to-cyan-50"
                borderColor="border-blue-200"
              />
              <StatCard
                label="Upcoming"
                value={stats?.upcoming ?? 0}
                icon={<Clock className="w-5 h-5" />}
                color="from-green-500 to-emerald-500"
                bgColor="from-green-50 to-emerald-50"
                borderColor="border-green-200"
              />
              <StatCard
                label="Completed"
                value={stats?.completed ?? 0}
                icon={<CheckCircle2 className="w-5 h-5" />}
                color="from-purple-500 to-pink-500"
                bgColor="from-purple-50 to-pink-50"
                borderColor="border-purple-200"
              />
              <StatCard
                label="Cancelled"
                value={stats?.cancelled ?? 0}
                icon={<XCircle className="w-5 h-5" />}
                color="from-red-500 to-orange-500"
                bgColor="from-red-50 to-orange-50"
                borderColor="border-red-200"
              />
            </div>
          )}
        </div>

        {/* ── Health Tips Section ── */}
        <div 
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Health Tips</h3>
              <p className="text-sm text-gray-600">Stay healthy, stay happy</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <HealthTipCard
              icon="💧"
              title="Stay Hydrated"
              description="Drink at least 8 glasses of water daily for optimal health."
            />
            <HealthTipCard
              icon="🏃"
              title="Stay Active"
              description="Exercise for 30 minutes daily to maintain fitness."
            />
            <HealthTipCard
              icon="😴"
              title="Get Rest"
              description="Sleep 7-8 hours every night for proper recovery."
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({ icon, title, description, href, color, bgColor, delay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="group relative block p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
      style={{ animation: `fadeSlideUp 0.5s ease-out ${delay}s both` }}
    >
      {/* Hover gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md`}>
          {icon}
        </div>
        <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{title}</h4>
        <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{description}</p>
        <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          Get Started
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value, icon, color, bgColor, borderColor }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`relative overflow-hidden p-5 bg-gradient-to-br ${bgColor} rounded-xl border ${borderColor} hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1`}>
            {value}
          </div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md`}>
          {icon}
        </div>
      </div>
      {/* Decorative corner */}
      <div className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br ${color} opacity-10 rounded-full blur-xl`}></div>
    </div>
  );
}

function HealthTipCard({ icon, title, description }: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-indigo-100 hover:shadow-md transition-all hover:scale-105 cursor-pointer">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
