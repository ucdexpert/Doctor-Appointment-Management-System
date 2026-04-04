"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { favoritesAPI } from "@/lib/api";
import { Doctor } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MapPin,
  Star,
  Loader2,
  Stethoscope,
  ArrowRight,
  Clock,
  Sparkles,
  SearchX,
  Bookmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
      setFavorites(favorites.filter((fav) => fav.doctor_id !== doctorId));
      toast.success("Removed from favorites");
    } catch (error) {
      toast.error("Failed to remove from favorites");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
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
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* ── Page Header ── */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl"
        >
          {/* Animated Background */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24"
          >
            <div className="absolute inset-0 bg-white/5 rounded-full animate-ping" />
          </motion.div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-5 h-5 text-pink-200 fill-pink-200" />
              </motion.div>
              <span className="text-sm font-medium text-rose-100">
                Your saved doctors
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold mb-3"
            >
              My Favorite Doctors
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-rose-100 max-w-xl mb-6"
            >
              Quick access to doctors you trust. Book appointments with your favorites in one click.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/patient/doctors">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 rounded-xl font-semibold text-sm hover:bg-rose-50 transition-all shadow-lg"
                >
                  <Stethoscope className="w-4 h-4" />
                  Browse More Doctors
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Stats Bar ── */}
        {!loading && favorites.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Bookmark className="w-4 h-4 text-pink-500" />
              Showing <span className="font-bold text-gray-900">{favorites.length}</span> favorite{favorites.length !== 1 ? "s" : ""}
            </div>
          </motion.div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-gray-200 animate-skeleton rounded-2xl"
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* ── Empty State ── */
          <motion.div
            variants={itemVariants}
            className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm"
          >
            <motion.div
              animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Heart className="w-10 h-10 text-pink-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Favorites Yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Start adding doctors to your favorites for quick access when you need them.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/patient/doctors")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              <SearchX className="w-4 h-4" />
              Find Doctors
            </motion.button>
          </motion.div>
        ) : (
          /* ── Favorites Grid ── */
          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {favorites.map((fav, index) => (
                <FavoriteDoctorCard
                  key={fav.id}
                  fav={fav}
                  index={index}
                  onRemove={removeFavorite}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}

// ─── Favorite Doctor Card ──────────────────────────────────────────────────

function FavoriteDoctorCard({
  fav,
  index,
  onRemove,
}: {
  fav: FavoriteDoctor;
  index: number;
  onRemove: (doctorId: number) => void;
}) {
  const router = useRouter();
  const doctor = fav.doctor;
  const addedDate = new Date(fav.created_at).toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500" />

      <div className="p-6">
        {/* Header with favorite button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg"
            >
              <Stethoscope className="w-6 h-6" />
            </motion.div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                {doctor.specialization}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Added {addedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <FavoriteButton doctorId={fav.doctor_id} size="md" />
          </div>
        </div>

        {/* Doctor Details */}
        <div className="space-y-3">
          {/* Qualification */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span>{doctor.qualification}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span>{doctor.city || "Location not specified"}</span>
          </div>

          {/* Experience */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span>{doctor.experience_years} years experience</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            </div>
            <span>
              {doctor.avg_rating || "0"} ({doctor.total_reviews || 0} reviews)
            </span>
          </div>
        </div>

        {/* Fee */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Consultation Fee</p>
            <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              PKR {doctor.consultation_fee}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/patient/book/${fav.doctor_id}`)}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all"
          >
            Book Now
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/patient/doctors/${fav.doctor_id}`)}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-pink-300 hover:text-pink-600 transition-all"
          >
            Profile
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
