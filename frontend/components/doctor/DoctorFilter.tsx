"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface DoctorFilters {
  specialization: string;
  city: string;
  min_fee: string;
  max_fee: string;
  sort_by: string;
}

interface DoctorFilterProps {
  onSearch: (searchTerm: string) => void;
  onFiltersChange: (filters: DoctorFilters) => void;
  filters: DoctorFilters;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

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

export default function DoctorFilter({
  onSearch,
  onFiltersChange,
  filters,
  searchTerm,
  onSearchTermChange,
}: DoctorFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const resetFilters = () => {
    const defaultFilters: DoctorFilters = {
      specialization: "",
      city: "",
      min_fee: "",
      max_fee: "",
      sort_by: "rating",
    };
    onFiltersChange(defaultFilters);
    onSearchTermChange("");
  };

  const handleFilterChange = (key: keyof DoctorFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  return (
    <Card className="mb-4 border-0 shadow-md">
      <CardContent className="p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by doctor name or specialization..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
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
                onValueChange={(value) =>
                  handleFilterChange(
                    "specialization",
                    value === "All Specializations" ? "" : value
                  )
                }
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
                onValueChange={(value) =>
                  handleFilterChange("city", value === "All Cities" ? "" : value)
                }
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
                onChange={(e) => handleFilterChange("min_fee", e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Fee (PKR)</Label>
              <Input
                type="number"
                placeholder="10000"
                value={filters.max_fee}
                onChange={(e) => handleFilterChange("max_fee", e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sort_by}
                onValueChange={(value) => handleFilterChange("sort_by", value)}
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
  );
}
