"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { doctorsAPI } from "@/lib/api";
import { Doctor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Clock, Calendar, Filter, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const specializations = [
  "All Specializations",
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
  "All Cities",
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

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    specialization: "",
    city: "",
    min_fee: "",
    max_fee: "",
    sort_by: "rating",
  });

  useEffect(() => {
    loadDoctors();
  }, [filters]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      
      if (filters.specialization && filters.specialization !== "All Specializations") {
        params.specialization = filters.specialization;
      }
      if (filters.city && filters.city !== "All Cities") {
        params.city = filters.city;
      }
      if (filters.min_fee) {
        params.min_fee = filters.min_fee;
      }
      if (filters.max_fee) {
        params.max_fee = filters.max_fee;
      }
      if (filters.sort_by) {
        params.sort_by = filters.sort_by;
      }

      const response = await doctorsAPI.getAll(params);
      setDoctors(response.data);
    } catch (error: any) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDoctors();
  };

  const resetFilters = () => {
    setFilters({
      specialization: "",
      city: "",
      min_fee: "",
      max_fee: "",
      sort_by: "rating",
    });
    setSearchTerm("");
  };

  const filteredDoctors = doctors.filter(doctor => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const doctorName = doctor.user?.name?.toLowerCase() || "";
    const specialization = doctor.specialization.toLowerCase();
    return doctorName.includes(searchLower) || specialization.includes(searchLower);
  });

  return (
    <DashboardLayout role="patient">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Find Doctors
          </h1>
          <p className="text-gray-600">
            Search and book appointments with top doctors
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-4 border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by doctor name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </form>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Select
                    value={filters.specialization || "All Specializations"}
                    onValueChange={(value) => setFilters({ ...filters, specialization: value === "All Specializations" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={filters.city || "All Cities"}
                    onValueChange={(value) => setFilters({ ...filters, city: value === "All Cities" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label>Min Fee (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.min_fee}
                    onChange={(e) => setFilters({ ...filters, min_fee: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Fee (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={filters.max_fee}
                    onChange={(e) => setFilters({ ...filters, max_fee: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={filters.sort_by}
                    onValueChange={(value) => setFilters({ ...filters, sort_by: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="fee">Fee (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                  <Button variant="outline" onClick={resetFilters} className="gap-2">
                    <X className="w-4 h-4" />
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading doctors...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <Button onClick={resetFilters} variant="outline">
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(parseFloat(rating.toString()))
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">
          ({doctor.total_reviews})
        </span>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
            {doctor.user?.name?.charAt(0) || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              {doctor.user?.name}
            </h3>
            <p className="text-sm text-blue-600 font-medium">
              {doctor.specialization}
            </p>
            {renderStars(parseFloat(doctor.avg_rating.toString()) || 0)}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{doctor.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{doctor.experience_years} years experience</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">PKR</span>
            <span>{doctor.consultation_fee} consultation</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/patient/doctors/${doctor.id}`}
            className="flex-1 text-center"
          >
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
              View Profile
            </Button>
          </Link>
          <Link href={`/patient/book/${doctor.id}`}>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Book Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
