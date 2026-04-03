"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doctorsAPI, reviewsAPI } from "@/lib/api";
import { Doctor, Review } from "@/types";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Star,
  Calendar,
  BookOpen,
  Briefcase,
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  User,
  Heart,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("/")) {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${photoUrl}`;
  }
  return photoUrl;
}

function formatFee(fee: string) {
  return Number(fee).toLocaleString("en-PK");
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-3 bg-gray-100 rounded w-1/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Info Card ───────────────────────────────────────────────────────────────

function InfoCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
      style={{ animation: "fadeSlideUp 0.3s ease-out both" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {review.patient?.name?.charAt(0) || "P"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {review.patient?.name || "Anonymous"}
            </p>
            <p className="text-[11px] text-gray-400">{timeAgo(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${
                s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DoctorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  // Inject animation
  useEffect(() => {
    const id = "profile-animations";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [doctorRes, reviewsRes] = await Promise.all([
        doctorsAPI.getById(parseInt(doctorId)),
        reviewsAPI.getByDoctor(parseInt(doctorId)),
      ]);
      setDoctor(doctorRes.data);
      setReviews(reviewsRes.data);
    } catch {
      toast.error("Failed to load doctor profile");
      router.push("/patient/doctors");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/patient/doctors")}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-900">Doctor Profile</span>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!doctor) return null;

  const photoUrl = getPhotoUrl(doctor.user?.photo_url);
  const rating = parseFloat(doctor.avg_rating?.toString() || "0");
  const roundedRating = Math.round(rating);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/patient/doctors")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Doctor Profile</h1>
              <p className="text-[11px] text-gray-400">{doctor.specialization}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        {/* ── Profile Header Card ── */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
        >
          {/* Gradient banner */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/5" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              <div className="relative shrink-0 -mt-16 sm:-mt-20">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={doctor.user?.name || "Doctor"}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                    {doctor.user?.name?.charAt(0) || "D"}
                  </div>
                )}
                {/* Online badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 sm:pt-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Dr. {doctor.user?.name}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      <Sparkles className="w-3 h-3" />
                      {doctor.specialization}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= roundedRating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-100 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({doctor.total_reviews})
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <InfoCard
                    icon={<MapPin className="w-4 h-4" />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    label="Location"
                    value={doctor.city || "—"}
                  />
                  <InfoCard
                    icon={<Briefcase className="w-4 h-4" />}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                    label="Experience"
                    value={`${doctor.experience_years} years`}
                  />
                  <InfoCard
                    icon={<span className="text-xs font-bold">PKR</span>}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    label="Consultation"
                    value={formatFee(doctor.consultation_fee)}
                  />
                  <InfoCard
                    icon={<BookOpen className="w-4 h-4" />}
                    iconBg="bg-amber-100"
                    iconColor="text-amber-600"
                    label="Qualification"
                    value={doctor.qualification || "—"}
                  />
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-5 border-t border-gray-100">
              <Link href={`/patient/book/${doctor.id}`} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md">
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </button>
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Instant confirmation
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                Free consultation
              </div>
            </div>
          </div>
        </div>

        {/* ── About ── */}
        {doctor.bio && (
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
            style={{ animation: "fadeSlideUp 0.5s ease-out both", animationDelay: "0.1s" }}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              About Dr. {doctor.user?.name}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
          </div>
        )}

        {/* ── Reviews ── */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
          style={{ animation: "fadeSlideUp 0.5s ease-out both", animationDelay: "0.2s" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900">
              Patient Reviews
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({reviews.length})
              </span>
            </h3>
            {doctor.total_reviews > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-amber-700">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                No reviews yet
              </p>
              <p className="text-xs text-gray-400">
                Be the first to review this doctor
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div key={review.id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
