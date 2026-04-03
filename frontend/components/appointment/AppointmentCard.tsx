"use client";

import { Appointment } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/appointment/StatusBadge";
import { Calendar, Clock, User, FileText, Loader2, Star, Download } from "lucide-react";
import { toast } from "sonner";

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
  isCancelling?: boolean;
  showActions?: boolean;
}

export default function AppointmentCard({
  appointment,
  onCancel,
  onReview,
  isCancelling = false,
  showActions = true,
}: AppointmentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const downloadPrescription = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/appointments/${appointment.id}/prescription-pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download prescription');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${appointment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Prescription downloaded successfully!");
    } catch (error) {
      console.error("Failed to download prescription:", error);
      toast.error("Failed to download prescription");
    }
  };

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
                  {appointment.doctor?.user?.name || "Doctor"}
                </h3>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(appointment.appointment_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatTime(appointment.time_slot)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>
                    {appointment.patient?.name || "Patient"}
                  </span>
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
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-blue-600 font-medium">
                      Doctor's Notes / Prescription:
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={downloadPrescription}
                      className="h-6 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download PDF
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}

              {appointment.cancel_reason && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600 mb-1 font-medium">
                    Cancellation Reason:
                  </p>
                  <p className="text-sm text-gray-700">
                    {appointment.cancel_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-col gap-2 shrink-0">
              {/* Cancel Button - Only for pending/confirmed */}
              {(appointment.status === "pending" ||
                appointment.status === "confirmed") &&
                onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(appointment)}
                    disabled={isCancelling}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                )}

              {/* Review Button - Only for completed */}
              {appointment.status === "completed" && onReview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(appointment)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Write Review
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
