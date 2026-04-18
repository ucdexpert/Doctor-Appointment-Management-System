"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { appointmentsAPI } from "@/lib/api";
import { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, Loader2, Video } from "lucide-react";
import { toast } from "sonner";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<{ id: number; action: string } | null>(null);
  
  // Modal states
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadAppointments();
  }, [dateFilter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFilter !== "all") {
        params.date_filter = dateFilter;
      }
      const response = await appointmentsAPI.getDoctorAppointments(params);
      setAppointments(response.data);
    } catch (error: any) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    setActionLoading({ id, action: "confirm" });
    try {
      await appointmentsAPI.confirm(id);
      toast.success("Appointment confirmed");
      loadAppointments();
    } catch (error: any) {
      toast.error("Failed to confirm appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: number) => {
    setSelectedAppointment(appointments.find(a => a.id === id) || null);
    setNotes("");
    setShowNotesModal(true);
  };

  const handleCompleteConfirm = async () => {
    if (!selectedAppointment) return;

    setActionLoading({ id: selectedAppointment.id, action: "complete" });
    try {
      await appointmentsAPI.complete(selectedAppointment.id);
      
      // Add notes if provided
      if (notes.trim()) {
        await appointmentsAPI.addNotes(selectedAppointment.id, { notes });
      }
      
      toast.success("Appointment marked as completed");
      setShowNotesModal(false);
      loadAppointments();
    } catch (error: any) {
      toast.error("Failed to complete appointment");
    } finally {
      setActionLoading(null);
      setSelectedAppointment(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    const reason = prompt("Please provide a cancellation reason:");
    if (!reason) return;

    setActionLoading({ id, action: "cancel" });
    try {
      await appointmentsAPI.cancel(id, { reason });
      toast.success("Appointment cancelled");
      loadAppointments();
    } catch (error: any) {
      toast.error("Failed to cancel appointment");
    } finally {
      setActionLoading(null);
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
    <DashboardLayout role="doctor">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Appointments
          </h1>
          <p className="text-gray-600">
            Manage your patient appointments
          </p>
        </div>

        {/* Filter */}
        <Card className="mb-4 border-0 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Filter:</span>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
              <p className="text-gray-600">
                {dateFilter === "all"
                  ? "You don't have any appointments yet"
                  : `No appointments for ${dateFilter}`}
              </p>
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
                onConfirm={handleConfirm}
                onComplete={handleComplete}
                onCancel={handleCancel}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Complete Appointment
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Patient: <strong>{selectedAppointment.patient?.name}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Date: <strong>{formatDate(selectedAppointment.appointment_date)}</strong> at{" "}
                  <strong>{selectedAppointment.time_slot.substring(0, 5)}</strong>
                </p>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="notes">Prescription / Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    rows={5}
                    placeholder="Enter prescription, advice, or follow-up instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowNotesModal(false)}
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleCompleteConfirm}
                    disabled={actionLoading?.id === selectedAppointment.id}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {actionLoading?.id === selectedAppointment.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      "Complete Appointment"
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
  onConfirm,
  onComplete,
  onCancel,
  actionLoading,
}: {
  appointment: Appointment;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  onConfirm: (id: number) => void;
  onComplete: (id: number) => void;
  onCancel: (id: number) => void;
  actionLoading: { id: number; action: string } | null;
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
                  {appointment.patient?.name}
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
              </div>

              {appointment.reason && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Reason for visit:</p>
                  <p className="text-sm text-gray-700">{appointment.reason}</p>
                </div>
              )}

              {appointment.notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1 font-medium">Prescription / Notes:</p>
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

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Join Call button for video appointments */}
            {appointment.appointment_type === "video" && 
             (appointment.status === "pending" || appointment.status === "confirmed") && (
              <a
                href={`/doctor/video-call/${appointment.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <Video className="w-4 h-4" />
                Join Call
              </a>
            )}

            {appointment.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onConfirm(appointment.id)}
                  disabled={actionLoading?.id === appointment.id}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {actionLoading?.id === appointment.id && actionLoading?.action === "confirm" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(appointment.id)}
                  disabled={actionLoading?.id === appointment.id}
                  className="text-red-600 hover:text-red-700"
                >
                  {actionLoading?.id === appointment.id && actionLoading?.action === "cancel" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Cancel"
                  )}
                </Button>
              </>
            )}

            {appointment.status === "confirmed" && (
              <Button
                size="sm"
                onClick={() => onComplete(appointment.id)}
                disabled={actionLoading?.id === appointment.id}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {actionLoading?.id === appointment.id && actionLoading?.action === "complete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Complete"
                )}
              </Button>
            )}
          </div>
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
