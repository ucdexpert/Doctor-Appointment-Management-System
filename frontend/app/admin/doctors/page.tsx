"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, Loader2, Mail, MapPin, DollarSign, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Doctor {
  id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: string;
  bio: string;
  city: string;
  is_approved: boolean;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminDoctorsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadPendingDoctors();
    }
  }, [user]);

  const loadPendingDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/admin/doctors/pending`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error: any) {
      toast.error("Failed to load pending doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId: number) => {
    setActionLoading({ id: doctorId, action: "approve" });
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/admin/doctors/${doctorId}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Doctor approved successfully!");
        loadPendingDoctors();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to approve doctor");
      }
    } catch (error: any) {
      toast.error("Failed to approve doctor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setShowRejectModal(true);
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!selectedDoctorId || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActionLoading({ id: selectedDoctorId, action: "reject" });
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/admin/doctors/${selectedDoctorId}/reject`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        toast.success("Doctor rejected");
        setShowRejectModal(false);
        loadPendingDoctors();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to reject doctor");
      }
    } catch (error: any) {
      toast.error("Failed to reject doctor");
    } finally {
      setActionLoading(null);
      setSelectedDoctorId(null);
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Doctor Approvals</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pending Doctor Approvals
          </h1>
          <p className="text-gray-600">
            Review and approve pending doctor registrations
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading pending doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600">No pending doctor approvals</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onApprove={handleApprove}
                onReject={handleRejectClick}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Reject Doctor Application
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for rejection:
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
                  <textarea
                    rows={4}
                    placeholder="e.g., Missing qualifications, Invalid documents, etc."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectConfirm}
                    disabled={actionLoading?.id === selectedDoctorId || !rejectionReason.trim()}
                    className="flex-1"
                  >
                    {actionLoading?.id === selectedDoctorId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      "Reject Application"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCard({
  doctor,
  onApprove,
  onReject,
  actionLoading,
}: {
  doctor: Doctor;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: { id: number; action: "approve" | "reject" } | null;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
            {doctor.user?.name?.charAt(0) || "D"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Dr. {doctor.user?.name}
                </h3>
                <p className="text-blue-600 font-medium">{doctor.specialization}</p>
              </div>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                Pending Approval
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{doctor.user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{doctor.city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>PKR {doctor.consultation_fee}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span>{doctor.qualification}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{doctor.experience_years} years</span>
              </div>
            </div>

            {doctor.bio && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1 font-medium">About:</p>
                <p className="text-sm text-gray-700 line-clamp-2">{doctor.bio}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => onApprove(doctor.id)}
                disabled={actionLoading?.id === doctor.id}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {actionLoading?.id === doctor.id && actionLoading?.action === "approve" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                onClick={() => onReject(doctor.id)}
                disabled={actionLoading?.id === doctor.id}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {actionLoading?.id === doctor.id && actionLoading?.action === "reject" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
