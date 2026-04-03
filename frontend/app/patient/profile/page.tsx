"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, uploadAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Lock,
  Loader2,
  Camera,
  X,
  Shield,
  LogOut,
  Edit3,
  Check,
  ChevronRight,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Heart
} from "lucide-react";
import { toast } from "sonner";

export default function PatientProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);

  // Inject custom styles
  useEffect(() => {
    const id = "profile-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  // Sync profileData when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const getPhotoUrl = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith("/")) {
      return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${photoUrl}`;
    }
    return photoUrl;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authAPI.updateProfile(profileData);
      updateUser(response.data);
      setEditingPhone(false);
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail || "Failed to update profile"
          : "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await uploadAPI.profilePhoto(selectedFile);
      updateUser(response.data.user);
      toast.success("Profile photo updated");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail || "Failed to upload photo"
          : "Failed to upload photo";
      toast.error(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm("Remove your profile photo?")) return;
    setLoading(true);
    try {
      const response = await authAPI.updateProfile({ photo_url: null });
      updateUser(response.data);
      toast.success("Photo removed");
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail || "Failed to remove photo"
          : "Failed to remove photo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success("Password changed successfully");
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
      setShowPasswordForm(false);
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to change password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const photoUrl = getPhotoUrl(user?.photo_url);
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-PK", { month: "long", year: "numeric" })
    : "—";

  return (
    <DashboardLayout role="patient">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div 
          className="flex items-center gap-4"
          style={{ animation: "fadeSlideUp 0.5s ease-out both" }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* ── Profile + Photo Upload ── */}
        <div 
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}
        >
          {/* Gradient Header */}
          <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="p-6 -mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Photo */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={user?.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                {/* Camera overlay */}
                <label
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change photo"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Camera className="w-7 h-7 text-white" />
                </label>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-3 border-white shadow-md"></div>
              </div>

              {/* Name + Email */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user?.name}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md">
                    <Sparkles className="w-3 h-3" />
                    Patient
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <label
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer transition-all shadow-sm hover:shadow-md"
                  >
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  {user?.photo_url && (
                    <button
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-sm font-medium text-red-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                {selectedFile && (
                  <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-indigo-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-indigo-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUploadPhoto}
                        disabled={uploadingPhoto}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        {uploadingPhoto ? "Uploading..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Personal Information ── */}
        <div 
          className="bg-white rounded-2xl border border-gray-200 shadow-sm"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Personal Information
                </h3>
                <p className="text-sm text-gray-500">
                  Update your personal details and contact information
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleProfileUpdate} className="p-6 space-y-5">
            {/* Name */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="pl-14 h-12 text-sm rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="pl-14 h-12 text-sm bg-gray-50 rounded-xl"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <Input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="pl-14 h-12 text-sm rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Account info row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Account Type</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Member Since</p>
                  <p className="text-sm font-bold text-gray-900">
                    {joinDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Security ── */}
        <div 
          className="bg-white rounded-2xl border border-gray-200 shadow-sm"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Security</h3>
                <p className="text-sm text-gray-500">
                  Manage your password and account security
                </p>
              </div>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm ? (
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4 max-w-lg">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    value={passwordData.old_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, old_password: e.target.value })
                    }
                    className="pl-11 h-11 text-sm rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, new_password: e.target.value })
                      }
                      className="pl-11 h-11 text-sm rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      className="pl-11 h-11 text-sm rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm h-11 rounded-xl shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
                  }}
                  className="text-sm h-11 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Your account is secured with a password
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Regular password changes help keep your account safe
              </p>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Change Password <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <div 
          className="bg-white rounded-2xl border border-red-200 shadow-sm"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.4s both" }}
        >
          <div className="p-6 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                <p className="text-sm text-red-500">
                  Irreversible account actions
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Logout</p>
                <p className="text-xs text-gray-500">
                  Sign out of your account on this device
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                toast.success("Logged out successfully");
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-sm h-11 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
