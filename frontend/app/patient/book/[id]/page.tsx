"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { doctorsAPI, appointmentsAPI } from "@/lib/api";
import { Doctor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TimeSlotPicker from "@/components/appointment/TimeSlotPicker";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  ArrowLeft, 
  CheckCircle, 
  Loader2,
  Stethoscope,
  Star,
  User,
  Shield,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reason, setReason] = useState("");

  // Get min date (today) in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Inject custom styles
  useEffect(() => {
    const id = "booking-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    loadDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadDoctor = async () => {
    try {
      const response = await doctorsAPI.getById(parseInt(doctorId));
      setDoctor(response.data);
    } catch (error: any) {
      toast.error("Failed to load doctor details");
      router.push("/patient/doctors");
    }
  };

  const loadAvailableSlots = async () => {
    setSlotsLoading(true);
    try {
      const response = await doctorsAPI.getSlots(parseInt(doctorId), selectedDate);
      const slots: string[] = response.data.slots || [];
      // Convert string[] to TimeSlot[] format
      setAvailableSlots(
        slots.map((time) => ({ time, isAvailable: true }))
      );
      setSelectedSlot(""); // Reset selected slot when date changes
    } catch (error: unknown) {
      toast.error("Failed to load available slots");
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedSlot) {
      toast.error("Please select date and time slot");
      return;
    }

    setBookingLoading(true);
    try {
      await appointmentsAPI.create({
        doctor_id: parseInt(doctorId),
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        reason: reason || undefined,
      });

      toast.success("Appointment booked successfully!");
      router.push("/patient/appointments");
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to book appointment";
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  const formatFee = (fee: string | number) => {
    return Number(fee).toLocaleString("en-PK");
  };

  if (!doctor) {
    return (
      <DashboardLayout role="patient">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="patient">
      <div className="max-w-6xl mx-auto w-full">
        {/* ── Back Button ── */}
        <Link 
          href={`/patient/doctors/${doctorId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Profile
        </Link>

        {/* ── Page Header ── */}
        <div 
          className="mb-8"
          style={{ animation: "fadeSlideUp 0.5s ease-out both" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
              <p className="text-sm text-gray-500">
                Select a date and time slot for your visit
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Doctor Info Card ── */}
          <div 
            className="lg:col-span-1"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              {/* Gradient Header */}
              <div className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div 
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2"
                  style={{ animation: "pulse-ring 3s ease-in-out infinite" }}
                >
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                    {doctor.user?.name?.charAt(0) || "D"}
                  </div>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="pt-14 pb-6 px-6">
                <div className="text-center mb-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Dr. {doctor.user?.name}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-700">
                      {doctor.specialization}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-3 mb-5">
                  {doctor.city && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="truncate">{doctor.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <span>{doctor.experience_years} years experience</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-green-600">PKR</span>
                    </div>
                    <span>
                      <span className="font-semibold text-gray-900">
                        {formatFee(doctor.consultation_fee)}
                      </span>{" "}
                      consultation
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Consultation fee payable at clinic
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Booking Form ── */}
          <div 
            className="lg:col-span-2"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <form onSubmit={handleBooking} className="space-y-6">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Select Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={today}
                      className="h-12 text-sm border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 rounded-xl"
                      required
                    />
                  </div>
                  {selectedDate && (
                    <p className="text-xs text-indigo-600 font-medium">
                      {formatDate(selectedDate)}
                    </p>
                  )}
                </div>

                {/* Time Slot Selection */}
                {selectedDate && (
                  <div 
                    className="space-y-2"
                    style={{ animation: "fadeSlideUp 0.3s ease-out both" }}
                  >
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Select Time Slot <span className="text-red-500">*</span>
                    </Label>
                    {slotsLoading ? (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
                        <p className="text-sm text-gray-600 font-medium">Loading available slots...</p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">No available slots for this date</p>
                        <p className="text-sm text-gray-500 mt-1">Please select another date</p>
                      </div>
                    ) : (
                      <TimeSlotPicker
                        slots={availableSlots}
                        selectedSlot={selectedSlot}
                        onSelectSlot={setSelectedSlot}
                      />
                    )}
                  </div>
                )}

                {/* Reason for Visit */}
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Reason for Visit <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>
                  <textarea
                    id="reason"
                    rows={4}
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none text-sm transition-all"
                  />
                </div>

                {/* Booking Summary */}
                {selectedDate && selectedSlot && (
                  <div 
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5"
                    style={{ animation: "fadeSlideUp 0.3s ease-out both" }}
                  >
                    <div className="flex items-center gap-2 text-green-800 mb-3">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Ready to Book</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Time:</span>
                        <span className="font-medium">{selectedSlot}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Doctor:</span>
                        <span className="font-medium">Dr. {doctor.user?.name}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-green-200">
                        <span className="text-green-600">Fee:</span>
                        <span className="font-bold text-green-800">PKR {formatFee(doctor.consultation_fee)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-13 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={bookingLoading || !selectedDate || !selectedSlot}
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        Confirm Appointment
                        <ChevronRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    By booking, you agree to our terms and conditions
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
