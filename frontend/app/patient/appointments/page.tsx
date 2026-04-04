"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { appointmentsAPI, reviewsAPI } from "@/lib/api";
import { Appointment } from "@/types";
import {
  Calendar,
  Clock,
  User,
  FileText,
  Loader2,
  Star,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarClock,
  ArrowDownRight,
  ChevronDown,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Status config ─────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    label: string;
    icon: typeof CheckCircle;
    gradient: string;
    bgColor: string;
    textColor: string;
    dotColor: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    gradient: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    dotColor: "bg-yellow-500",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    gradient: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    gradient: "from-red-500 to-rose-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    dotColor: "bg-red-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    gradient: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    dotColor: "bg-blue-500",
  },
};

// ─── Status Badge ──────────────────────────────────────────────────────────

function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </motion.span>
  );
}

// ─── Filter dropdown ───────────────────────────────────────────────────────

type FilterValue = "all" | "pending" | "confirmed" | "completed" | "cancelled";

function FilterDropdown({
  value,
  onChange,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const [open, setOpen] = useState(false);

  const filters: { value: FilterValue; label: string }[] = [
    { value: "all", label: "All Appointments" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const activeLabel = filters.find((f) => f.value === value)?.label || "All";

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 text-blue-500" />
        {activeLabel}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-xl z-20 overflow-hidden"
            >
              {filters.map((f, i) => (
                <motion.button
                  key={f.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    onChange(f.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    f.value === value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{f.label}</span>
                  {f.value === value && (
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Appointment Card ──────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  onCancel,
  onReview,
  isCancelling,
  index,
}: {
  appointment: Appointment;
  onCancel: (a: Appointment) => void;
  onReview: (a: Appointment) => void;
  isCancelling: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[appointment.status] || statusConfig.pending;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (t: string) => t.substring(0, 5);

  const downloadPrescription = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/appointments/${appointment.id}/prescription-pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription_${appointment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Prescription downloaded!");
    } catch {
      toast.error("Failed to download prescription");
    }
  };

  const doctorName = appointment.doctor?.user?.name || "Doctor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.005 }}
      className={`group relative rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient}`} />

      <div className="p-5 md:p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Doctor avatar */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg"
            >
              <User className="w-6 h-6" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">
                  Dr. {doctorName}
                </h4>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(appointment.appointment_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatTime(appointment.time_slot)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(appointment.status === "pending" ||
              appointment.status === "confirmed") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCancel(appointment)}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Cancel
              </motion.button>
            )}

            {appointment.status === "completed" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReview(appointment)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                Review
              </motion.button>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {(appointment.reason || appointment.notes || appointment.cancel_reason) && (
          <>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setExpanded(!expanded)}
              className="mt-4 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <ArrowDownRight
                className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-0" : "-rotate-45"}`}
              />
              {expanded ? "Less details" : "More details"}
            </motion.button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-3"
                >
                  {appointment.reason && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 p-4 rounded-xl bg-gray-50"
                    >
                      <FileText className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">
                          Reason for visit
                        </p>
                        <p className="text-sm text-gray-700">{appointment.reason}</p>
                      </div>
                    </motion.div>
                  )}

                  {appointment.notes && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100"
                    >
                      <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-blue-600 font-semibold">
                            Doctor's Notes
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={downloadPrescription}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download PDF
                          </motion.button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {appointment.notes}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {appointment.cancel_reason && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-100"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-600 font-semibold mb-1">
                          Cancellation Reason
                        </p>
                        <p className="text-sm text-gray-700">
                          {appointment.cancel_reason}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

function AppointmentsEmptyState({ status }: { status: FilterValue }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg"
      >
        {status === "completed" ? (
          <CheckCircle className="w-10 h-10 text-blue-400" />
        ) : status === "cancelled" ? (
          <XCircle className="w-10 h-10 text-red-400" />
        ) : (
          <CalendarClock className="w-10 h-10 text-indigo-400" />
        )}
      </motion.div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {status === "all"
          ? "No appointments yet"
          : `No ${status} appointments`}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {status === "all"
          ? "Start by finding and booking an appointment with a doctor."
          : `You don't have any ${status} appointments at the moment.`}
      </p>
      {status === "all" && (
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="/patient/doctors"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          <SearchX className="w-4 h-4" />
          Find a Doctor
        </motion.a>
      )}
    </motion.div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-6 animate-skeleton"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
              <div className="h-3 bg-gray-100 rounded-lg w-1/4" />
              <div className="h-3 bg-gray-100 rounded-lg w-1/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── Load appointments ───────────────────────────────────────────────────

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") {
        params.status_filter = statusFilter;
      }
      const response = await appointmentsAPI.getMyAppointments(params);
      setAppointments(response.data);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  // ── Count for filter badge ──────────────────────────────────────────────

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: appointments.length };
    appointments.forEach((a) => {
      c[a.status] = (c[a.status] || 0) + 1;
    });
    return c;
  }, [appointments]);

  // ── Cancel ──────────────────────────────────────────────────────────────

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
    setCancelReason("");
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setCancellingId(selectedAppointment.id);
    try {
      await appointmentsAPI.cancel(selectedAppointment.id, { reason: cancelReason });
      toast.success("Appointment cancelled");
      setShowCancelModal(false);
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  };

  // ── Review ──────────────────────────────────────────────────────────────

  const handleReviewClick = (appointment: Appointment) => {
    setReviewingAppointment(appointment);
    setReviewData({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingAppointment || reviewData.rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        doctor_id: reviewingAppointment.doctor_id,
        appointment_id: reviewingAppointment.id,
        rating: reviewData.rating,
        comment: reviewData.comment || undefined,
      });
      toast.success("Review submitted!");
      setShowReviewModal(false);
      loadAppointments();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="patient">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
        >
          {/* Background decorations */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg"
              >
                <Calendar className="w-6 h-6" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">My Appointments</h1>
                <p className="text-sm text-indigo-100">
                  {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} total
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <FilterDropdown value={statusFilter} onChange={setStatusFilter} />
        </motion.div>

        {/* ── Quick filter pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {(
            [
              { value: "all", label: "All", count: counts.all || 0 },
              { value: "pending", label: "Pending", count: counts.pending || 0 },
              { value: "confirmed", label: "Confirmed", count: counts.confirmed || 0 },
              { value: "completed", label: "Completed", count: counts.completed || 0 },
              { value: "cancelled", label: "Cancelled", count: counts.cancelled || 0 },
            ] as { value: FilterValue; label: string; count: number }[]
          ).map((f) => (
            <motion.button
              key={f.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f.value
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {f.label}
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                  statusFilter === f.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {f.count}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* ── Content ── */}
        {loading ? (
          <LoadingSkeleton />
        ) : appointments.length === 0 ? (
          <AppointmentsEmptyState status={statusFilter} />
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence>
              {appointments.map((a, i) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onCancel={handleCancelClick}
                  onReview={handleReviewClick}
                  isCancelling={cancellingId === a.id}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Cancel Modal ── */}
        <AnimatePresence>
          {showCancelModal && selectedAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAppointment(null);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Cancel Appointment
                  </h3>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to cancel your appointment with{" "}
                  <strong>{selectedAppointment.doctor?.user?.name}</strong> on{" "}
                  {formatDate(selectedAppointment.appointment_date)} at{" "}
                  {selectedAppointment.time_slot}?
                </p>

                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Reason for cancellation
                </label>
                <textarea
                  rows={3}
                  placeholder="Please tell us why..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                />

                <div className="flex gap-3 mt-5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowCancelModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Go Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelConfirm}
                    disabled={!cancelReason.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {cancellingId === selectedAppointment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Yes, Cancel"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Review Modal ── */}
        <AnimatePresence>
          {showReviewModal && reviewingAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowReviewModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"
                  >
                    <Star className="w-5 h-5 text-amber-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Write a Review
                    </h3>
                    <p className="text-xs text-gray-500">
                      Dr. {reviewingAppointment.doctor?.user?.name}
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        setReviewData({ ...reviewData, rating: star })
                      }
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= reviewData.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Your review <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your experience with this doctor..."
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, comment: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />

                <div className="flex gap-3 mt-5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewData.rating === 0}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {submittingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Submit Review"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
