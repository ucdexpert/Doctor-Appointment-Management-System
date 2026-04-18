"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VideoConsultation from "@/components/video/VideoConsultation";
import { appointmentsAPI } from "@/lib/api";
import { Appointment } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Fetch appointment details
      const response = await fetch(`${API_URL}/appointments/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load appointment");
      }

      const appointments = await response.json();
      const found = appointments.find(
        (apt: Appointment) => apt.id === parseInt(appointmentId)
      );

      if (!found) {
        // Try doctor appointments
        const doctorResponse = await fetch(`${API_URL}/appointments/doctor`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!doctorResponse.ok) {
          throw new Error("Appointment not found");
        }

        const doctorAppointments = await doctorResponse.json();
        const doctorFound = doctorAppointments.find(
          (apt: Appointment) => apt.id === parseInt(appointmentId)
        );

        if (!doctorFound) {
          setError("Appointment not found");
          setLoading(false);
          return;
        }

        setAppointment(doctorFound);
      } else {
        setAppointment(found);
      }
    } catch (error) {
      console.error("Failed to load appointment:", error);
      setError("Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async (duration: number) => {
    toast.success(`Video consultation completed. Duration: ${Math.floor(duration / 60)} minutes`);
    
    // Refresh appointment data
    setTimeout(() => {
      loadAppointment();
    }, 1000);
  };

  const handleJoinCall = async () => {
    toast.info("Connecting to video consultation...");
  };

  if (loading) {
    return (
      <DashboardLayout role="patient">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video consultation...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !appointment) {
    return (
      <DashboardLayout role="patient">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || "Appointment Not Found"}
            </h2>
            <p className="text-gray-600 mb-6">
              Unable to load the video consultation. Please try again.
            </p>
            <Button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPatient = user.role === "patient";

  return (
    <DashboardLayout role={isPatient ? "patient" : "doctor"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={isPatient ? "/patient/appointments" : "/doctor/appointments"}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors mb-4 sm:mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Back to Appointments</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Video Consultation
          </h1>
          <p className="text-sm sm:text-base text-gray-600 truncate">
            {isPatient
              ? `Dr. ${appointment.doctor?.user?.name}`
              : appointment.patient?.name}
          </p>
          <div className="flex items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              📅 {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">🕐 {appointment.time_slot.substring(0, 5)}</span>
          </div>
        </div>

        {/* Video Consultation Component */}
        <VideoConsultation
          appointmentId={appointment.id}
          userName={isPatient ? user.name : appointment.doctor?.user?.name || "Doctor"}
          userEmail={user.email}
          userRole={isPatient ? "patient" : "doctor"}
          onStartCall={handleJoinCall}
          onEndCall={handleEndCall}
        />
      </div>
    </DashboardLayout>
  );
}
