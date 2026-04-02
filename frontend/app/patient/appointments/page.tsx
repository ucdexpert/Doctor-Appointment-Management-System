"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { appointmentsAPI, reviewsAPI } from "@/lib/api";
import { Appointment, Review } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, FileText, XCircle, CheckCircle, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await appointmentsAPI.getMyAppointments(params);
      setAppointments(response.data);
    } catch (error: any) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
    setCancelReason("");
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setCancellingId(selectedAppointment.id);
    try {
      await appointmentsAPI.cancel(selectedAppointment.id, { reason: cancelReason });
      toast.success("Appointment cancelled successfully");
      setShowCancelModal(false);
      loadAppointments();
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to cancel appointment";
      toast.error(message);
    } finally {
      setCancellingId(null);
      setSelectedAppointment(null);
    }
  };

  const handleReviewClick = (appointment: Appointment) => {
    setReviewingAppointment(appointment);
    setReviewData({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingAppointment) return;

    if (reviewData.rating === 0) {
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
      toast.success("Review submitted successfully!");
      setShowReviewModal(false);
      loadAppointments();
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to submit review";
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    const icons: Record<string, any> = {
      pending: Clock,
      confirmed: CheckCircle,
      cancelled: XCircle,
      completed: Calendar,
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge variant={variants[status] || "secondary"} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <DashboardLayout role="patient">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            My Appointments
          </h1>
          <p className="text-gray-600">
            View and manage your appointment bookings
          </p>
        </div>

        {/* Filter */}
        <Card className="mb-4 border-0 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Filter by Status:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === "all"
                  ? "You haven't booked any appointments yet"
                  : `No ${statusFilter} appointments`}
              </p>
              {statusFilter === "all" && (
                <a href="/patient/doctors">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    Find a Doctor
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
                onCancel={handleCancelClick}
                onReview={handleReviewClick}
                isCancelling={cancellingId === appointment.id}
              />
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cancel Appointment
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to cancel your appointment with{" "}
                  <strong>{selectedAppointment.doctor?.user?.name}</strong> on{" "}
                  <strong>{formatDate(selectedAppointment.appointment_date)}</strong> at{" "}
                  <strong>{selectedAppointment.time_slot}</strong>?
                </p>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="cancelReason">Cancellation Reason *</Label>
                  <textarea
                    id="cancelReason"
                    rows={3}
                    placeholder="Please provide a reason for cancellation..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelConfirm}
                    disabled={cancellingId === selectedAppointment.id || !cancelReason.trim()}
                    className="flex-1"
                  >
                    {cancellingId === selectedAppointment.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Yes, Cancel"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && reviewingAppointment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Write a Review
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Rate your experience with <strong>{reviewingAppointment.doctor?.user?.name}</strong>
                </p>

                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= reviewData.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="comment">Your Review (Optional)</Label>
                  <textarea
                    id="comment"
                    rows={4}
                    placeholder="Share your experience with this doctor..."
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewData.rating === 0}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AppointmentCard({
  appointment,
  getStatusBadge,
  formatDate,
  onCancel,
  onReview,
  isCancelling,
}: {
  appointment: Appointment;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  onCancel: (appointment: Appointment) => void;
  onReview: (appointment: Appointment) => void;
  isCancelling: boolean;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {appointment.doctor?.user?.name}
                </h3>
                {getStatusBadge(appointment.status)}
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(appointment.appointment_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{appointment.time_slot.substring(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{appointment.doctor?.user?.name?.split(" ")[0] || "Doctor"}</span>
                </div>
              </div>

              {appointment.reason && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Reason for visit:</p>
                  <p className="text-sm text-gray-700">{appointment.reason}</p>
                </div>
              )}

              {appointment.notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1 font-medium">Doctor's Notes:</p>
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}

              {appointment.cancel_reason && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600 mb-1 font-medium">Cancellation Reason:</p>
                  <p className="text-sm text-gray-700">{appointment.cancel_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cancel Button - Only for pending/confirmed */}
          {(appointment.status === "pending" || appointment.status === "confirmed") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(appointment)}
              disabled={isCancelling}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          )}

          {/* Review Button - Only for completed */}
          {appointment.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReview(appointment)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shrink-0"
            >
              <Star className="w-4 h-4 mr-1" />
              Write Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}
