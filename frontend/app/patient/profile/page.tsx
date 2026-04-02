"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, uploadAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Lock, Loader2, Camera, X } from "lucide-react";
import { toast } from "sonner";

export default function PatientProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    photo_url: user?.photo_url || "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.updateProfile(profileData);
      
      // Update localStorage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await uploadAPI.profilePhoto(selectedFile);
      const photoUrl = response.data.photo_url;
      
      // Update user context with the actual photo URL from backend
      const updatedUser = { ...user, photo_url: photoUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success("Profile photo uploaded successfully");
      setShowPhotoModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Reload page to fetch updated user data
      window.location.reload();
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to upload photo";
      toast.error(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    setLoading(true);
    try {
      await authAPI.updateProfile({ photo_url: null });
      
      const updatedUser = { ...user, photo_url: null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success("Profile photo removed");
      window.location.reload();
    } catch (error: any) {
      toast.error("Failed to remove photo");
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

  return (
    <DashboardLayout role="patient">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Information Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                {user?.photo_url && user.photo_url !== 'loading' ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500">
                    <img
                      src={user.photo_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${user.photo_url}` : user.photo_url}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="space-y-2">
                  <Button type="button" variant="outline" size="sm" onClick={handlePhotoClick} className="gap-2">
                    <Camera className="w-4 h-4" />
                    Change Photo
                  </Button>
                  {user?.photo_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                      Remove Photo
                    </Button>
                  )}
                  <p className="text-xs text-gray-500">JPG, PNG, WebP (Max 5MB)</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10 h-11 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="role"
                      value={user?.role?.toUpperCase() || ""}
                      disabled
                      className="pl-10 h-11 bg-gray-50 capitalize"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Change your password
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                <Lock className="w-4 h-4 mr-2" />
                {showPasswordForm ? "Cancel" : "Change Password"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showPasswordForm ? (
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="old_password">Current Password</Label>
                  <Input
                    id="old_password"
                    type="password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Click "Change Password" to update your password</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  toast.success("Logged out successfully");
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Lock className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Profile Photo
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select a photo to upload (JPG, PNG, WebP - Max 5MB)
                </p>

                {/* File Input */}
                <div className="mb-4">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                  >
                    <div className="text-center">
                      <Camera className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : "Click to select photo"}
                      </p>
                      {selectedFile && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </Label>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-blue-500">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPhotoModal(false);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadPhoto}
                    disabled={uploadingPhoto || !selectedFile}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Photo"
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
