"use client";

import { Doctor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const renderStars = (rating: number) => {
    const roundedRating = Math.round(parseFloat(rating.toString()));
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= roundedRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
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
          {doctor.user?.photo_url ? (
            <img
              src={doctor.user.photo_url.startsWith('/')
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${doctor.user.photo_url}`
                : doctor.user.photo_url}
              alt={doctor.user.name}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
              {doctor.user?.name?.charAt(0) || "D"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              Dr. {doctor.user?.name}
            </h3>
            <p className="text-sm text-blue-600 font-medium">
              {doctor.specialization}
            </p>
            {renderStars(parseFloat(doctor.avg_rating.toString()) || 0)}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {doctor.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{doctor.city}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{doctor.experience_years} years experience</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">PKR {doctor.consultation_fee}</span>
            <span>consultation</span>
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
