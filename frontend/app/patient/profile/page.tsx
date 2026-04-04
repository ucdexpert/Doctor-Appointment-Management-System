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
  ChevronRight,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    : "";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <DashboardLayout role="patient">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* ── Profile Header Card ── */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-lg"
        >
          {/* Gradient Header */}
          <div className="h-36 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
            />
          </div>

          <div className="p-6 -mt-20 relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Photo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group shrink-0"
              >
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={user?.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                {/* Camera overlay */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Camera className="w-7 h-7 text-white" />
                </label>
                {/* Online indicator */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-lg border-3 border-white shadow-md"
                />
              </motion.div>

              {/* Name + Email */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user?.name}
                  </h2>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-lg"
                  >
                    <Sparkles className="w-3 h-3" />
                    Patient
                  </motion.span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <motion.label
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer transition-all shadow-sm hover:shadow-md"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </motion.label>
                  {user?.photo_url && (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-sm font-medium text-red-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </motion.button>
                  )}
                </div>

                {/* File preview */}
                <AnimatePresence>
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-blue-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleUploadPhoto}
                          disabled={uploadingPhoto}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all"
                        >
                          {uploadingPhoto ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )}
                          {uploadingPhoto ? "Uploading..." : "Save"}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Personal Information ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg"
              >
                <User className="w-5 h-5 text-white" />
              </motion.div>
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
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="pl-16 h-12 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="pl-16 h-12 text-sm bg-gray-50 rounded-xl"
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
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-md">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <Input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="pl-16 h-12 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Account info row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Account Type</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">
                    {user?.role}
                  </p>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Member Since</p>
                  <p className="text-sm font-bold text-gray-900">
                    {joinDate}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Save */}
            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold h-12 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/30 disabled:shadow-none transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* ── Security ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg"
              >
                <Lock className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Security</h3>
                <p className="text-sm text-gray-500">
                  Manage your password and account security
                </p>
              </div>
            </div>
            {!showPasswordForm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPasswordForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showPasswordForm ? (
              <motion.form
                key="password-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handlePasswordChange}
                className="p-6 space-y-4 max-w-lg"
              >
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
                      className="pl-11 h-11 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
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
                        className="pl-11 h-11 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
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
                        className="pl-11 h-11 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold h-11 rounded-xl shadow-md hover:shadow-lg disabled:shadow-none transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 h-11 transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="security-locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 flex flex-col items-center justify-center text-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-xl"
                >
                  <Lock className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Your account is secured with a password
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Regular password changes help keep your account safe
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Change Password <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Danger Zone ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl border border-red-200 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-red-100">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-lg"
              >
                <AlertTriangle className="w-5 h-5 text-white" />
              </motion.div>
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                logout();
                toast.success("Logged out successfully");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
