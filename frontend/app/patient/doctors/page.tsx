"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { doctorsAPI } from "@/lib/api";
import { Doctor } from "@/types";
import {
  Search,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  SlidersHorizontal,
  X,
  Stethoscope,
  Loader2,
  User,
  Heart,
  BookmarkPlus,
  Sparkles,
  ChevronDown,
  Check,
  Wallet,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

// ─── Constants ───────────────────────────────────────────────────────────────

const SPECIALTIES = [
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

const CITIES = [
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

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated", icon: Star },
  { value: "experience", label: "Most Experienced", icon: Award },
  { value: "fee", label: "Lowest Fee", icon: Wallet },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("/")) {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${photoUrl}`;
  }
  return photoUrl;
}

function formatFee(fee: string): string {
  return Number(fee).toLocaleString("en-PK");
}

// ─── Doctor Card ─────────────────────────────────────────────────────────────

function DoctorCard({ doctor, index }: { doctor: Doctor; index: number }) {
  const photoUrl = getPhotoUrl(doctor.user?.photo_url);
  const rating = parseFloat(doctor.avg_rating?.toString() || "0");
  const roundedRating = Math.round(rating);

  return (
    <div
      className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden"
      style={{
        animation: "fadeSlideUp 0.5s ease-out both",
        animationDelay: `${index * 0.07}s`,
      }}
    >
      {/* Top gradient accent */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-5">
        {/* Header: Avatar + Name */}
        <div className="flex items-start gap-3.5 mb-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={doctor.user?.name || "Doctor"}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold ring-2 ring-indigo-100">
                {doctor.user?.name?.charAt(0) || "D"}
              </div>
            )}
            {/* Favorite indicator */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-500 text-gray-400">
              <BookmarkPlus className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-[15px] truncate leading-tight">
              Dr. {doctor.user?.name}
            </h3>
            <Badge variant="outline" className="mt-1.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 border-indigo-100">
              <Stethoscope className="w-3 h-3 mr-1" />
              {doctor.specialization}
            </Badge>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= roundedRating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-gray-100 text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">
            ({doctor.total_reviews} review{doctor.total_reviews !== 1 ? "s" : ""})
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-2.5 mb-5">
          {doctor.city && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span>{doctor.city}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span>{doctor.experience_years} years experience</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
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

        {/* Bio */}
        {doctor.bio && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
            {doctor.bio}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/patient/doctors/${doctor.id}`}
            className="flex-1"
          >
            <button className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow">
              View Profile
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
          <Link href={`/patient/book/${doctor.id}`}>
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors">
              Book
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Chip ─────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
      }`}
    >
      {label}
      {active && <Check className="w-3 h-3" />}
    </button>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-1.5 bg-gray-200" />
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-5 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          <div className="h-10 w-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function DoctorsEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 text-center"
      style={{ animation: "fadeSlideUp 0.5s ease-out both" }}
    >
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
        <Search className="w-10 h-10 text-indigo-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        No doctors found
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        We couldn't find any doctors matching your criteria. Try adjusting your search or filters.
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        <X className="w-4 h-4" />
        Clear All Filters
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [specialization, setSpecialization] = useState("");
  const [city, setCity] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  // ── Inject animation keyframes ────────────────────────────────────────────

  useEffect(() => {
    const id = "doctors-animations";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ── Load doctors ──────────────────────────────────────────────────────────

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: 1,
        limit: 50,
      };
      if (specialization) params.specialization = specialization;
      if (city) params.city = city;
      if (minFee) params.min_fee = minFee;
      if (maxFee) params.max_fee = maxFee;
      if (sortBy) params.sort_by = sortBy;

      const response = await doctorsAPI.getAll(params);
      setDoctors(response.data.doctors);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [specialization, city, minFee, maxFee, sortBy]);

  // ── Filtered results ──────────────────────────────────────────────────────

  const filteredDoctors = useMemo(() => {
    let results = [...doctors];

    // Client-side search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (d) =>
          d.user?.name?.toLowerCase().includes(term) ||
          d.specialization.toLowerCase().includes(term)
      );
    }

    return results;
  }, [doctors, searchTerm]);

  // ── Active filter count ───────────────────────────────────────────────────

  const activeFilterCount = [specialization, city, minFee, maxFee].filter(Boolean).length;

  // ── Reset all ─────────────────────────────────────────────────────────────

  const clearAll = () => {
    setSearchTerm("");
    setSpecialization("");
    setCity("");
    setMinFee("");
    setMaxFee("");
    setSortBy("rating");
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout role="patient">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Find Doctors</h1>
            <p className="text-sm text-gray-500">
              Search and book appointments with top doctors
            </p>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-sm border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Expanded Filters ── */}
          {showFilters && (
            <div
              className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              style={{ animation: "fadeSlideUp 0.3s ease-out both" }}
            >
              {/* Specialization */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                >
                  <option value="">All Specializations</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Range */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Min Fee (PKR)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minFee}
                    onChange={(e) => setMinFee(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Max Fee
                  </label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={maxFee}
                    onChange={(e) => setMaxFee(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Specialty Filter ── */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="All"
              active={!specialization}
              onClick={() => setSpecialization("")}
            />
            {SPECIALTIES.map((spec) => (
              <FilterChip
                key={spec}
                label={spec}
                active={specialization === spec}
                onClick={() => setSpecialization(specialization === spec ? "" : spec)}
              />
            ))}
          </div>
        </div>

        {/* ── Results Header ── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filteredDoctors.length}</span>{" "}
            doctor{filteredDoctors.length !== 1 ? "s" : ""} found
            {searchTerm && (
              <span className="text-indigo-600">
                {" "}for "{searchTerm}"
              </span>
            )}
          </p>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <DoctorsEmptyState onClear={clearAll} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} index={i} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
