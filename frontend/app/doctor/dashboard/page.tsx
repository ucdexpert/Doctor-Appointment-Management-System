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
  TrendingUp,
  Loader2,
  ArrowRight,
  ChevronRight,
  Activity,
  Sparkles,
  CheckCircle,
  XCircle,
  User,
  MapPin,
} from "lucide-react";
import { doctorsAPI, appointmentsAPI } from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DoctorStats {
  today_appointments: number;
  week_appointments: number;
  total_patients: number;
  avg_rating: number;
}

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  time_slot: string;
  reason: string | null;
  status: string;
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  patient?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await doctorsAPI.getMyDashboard();
        setStats(response.data.stats);
      } catch (err: unknown) {
        console.error("Failed to fetch doctor stats:", err);
        setError(true);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const response = await appointmentsAPI.getDoctorAppointments({ date_filter: "today" });
      setTodayAppointments(response.data);
    } catch (error) {
      console.error("Failed to fetch today's appointments:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      await appointmentsAPI.confirm(appointmentId);
      toast.success("Appointment confirmed ✓");
      fetchTodayAppointments();
    } catch (error) {
      toast.error("Failed to confirm appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      await appointmentsAPI.cancel(appointmentId, { reason: "Cancelled by doctor" });
      toast.success("Appointment cancelled");
      fetchTodayAppointments();
    } catch (error) {
      toast.error("Failed to cancel appointment");
    }
  };

  const handleCompleteAppointment = async (appointmentId: number) => {
    try {
      await appointmentsAPI.complete(appointmentId);
      toast.success("Appointment marked as completed ✓");
      fetchTodayAppointments();
    } catch (error) {
      toast.error("Failed to complete appointment");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <DashboardLayout role="doctor">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl"
        >
          {/* Animated Background */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
          />

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
                Doctor Dashboard
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Welcome, Dr. {user?.name}! 🩺
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-indigo-100 max-w-2xl mb-8"
            >
              Manage your schedule and patient appointments efficiently. Provide the best care possible.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/doctor/schedule">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg"
                >
                  <Calendar className="w-4 h-4" />
                  Manage Schedule
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
              <Link href="/doctor/appointments">
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

        {/* Stats Grid */}
        <motion.div variants={itemVariants}>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 animate-skeleton rounded-2xl"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
              <p>Failed to load data. Please try again.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                icon={<Calendar className="w-6 h-6" />}
                label="Today's Appointments"
                value={stats?.today_appointments ?? 0}
                color="from-blue-500 to-cyan-500"
                bgColor="from-blue-50 to-cyan-50"
                borderColor="border-blue-200"
                delay={0.1}
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                label="This Week"
                value={stats?.week_appointments ?? 0}
                color="from-green-500 to-emerald-500"
                bgColor="from-green-50 to-emerald-50"
                borderColor="border-green-200"
                delay={0.2}
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="Total Patients"
                value={stats?.total_patients ?? 0}
                color="from-purple-500 to-pink-500"
                bgColor="from-purple-50 to-pink-50"
                borderColor="border-purple-200"
                delay={0.3}
              />
              <StatCard
                icon={<Star className="w-6 h-6" />}
                label="Average Rating"
                value={stats?.avg_rating ? stats.avg_rating.toFixed(1) : "0.0"}
                color="from-orange-500 to-red-500"
                bgColor="from-orange-50 to-red-50"
                borderColor="border-orange-200"
                delay={0.4}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid sm:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Calendar className="w-6 h-6" />}
            title="Manage Schedule"
            description="Set your availability"
            href="/doctor/schedule"
            color="from-blue-500 to-cyan-500"
            bgColor="from-blue-50 to-cyan-50"
            delay={0.1}
          />
          <QuickActionCard
            icon={<Clock className="w-6 h-6" />}
            title="Appointments"
            description="View all bookings"
            href="/doctor/appointments"
            color="from-green-500 to-emerald-500"
            bgColor="from-green-50 to-emerald-50"
            delay={0.2}
          />
          <QuickActionCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Complete Profile"
            description="Add your details"
            href="/doctor/profile"
            color="from-purple-500 to-pink-500"
            bgColor="from-purple-50 to-pink-50"
            delay={0.3}
          />
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Today's Schedule</h3>
              <p className="text-sm text-gray-500 mt-1">
                {todayAppointments.length} appointment(s) for today
              </p>
            </div>
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium group"
            >
              View All
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {appointmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading appointments...</span>
            </div>
          ) : todayAppointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              </motion.div>
              <p className="text-gray-500 text-lg font-medium mb-2">
                No appointments scheduled for today
              </p>
              <p className="text-sm text-gray-400">
                Set your schedule to start receiving bookings
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                        {appointment.patient?.name?.charAt(0) || "P"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {appointment.patient?.name || "Patient"}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{appointment.time_slot}</span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              appointment.status === "confirmed"
                                ? "default"
                                : appointment.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              appointment.status === "confirmed"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : appointment.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : ""
                            }
                          >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </div>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                            {appointment.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    {appointment.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmAppointment(appointment.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {appointment.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteAppointment(appointment.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color, bgColor, borderColor, delay }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
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
      className={`relative overflow-hidden p-6 bg-gradient-to-br ${bgColor} rounded-2xl border ${borderColor} hover:shadow-lg transition-all duration-300`}
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
      <div className={`absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-full blur-xl`} />
    </motion.div>
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
        className="group relative block p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
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
