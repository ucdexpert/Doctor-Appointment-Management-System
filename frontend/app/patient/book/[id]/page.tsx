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
import { Calendar, Clock, MapPin, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function BookAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reason, setReason] = useState("");

  // Get min date (today) in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

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
      setAvailableSlots(response.data.slots || []);
      setSelectedSlot(""); // Reset selected slot when date changes
    } catch (error: any) {
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
      <div className="max-w-4xl">
        {/* Back Button */}
        <Link href={`/patient/doctors/${doctorId}`}>
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Doctor Info Sidebar */}
          <div className="md:col-span-1">
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {doctor.user?.name?.charAt(0) || "D"}
                </div>
                <CardTitle className="text-center text-lg">
                  {doctor.user?.name}
                </CardTitle>
                <CardDescription className="text-center">
                  {doctor.specialization}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{doctor.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
                  <span className="font-medium">PKR</span>
                  <span>{doctor.consultation_fee}</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Consultation fee payable at clinic
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="md:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Book Appointment
                </CardTitle>
                <CardDescription>
                  Select a date and time slot for your visit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-5">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Select Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={today}
                      className="h-11"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Select a future date for your appointment
                    </p>
                  </div>

                  {/* Time Slot Selection */}
                  {selectedDate && (
                    <div className="space-y-2">
                      <Label>Select Time Slot *</Label>
                      {slotsLoading ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                          <p className="text-sm text-gray-600 mt-2">Loading available slots...</p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                          <Clock className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600">No available slots for this date</p>
                          <p className="text-sm text-gray-500 mt-1">Please select another date</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`
                                py-2 px-3 rounded-lg text-sm font-medium transition-all
                                ${selectedSlot === slot
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }
                              `}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reason for Visit */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Visit (Optional)</Label>
                    <textarea
                      id="reason"
                      rows={3}
                      placeholder="Briefly describe your symptoms or reason for visit..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Booking Summary */}
                  {selectedDate && selectedSlot && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Ready to Book</span>
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Date:</strong> {selectedDate}</p>
                        <p><strong>Time:</strong> {selectedSlot}</p>
                        <p><strong>Doctor:</strong> {doctor.user?.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-lg"
                    disabled={bookingLoading || !selectedDate || !selectedSlot}
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      "Confirm Appointment"
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By booking, you agree to our terms and conditions
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
