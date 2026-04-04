"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Clock,
  Users,
  Heart,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Shield,
  Star,
  TrendingUp,
  Zap,
  MapPin,
  Loader2,
} from "lucide-react";
import { appointmentsAPI, doctorsAPI } from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import DoctorCard from "@/components/doctor/DoctorCard";

interface PatientStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

interface Recommendation {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  city: string | null;
  consultation_fee: number;
  avg_rating: number;
  experience_years: number;
  available_slots_today: number;
  recommendation_score: number;
  reason: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecommendations();
  }, []);

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

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const response = await doctorsAPI.getQuickBookRecommendations();
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <DashboardLayout role="patient">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl"
        >
          {/* Background decorations */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32"
          >
            <div className="absolute inset-0 bg-white/5 rounded-full animate-ping" />
          </motion.div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </motion.div>
              <span className="text-sm font-medium text-indigo-100">
                Welcome to your health dashboard
              </span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Welcome back, {user?.name}! 👋
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-indigo-100 max-w-2xl mb-8"
            >
              Take control of your health. Book appointments with top doctors and manage your healthcare journey.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/patient/doctors">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-all shadow-lg"
                >
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
              <Link href="/patient/appointments">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-all border border-white/30"
                >
                  <Clock className="w-4 h-4" />
                  View Appointments
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<Calendar className="w-6 h-6" />}
            title="Book Appointment"
            description="Find and book a doctor"
            href="/patient/doctors"
            color="from-blue-500 to-cyan-500"
            bgColor="from-blue-50 to-cyan-50"
            delay={0.1}
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
            icon={<Heart className="w-6 h-6" />}
            title="My Favorites"
            description="Favorite doctors list"
            href="/patient/favorites"
            color="from-pink-500 to-rose-500"
            bgColor="from-pink-50 to-rose-50"
            delay={0.3}
          />
          <QuickActionCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="AI Assistant"
            description="Get health advice"
            href="/patient/chatbot"
            color="from-purple-500 to-indigo-500"
            bgColor="from-purple-50 to-indigo-50"
            delay={0.4}
          />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Quick Stats</h3>
              <p className="text-sm text-gray-500 mt-1">Your appointment overview</p>
            </div>
            <Link
              href="/patient/appointments"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium group"
            >
              View All
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-200 animate-skeleton rounded-2xl"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-gray-500">
              <p>Failed to load data. Please try again.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                label="Total Appointments"
                value={stats?.total ?? 0}
                icon={<Activity className="w-5 h-5" />}
                color="from-blue-500 to-cyan-500"
                bgColor="from-blue-50 to-cyan-50"
                borderColor="border-blue-200"
                delay={0.1}
              />
              <StatCard
                label="Upcoming"
                value={stats?.upcoming ?? 0}
                icon={<Clock className="w-5 h-5" />}
                color="from-green-500 to-emerald-500"
                bgColor="from-green-50 to-emerald-50"
                borderColor="border-green-200"
                delay={0.2}
              />
              <StatCard
                label="Completed"
                value={stats?.completed ?? 0}
                icon={<CheckCircle2 className="w-5 h-5" />}
                color="from-purple-500 to-pink-500"
                bgColor="from-purple-50 to-pink-50"
                borderColor="border-purple-200"
                delay={0.3}
              />
              <StatCard
                label="Cancelled"
                value={stats?.cancelled ?? 0}
                icon={<XCircle className="w-5 h-5" />}
                color="from-red-500 to-orange-500"
                bgColor="from-red-50 to-orange-50"
                borderColor="border-red-200"
                delay={0.4}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Health Tips Section */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-blue-100 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <Heart className="w-6 h-6 text-white" />
            </motion.div>
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
              delay={0.1}
            />
            <HealthTipCard
              icon="🏃"
              title="Stay Active"
              description="Exercise for 30 minutes daily to maintain fitness."
              delay={0.2}
            />
            <HealthTipCard
              icon="😴"
              title="Get Rest"
              description="Sleep 7-8 hours every night for proper recovery."
              delay={0.3}
            />
          </div>
        </motion.div>

        {/* Quick Book Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-3xl border border-yellow-200 p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg"
                >
                  <Zap className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Quick Book</h3>
                  <p className="text-sm text-gray-600">Available doctors today</p>
                </div>
              </div>
              <Link
                href="/patient/doctors"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recommendationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <motion.div
                    key={rec.doctor_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl border border-yellow-200 p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          Dr. {rec.doctor_name}
                        </h4>
                        <p className="text-sm text-gray-600">{rec.specialization}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-semibold">{rec.avg_rating}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {rec.city && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{rec.city}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Fee:</span>
                        <span className="font-semibold text-gray-900">PKR {rec.consultation_fee}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Available slots:</span>
                        <span className="font-semibold text-green-600">
                          {rec.available_slots_today}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700 font-medium">
                        ✨ {rec.reason}
                      </p>
                    </div>

                    <Link
                      href={`/patient/book/${rec.doctor_id}`}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg font-medium text-sm transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Now
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
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
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative block p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        {/* Hover gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="relative z-10">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}
          >
            {icon}
          </motion.div>
          <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
            {title}
          </h4>
          <p className="text-sm text-gray-600">{description}</p>
          <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function StatCard({ label, value, icon, color, bgColor, borderColor, delay }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden p-5 bg-gradient-to-br ${bgColor} rounded-2xl border ${borderColor} hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
            className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1`}
          >
            {value}
          </motion.div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </motion.div>
      </div>
      {/* Decorative corner */}
      <div className={`absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-full blur-xl`} />
    </motion.div>
  );
}

function HealthTipCard({ icon, title, description, delay }: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white rounded-xl p-5 border border-blue-100 hover:shadow-lg transition-all cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.2 }}
        className="text-3xl mb-3"
      >
        {icon}
      </motion.div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}
