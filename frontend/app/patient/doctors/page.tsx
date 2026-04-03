"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { doctorsAPI, searchHistoryAPI } from "@/lib/api";
import { Doctor } from "@/types";
import DoctorCard from "@/components/doctor/DoctorCard";
import DoctorFilter from "@/components/doctor/DoctorFilter";
import SearchHistorySection from "@/components/doctor/SearchHistorySection";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";

interface DoctorFilters {
  specialization: string;
  city: string;
  min_fee: string;
  max_fee: string;
  sort_by: string;
}

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<DoctorFilters>({
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
      const params: Record<string, string | number> = {
        page: 1,
        limit: 50, // Load more to show client-side filtering
      };

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
      setDoctors(response.data.doctors);
    } catch (error: unknown) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    // Save to search history
    if (term.trim()) {
      try {
        await searchHistoryAPI.save({
          search_query: term,
          filters: JSON.stringify(filters)
        });
      } catch (error) {
        console.error("Failed to save search");
      }
    }
    
    loadDoctors();
  };

  const handleFiltersChange = (newFilters: DoctorFilters) => {
    setFilters(newFilters);
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

        {/* Search & Filters */}
        <DoctorFilter
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          filters={filters}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />

        {/* Search History */}
        <div className="mt-4">
          <SearchHistorySection />
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <LoadingSpinner text="Loading doctors..." />
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            icon="search"
            title="No doctors found"
            description="Try adjusting your search or filters"
          />
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
