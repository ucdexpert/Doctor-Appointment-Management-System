"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { doctorsAPI, searchHistoryAPI } from "@/lib/api";
import { Doctor } from "@/types";
import DoctorCard from "@/components/doctor/DoctorCard";
import SearchHistorySection from "@/components/doctor/SearchHistorySection";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  DollarSign,
  SlidersHorizontal,
  X,
  Loader2,
  Stethoscope,
  Filter,
  ArrowUpDown,
} from "lucide-react";

// Specializations list
const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Endocrinologist",
  "Gastroenterologist",
  "General Physician",
  "Gynecologist",
  "Neurologist",
  "Oncologist",
  "Ophthalmologist",
  "Orthopedic",
  "Pediatrician",
  "Psychiatrist",
  "Pulmonologist",
  "Urologist",
];

const CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Hyderabad",
];

const SORT_OPTIONS = [
  { label: "Name A-Z", value: "name_asc" },
  { label: "Name Z-A", value: "name_desc" },
  { label: "Fee: Low to High", value: "fee_asc" },
  { label: "Fee: High to Low", value: "fee_desc" },
  { label: "Experience", value: "experience" },
  { label: "Rating", value: "rating" },
];

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization, selectedCity, minFee, maxFee, sortBy, page, search]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = { page };
      if (search) params.search = search;
      if (selectedSpecialization) params.specialization = selectedSpecialization;
      if (selectedCity) params.city = selectedCity;
      if (minFee) params.min_fee = minFee;
      if (maxFee) params.max_fee = maxFee;
      if (sortBy) params.sort = sortBy;

      const response = await doctorsAPI.getAll(params);
      const newDoctors = response.data.doctors || response.data;

      if (page === 1) {
        setDoctors(newDoctors);
        if (newDoctors.length === 0) {
          setError("no_results");
        }
      } else {
        setDoctors((prev) => [...prev, ...newDoctors]);
      }

      setHasMore(newDoctors.length === 10);
    } catch (error: any) {
      console.error("Failed to fetch doctors:", error);
      setError("server_error");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    
    // Save search history (non-blocking)
    if (search.trim()) {
      const filters = {
        specialization: selectedSpecialization || undefined,
        city: selectedCity || undefined,
        min_fee: minFee || undefined,
        max_fee: maxFee || undefined,
        sort: sortBy || undefined,
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if ((filters as Record<string, any>)[key] === undefined) {
          delete (filters as Record<string, any>)[key];
        }
      });
      
      searchHistoryAPI.save({
        search_query: search.trim(),
        filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
      }).catch(err => console.error("Failed to save search:", err));
    }
    
    // fetchDoctors will be called automatically due to useEffect dependency on search
  };

  const handleClearFilters = () => {
    setSelectedSpecialization("");
    setSelectedCity("");
    setMinFee("");
    setMaxFee("");
    setSortBy("");
    setPage(1);
    setSearch("");
  };

  const resetFilters = () => {
    handleClearFilters();
  };

  const activeFiltersCount = [selectedSpecialization, selectedCity, minFee, maxFee, sortBy, search].filter(Boolean).length;

  return (
    <DashboardLayout role="patient">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <Stethoscope className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Find a Doctor
              </h1>
              <p className="text-sm text-gray-600">
                Search from {doctors.length}+ verified doctors
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Search
            </motion.button>

            {/* Filter Toggle (Mobile) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden relative px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors"
            >
              <Filter className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Filters Sidebar (Desktop) */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`hidden md:block w-72 shrink-0 space-y-4`}
          >
            {/* Search History */}
            <SearchHistorySection 
              onSearchClick={(search) => {
                setSearch(search.search_query);
                if (search.filters) {
                  try {
                    const filters = JSON.parse(search.filters);
                    if (filters.specialization) setSelectedSpecialization(filters.specialization);
                    if (filters.city) setSelectedCity(filters.city);
                    if (filters.min_fee) setMinFee(filters.min_fee);
                    if (filters.max_fee) setMaxFee(filters.max_fee);
                    if (filters.sort) setSortBy(filters.sort);
                  } catch {
                    // Ignore parse errors
                  }
                }
                setPage(1);
              }}
            />
            
            <FiltersPanel
              selectedSpecialization={selectedSpecialization}
              setSelectedSpecialization={setSelectedSpecialization}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              minFee={minFee}
              setMinFee={setMinFee}
              maxFee={maxFee}
              setMaxFee={setMaxFee}
              sortBy={sortBy}
              setSortBy={setSortBy}
              resetFilters={resetFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </motion.aside>

          {/* Mobile Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
                onClick={() => setShowFilters(false)}
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25 }}
                  className="absolute left-0 top-0 h-full w-80 bg-white p-4 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <FiltersPanel
                    selectedSpecialization={selectedSpecialization}
                    setSelectedSpecialization={setSelectedSpecialization}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    minFee={minFee}
                    setMinFee={setMinFee}
                    maxFee={maxFee}
                    setMaxFee={setMaxFee}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    resetFilters={resetFilters}
                    activeFiltersCount={activeFiltersCount}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Doctors List */}
          <div className="flex-1">
            {loading && page === 1 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-80 bg-gray-200 animate-skeleton rounded-2xl"
                  />
                ))}
              </div>
            ) : error === "server_error" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-red-200"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6"
                >
                  <Stethoscope className="w-10 h-10 text-red-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Unable to Load Doctors
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We're having trouble connecting to our servers. Please check your connection and try again.
                </p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchDoctors}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Try Again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearFilters}
                    className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all"
                  >
                    Clear Filters
                  </motion.button>
                </div>
              </motion.div>
            ) : error === "no_results" || doctors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white rounded-3xl border border-gray-200"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6"
                >
                  <Stethoscope className="w-10 h-10 text-blue-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Doctors Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search criteria
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold"
                >
                  Reset Filters
                </motion.button>
              </motion.div>
            ) : (
              <>
                {/* Results Count */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{doctors.length}</span> doctors
                  </p>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear all filters
                    </button>
                  )}
                </div>

                {/* Doctors Grid */}
                <motion.div
                  layout
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence>
                    {doctors.map((doctor, index) => (
                      <DoctorCard key={doctor.id} doctor={doctor} index={index} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Load More */}
                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center mt-8"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                      className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More"
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Filters Panel Component
function FiltersPanel({
  selectedSpecialization,
  setSelectedSpecialization,
  selectedCity,
  setSelectedCity,
  minFee,
  setMinFee,
  maxFee,
  setMaxFee,
  sortBy,
  setSortBy,
  resetFilters,
  activeFiltersCount,
}: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">Filters</h3>
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Specialization */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Specialization
        </label>
        <select
          value={selectedSpecialization}
          onChange={(e) => setSelectedSpecialization(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
        >
          <option value="">All Specializations</option>
          {SPECIALIZATIONS.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          City
        </label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
        >
          <option value="">All Cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Fee Range */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Fee Range (PKR)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minFee}
            onChange={(e) => setMinFee(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
        >
          <option value="">Default</option>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
