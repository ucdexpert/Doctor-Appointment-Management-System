"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { doctorsAPI, reviewsAPI } from "@/lib/api";
import { Doctor, Review } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Calendar, BookOpen, Briefcase, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [doctorRes, reviewsRes] = await Promise.all([
        doctorsAPI.getById(parseInt(doctorId)),
        reviewsAPI.getByDoctor(parseInt(doctorId))
      ]);
      
      setDoctor(doctorRes.data);
      setReviews(reviewsRes.data);
    } catch (error: any) {
      toast.error("Failed to load doctor profile");
      router.push("/patient/doctors");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="patient">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return null;
  }

  return (
    <DashboardLayout role="patient">
      <div className="max-w-5xl">
        {/* Back Button */}
        <Link href="/patient/doctors">
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Doctors
          </Button>
        </Link>

        {/* Profile Header */}
        <Card className="border-0 shadow-lg mb-6 overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Doctor Info */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0">
                    {doctor.user?.name?.charAt(0) || "D"}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {doctor.user?.name}
                    </h1>
                    <p className="text-lg text-blue-600 font-semibold mb-2">
                      {doctor.specialization}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(parseFloat(doctor.avg_rating.toString()))}
                      <span className="text-sm text-gray-600">
                        {doctor.avg_rating} ({doctor.total_reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{doctor.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <span>{doctor.experience_years} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">PKR</span>
                    <span>{doctor.consultation_fee} consultation</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span>{doctor.qualification}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link href={`/patient/book/${doctor.id}`} className="w-full">
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Appointment
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Instant confirmation
                </p>
              </div>
            </div>

            {/* About */}
            {doctor.bio && (
              <div className="mt-6 pt-6 border-t">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  About
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {doctor.bio}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Patient Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No reviews yet</p>
                <p className="text-sm">Be the first to review this doctor</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
            {review.patient?.name?.charAt(0) || "P"}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {review.patient?.name || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        {renderStars(review.rating)}
      </div>
      {review.comment && (
        <p className="text-gray-600 text-sm mt-2">
          {review.comment}
        </p>
      )}
    </div>
  );
}
