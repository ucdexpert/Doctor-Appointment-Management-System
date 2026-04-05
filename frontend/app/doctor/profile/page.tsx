"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, MapPin, BookOpen, Briefcase, FileText, Camera, X, Phone, Building2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { doctorsAPI, uploadAPI, authAPI, doctorProfileAPI } from "@/lib/api";

// Dynamically import Leaflet to avoid SSR issues
import { useMapEvents } from "react-leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

const specializations = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Orthopedic",
  "Neurologist",
  "Gynecologist",
  "Pediatrician",
  "ENT Specialist",
  "Eye Specialist",
  "Psychiatrist",
  "Urologist",
  "Gastroenterologist",
];

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
];

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DoctorProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    specialization: "",
    qualification: "",
    experience_years: 0,
    consultation_fee: 0,
    bio: "",
    city: "",
    clinic_name: "",
    clinic_address: "",
    clinic_latitude: 0,
    clinic_longitude: 0,
    clinic_landline: "",
  });

  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      clinic_latitude: lat,
      clinic_longitude: lng,
    }));
    toast.success("Location selected! Coordinates updated.");
  };

  const handleLocationPick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            clinic_latitude: position.coords.latitude,
            clinic_longitude: position.coords.longitude,
          }));
          toast.success("Location detected!");
        },
        (error) => {
          toast.error("Unable to get location. Please click on the map or enter address manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  // Redirect if not doctor
  if (!isLoading && (!isAuthenticated || user?.role !== 'doctor')) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.specialization || !formData.qualification || !formData.city) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.clinic_name || !formData.clinic_address) {
      toast.error("Please provide clinic name and address");
      return;
    }

    setLoading(true);

    try {
      await doctorProfileAPI.create(formData);

      toast.success("Profile submitted for approval! Admin will review shortly.");
      router.push("/doctor/dashboard");
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to create profile";
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
      if (!file.type.startsWith('image/')) {
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
      updateUser(response.data.user);

      toast.success("Profile photo uploaded successfully");
      setShowPhotoModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
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
      updateUser({ ...user, photo_url: null } as any);
      toast.success("Profile photo removed");
    } catch (error: any) {
      toast.error("Failed to remove photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="doctor">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Add your professional details to start receiving appointments
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>
              This information will be visible to patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile Photo Section */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                {user?.photo_url && user.photo_url !== 'loading' && !imageError ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500">
                    <img
                      src={user.photo_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${user.photo_url}` : user.photo_url}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "D"}
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

              {/* Specialization */}
              <div className="space-y-2">
                <Label htmlFor="specialization" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Specialization *
                </Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Qualification */}
              <div className="space-y-2">
                <Label htmlFor="qualification" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Qualification *
                </Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="qualification"
                    placeholder="MBBS, MD, etc."
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              {/* Experience & Fee */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Experience (Years)
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee" className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">PKR</span>
                    Consultation Fee *
                  </Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: parseInt(e.target.value) || 0 })}
                    className="h-11"
                    required
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  City *
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  About You
                </Label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Write a brief description about yourself, your expertise, and your approach..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Clinic Location Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Clinic Location Details *
                  </h3>
                  <p className="text-sm text-gray-600">
                    Provide your clinic details so patients can find and visit you easily
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Clinic Name */}
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Clinic/Hospital Name *
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="clinic_name"
                        placeholder="e.g., City Heart Clinic"
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Clinic Address */}
                  <div className="space-y-2">
                    <Label htmlFor="clinic-address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Complete Clinic Address *
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="clinic-address"
                        placeholder="Street, Area, City"
                        value={formData.clinic_address}
                        onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
                        className="pl-10 pr-24 h-11"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLocationPick}
                        className="absolute right-2 top-1/2 -translate-y-1/2 gap-1 h-8"
                      >
                        <Navigation className="w-4 h-4" />
                        <span className="hidden sm:inline">Use My Location</span>
                      </Button>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Clinic Location on Map
                    </Label>
                    <div className="w-full h-80 rounded-xl overflow-hidden border-2 border-gray-300">
                      <MapContainer
                        center={[formData.clinic_latitude || 24.8607, formData.clinic_longitude || 67.0011]}
                        zoom={formData.clinic_latitude ? 15 : 12}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                        {(formData.clinic_latitude !== 0 || formData.clinic_longitude !== 0) && (
                          <Marker position={[formData.clinic_latitude, formData.clinic_longitude]}>
                            <Popup>
                              <div className="text-center">
                                <p className="font-bold">{formData.clinic_name || "Clinic Location"}</p>
                                {formData.clinic_address && (
                                  <p className="text-sm text-gray-600 mt-1">{formData.clinic_address}</p>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      💡 Click on the map to set your clinic location
                    </p>
                  </div>

                  {/* Coordinates Display */}
                  {(formData.clinic_latitude !== 0 || formData.clinic_longitude !== 0) && (
                    <div className="grid sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="space-y-2">
                        <Label className="text-xs text-blue-700">Latitude</Label>
                        <p className="text-sm font-mono font-bold text-blue-900">
                          {formData.clinic_latitude.toFixed(6)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-blue-700">Longitude</Label>
                        <p className="text-sm font-mono font-bold text-blue-900">
                          {formData.clinic_longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clinic Landline */}
                  <div className="space-y-2">
                    <Label htmlFor="clinic_landline" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Clinic Landline/Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="clinic_landline"
                        placeholder="021-1234567 or +92 21 1234 5678"
                        value={formData.clinic_landline}
                        onChange={(e) => setFormData({ ...formData, clinic_landline: e.target.value })}
                        className="pl-10 h-11"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Optional: Provide your clinic phone number for patient inquiries</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Approval"
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Your profile will be reviewed by admin before going live
                </p>
              </div>
            </form>
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

                {previewUrl && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-blue-500">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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
