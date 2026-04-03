"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { favoritesAPI, doctorsAPI } from "@/lib/api";
import { Doctor } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Star, Loader2, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FavoriteButton from "@/components/shared/FavoriteButton";

interface FavoriteDoctor {
  id: number;
  doctor_id: number;
  created_at: string;
  doctor: Omit<Doctor, "user">;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesAPI.getMyFavorites();
      setFavorites(response.data);
    } catch (error) {
      console.error("Failed to load favorites");
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (doctorId: number) => {
    try {
      await favoritesAPI.remove(doctorId);
      setFavorites(favorites.filter(fav => fav.doctor_id !== doctorId));
      toast.success("Removed from favorites");
    } catch (error) {
      toast.error("Failed to remove from favorites");
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Favorite Doctors</h2>
            <p className="text-gray-600 mt-1">Quickly access doctors you frequently book</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/patient/doctors")}
          >
            <Stethoscope className="w-4 h-4 mr-2" />
            Browse More Doctors
          </Button>
        </div>

        {/* Favorites List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="ml-3 text-gray-600">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
            <p className="text-gray-600 mb-6">
              Start adding doctors to your favorites for quick access
            </p>
            <Button
              onClick={() => router.push("/patient/doctors")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Find Doctors
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <Card key={fav.id} className="p-6 hover:shadow-lg transition-all relative">
                {/* Favorite Button */}
                <div className="absolute top-4 right-4">
                  <FavoriteButton doctorId={fav.doctor_id} size="md" />
                </div>

                {/* Doctor Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {fav.doctor.specialization}
                    </h3>
                    <p className="text-sm text-gray-600">{fav.doctor.qualification}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{fav.doctor.city || "Location not specified"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Stethoscope className="w-4 h-4" />
                    <span>{fav.doctor.experience_years} years experience</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{fav.doctor.avg_rating || "0"} ({fav.doctor.total_reviews} reviews)</span>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-lg font-bold text-blue-600">
                      PKR {fav.doctor.consultation_fee}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                      onClick={() => router.push(`/patient/book/${fav.doctor_id}`)}
                    >
                      Book Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/patient/doctors/${fav.doctor_id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
