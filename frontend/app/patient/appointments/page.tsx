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

// ─── Status config ─────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    label: string;
    icon: typeof CheckCircle;
    dotColor: string;
    bgColor: string;
    textColor: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    dotColor: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    dotColor: "bg-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
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
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
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

  const filters: { value: FilterValue; label: string; count: number }[] = [
    { value: "all", label: "All Appointments", count: 0 },
    { value: "pending", label: "Pending", count: 0 },
    { value: "confirmed", label: "Confirmed", count: 0 },
    { value: "completed", label: "Completed", count: 0 },
    { value: "cancelled", label: "Cancelled", count: 0 },
  ];

  const activeLabel = filters.find((f) => f.value === value)?.label || "All";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-indigo-500" />
        {activeLabel}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  onChange(f.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  f.value === value
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{f.label}</span>
                {f.value === value && (
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Appointment Card ──────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  onCancel,
  onReview,
  isCancelling,
}: {
  appointment: Appointment;
  onCancel: (a: Appointment) => void;
  onReview: (a: Appointment) => void;
  isCancelling: boolean;
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
    <div
      className={`group relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
      style={{
        animation: "fadeSlideUp 0.4s ease-out both",
      }}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${config.dotColor}`}
      />

      <div className="p-4 md:p-5">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Doctor avatar */}
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <User className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                  Dr. {doctorName}
                </h4>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(appointment.appointment_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {formatTime(appointment.time_slot)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(appointment.status === "pending" ||
              appointment.status === "confirmed") && (
              <button
                onClick={() => onCancel(appointment)}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Cancel
              </button>
            )}

            {appointment.status === "completed" && (
              <button
                onClick={() => onReview(appointment)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                Write Review
              </button>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {(appointment.reason || appointment.notes || appointment.cancel_reason) && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <ArrowDownRight
                className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-0" : "-rotate-45"}`}
              />
              {expanded ? "Less details" : "More details"}
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {appointment.reason && (
                  <div className="flex gap-2 p-3 rounded-lg bg-gray-50">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-0.5">
                        Reason for visit
                      </p>
                      <p className="text-sm text-gray-700">{appointment.reason}</p>
                    </div>
                  </div>
                )}

                {appointment.notes && (
                  <div className="flex gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                    <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-indigo-600 font-medium">
                          Doctor's Notes
                        </p>
                        <button
                          onClick={downloadPrescription}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          Download PDF
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {appointment.notes}
                      </p>
                    </div>
                  </div>
                )}

                {appointment.cancel_reason && (
                  <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-600 font-medium mb-0.5">
                        Cancellation Reason
                      </p>
                      <p className="text-sm text-gray-700">
                        {appointment.cancel_reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

function AppointmentsEmptyState({ status }: { status: FilterValue }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center"
      style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
    >
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        {status === "completed" ? (
          <CheckCircle className="w-10 h-10 text-gray-300" />
        ) : status === "cancelled" ? (
          <XCircle className="w-10 h-10 text-gray-300" />
        ) : (
          <CalendarClock className="w-10 h-10 text-gray-300" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
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
        <a
          href="/patient/doctors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <SearchX className="w-4 h-4" />
          Find a Doctor
        </a>
      )}
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-1/5" />
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

  // ── Inject animation keyframes once ─────────────────────────────────────

  useEffect(() => {
    const id = "appointment-animations";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="patient">
      <div className="max-w-4xl mx-auto">
        {/* ── Header ─ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-sm text-gray-500">
                {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>
          <FilterDropdown value={statusFilter} onChange={setStatusFilter} />
        </div>

        {/* ── Quick filter pills ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(
            [
              { value: "all", label: "All", count: counts.all || 0 },
              { value: "pending", label: "Pending", count: counts.pending || 0 },
              { value: "confirmed", label: "Confirmed", count: counts.confirmed || 0 },
              { value: "completed", label: "Completed", count: counts.completed || 0 },
              { value: "cancelled", label: "Cancelled", count: counts.cancelled || 0 },
            ] as { value: FilterValue; label: string; count: number }[]
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
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
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <LoadingSkeleton />
        ) : appointments.length === 0 ? (
          <AppointmentsEmptyState status={statusFilter} />
        ) : (
          <div className="space-y-3">
            {appointments.map((a, i) => (
              <div
                key={a.id}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <AppointmentCard
                  appointment={a}
                  onCancel={handleCancelClick}
                  onReview={handleReviewClick}
                  isCancelling={cancellingId === a.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Cancel Modal ── */}
        {showCancelModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowCancelModal(false);
                setSelectedAppointment(null);
              }}
            />
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
              style={{ animation: "fadeSlideUp 0.3s ease-out both" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Cancel Appointment
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel your appointment with{" "}
                <strong>{selectedAppointment.doctor?.user?.name}</strong> on{" "}
                {formatDate(selectedAppointment.appointment_date)} at{" "}
                {selectedAppointment.time_slot}?
              </p>

              <label className="text-sm font-medium text-gray-700 block mb-2">
                Reason for cancellation
              </label>
              <textarea
                rows={3}
                placeholder="Please tell us why..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={!cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {cancellingId === selectedAppointment.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Yes, Cancel"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Review Modal ── */}
        {showReviewModal && reviewingAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            />
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
              style={{ animation: "fadeSlideUp 0.3s ease-out both" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Write a Review
                  </h3>
                  <p className="text-xs text-gray-500">
                    Dr. {reviewingAppointment.doctor?.user?.name}
                  </p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      setReviewData({ ...reviewData, rating: star })
                    }
                    className="focus:outline-none transition-transform hover:scale-125 active:scale-100"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= reviewData.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <label className="text-sm font-medium text-gray-700 block mb-2">
                Your review <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Share your experience with this doctor..."
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData({ ...reviewData, comment: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || reviewData.rating === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
