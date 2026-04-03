"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, Calendar, TrendingUp, Activity, CheckCircle, XCircle, Loader2, Mail, MapPin, DollarSign, Clock, BookOpen, LogOut } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { toast } from "sonner";
import EnhancedAnalytics from "@/components/admin/EnhancedAnalytics";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "doctors" | "users">("overview");

  // Mock data for enhanced analytics (replace with real API data)
  const appointmentsTrend = [
    { date: "Mon", count: 12 },
    { date: "Tue", count: 19 },
    { date: "Wed", count: 15 },
    { date: "Thu", count: 25 },
    { date: "Fri", count: 22 },
    { date: "Sat", count: 30 },
    { date: "Sun", count: 18 },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, doctorsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingDoctors()
      ]);
      setStats(statsRes.data);
      setPendingDoctors(doctorsRes.data);
    } catch (error: any) {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId: number) => {
    setActionLoading({ id: doctorId, action: "approve" });
    try {
      await adminAPI.approveDoctor(doctorId);
      toast.success("Doctor approved successfully!");
      loadData();
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
      await adminAPI.rejectDoctor(selectedDoctorId, { reason: rejectionReason });
      toast.success("Doctor rejected");
      setShowRejectModal(false);
      loadData();
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

  const statCards = [
    {
      title: "Total Patients",
      value: stats?.total_patients || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Doctors",
      value: stats?.total_doctors || 0,
      icon: UserCheck,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Today's Appointments",
      value: stats?.total_appointments_today || 0,
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Month Appointments",
      value: stats?.total_appointments_month || 0,
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
    },
  ];

  const chartData = stats?.popular_specializations?.map((spec: any) => ({
    name: spec.specialization.split(" ")[0],
    count: spec.count,
  })) || [];

  const pieData = stats?.popular_specializations?.slice(0, 5).map((spec: any, index: number) => ({
    name: spec.specialization.split(" ")[0],
    value: spec.count,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "overview" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </Button>
              <Button
                variant={activeTab === "doctors" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("doctors")}
              >
                Doctors
                {pendingDoctors.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">
                    {pendingDoctors.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("users")}
              >
                Users
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Admin</span>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Overview
                  </h1>
                  <p className="text-gray-600">
                    Platform statistics at a glance
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.title} className="border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                              <Icon className="w-6 h-6" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Enhanced Analytics */}
                {stats && (
                  <EnhancedAnalytics 
                    stats={stats} 
                    appointmentsData={appointmentsTrend} 
                  />
                )}

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Popular Specializations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartData.length === 0 ? (
                        <div className="text-center py-12">
                          <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No data available yet</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#666" fontSize={12} />
                            <YAxis stroke="#666" fontSize={12} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }} 
                            />
                            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Specializations Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pieData.length === 0 ? (
                        <div className="text-center py-12">
                          <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No data available yet</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={100}
                              innerRadius={60}
                              paddingAngle={5}
                              dataKey="value"
                              strokeWidth={3}
                              stroke="#fff"
                            >
                              {pieData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Registrations */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Recent Registrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats?.recent_registrations?.slice(0, 5).map((user: any) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                              <td className="py-3 px-4">
                                <Badge variant={user.role === "admin" ? "default" : user.role === "doctor" ? "default" : "secondary"}>
                                  {user.role.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Doctors Tab */}
            {activeTab === "doctors" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Doctor Approvals
                  </h1>
                  <p className="text-gray-600">
                    Review and approve pending doctors ({pendingDoctors.length} pending)
                  </p>
                </div>

                {pendingDoctors.length === 0 ? (
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
                    {pendingDoctors.map((doctor) => (
                      <Card key={doctor.id} className="border-0 shadow-md">
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
                                <Badge variant="secondary">Pending</Badge>
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
                                  onClick={() => handleApprove(doctor.id)}
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
                                  onClick={() => handleRejectClick(doctor.id)}
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
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Users Management</h3>
                <p className="text-gray-600">User management coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">Use /admin/users for full user management</p>
              </div>
            )}
          </>
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
