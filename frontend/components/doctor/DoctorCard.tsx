// "use client";

// import { Doctor } from "@/types";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { MapPin, Clock, Heart, Star, ExternalLink, Calendar } from "lucide-react";
// import Link from "next/link";
// import { useState, useEffect, useCallback, useMemo } from "react";
// import { motion } from "framer-motion";
// import { favoritesAPI } from "@/lib/api";
// import { toast } from "sonner";

// interface DoctorCardProps {
//   doctor: Doctor;
//   index?: number;
// }

// const DoctorCard = ({ doctor, index = 0 }: DoctorCardProps) => {
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [favoriteLoading, setFavoriteLoading] = useState(false);

//   useEffect(() => {
//     checkFavoriteStatus();
//   }, [doctor.id]);

//   const checkFavoriteStatus = useCallback(async () => {
//     try {
//       const response = await favoritesAPI.checkIfFavorited(doctor.id);
//       setIsFavorite(response.data.is_favorite);
//     } catch (error) {
//       // Silently fail
//     }
//   }, [doctor.id]);

//   const toggleFavorite = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setFavoriteLoading(true);
//     try {
//       if (isFavorite) {
//         await favoritesAPI.remove(doctor.id);
//         setIsFavorite(false);
//         toast.info("Removed from favorites");
//       } else {
//         await favoritesAPI.add(doctor.id);
//         setIsFavorite(true);
//         toast.success("Added to favorites! ❤️");
//       }
//     } catch (error: any) {
//       toast.error(error?.response?.data?.detail || "Failed to update favorites");
//     } finally {
//       setFavoriteLoading(false);
//     }
//   };

//   const renderStars = (rating: number) => {
//     const roundedRating = Math.round(parseFloat(rating.toString()));
//     const totalReviews = doctor.total_reviews || 0;
    
//     return (
//       <div className="flex items-center gap-1">
//         <div className="flex gap-0.5">
//           {[1, 2, 3, 4, 5].map((star) => (
//             <Star
//               key={star}
//               className={`w-4 h-4 ${
//                 star <= roundedRating
//                   ? "fill-yellow-400 text-yellow-400"
//                   : "fill-gray-200 text-gray-200"
//               }`}
//             />
//           ))}
//         </div>
//         <span className="text-sm font-medium text-gray-700">
//           {Number(doctor.avg_rating || 0).toFixed(1)}
//         </span>
//         <span className="text-sm text-gray-500">({totalReviews})</span>
//       </div>
//     );
//   };

//   const getPhotoUrl = () => {
//     if (!doctor.user?.photo_url) return null;
//     return doctor.user.photo_url.startsWith('/')
//       ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${doctor.user.photo_url}`
//       : doctor.user.photo_url;
//   };

//   const doctorName = doctor.user?.name || "Unknown";

//   // Avoid duplicate "Dr." prefix
//   const formattedName = doctorName.replace(/^Dr\.?\s*/i, "");

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: index * 0.08 }}
//       whileHover={{ y: -2 }}
//     >
//       <Card className="overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
//         <CardContent className="p-0">
//           {/* Header with Gradient */}
//           <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 pb-8 relative">
//             {/* Favorite Button */}
//             <motion.button
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               onClick={toggleFavorite}
//               disabled={favoriteLoading}
//               className={`absolute top-3 right-3 p-2 rounded-full ${
//                 isFavorite
//                   ? "bg-white/20 text-red-400"
//                   : "bg-white/10 text-white/70 hover:bg-white/20"
//               }`}
//             >
//               <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
//             </motion.button>

//             {/* Doctor Photo + Name */}
//             <div className="flex items-end gap-3">
//               {getPhotoUrl() ? (
//                 <img
//                   src={getPhotoUrl() || undefined}
//                   alt={formattedName}
//                   className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg"
//                 />
//               ) : (
//                 <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-blue-600 text-xl font-bold shadow-lg border-4 border-white">
//                   {formattedName.charAt(0).toUpperCase()}
//                 </div>
//               )}
//               <div className="pb-1 pr-12">
//                 <h3 className="font-bold text-white text-base leading-tight">
//                   Dr. {formattedName}
//                 </h3>
//                 <p className="text-blue-100 text-sm truncate">{doctor.specialization}</p>
//               </div>
//             </div>
//           </div>

//           {/* Body */}
//           <div className="p-4 pt-4 pb-5 -mt-4">
//             {/* White Card Overlay */}
//             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3">
//               {/* Rating */}
//               <div className="mb-3">
//                 {renderStars(parseFloat(doctor.avg_rating?.toString() || "0"))}
//               </div>

//               {/* Info Grid */}
//               <div className="grid grid-cols-2 gap-2">
//                 {doctor.city && (
//                   <div className="flex items-center gap-2 text-sm text-gray-600">
//                     <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
//                     <span className="truncate">{doctor.city}</span>
//                   </div>
//                 )}
//                 <div className="flex items-center gap-2 text-sm text-gray-600">
//                   <Clock className="w-4 h-4 text-gray-400 shrink-0" />
//                   <span>{doctor.experience_years} yrs</span>
//                 </div>
//               </div>

//               {/* Fee Row */}
//               <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
//                 <div className="flex items-center gap-2">
//                   <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
//                     PKR
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Consultation Fee</p>
//                     <p className="text-lg font-bold text-gray-900">
//                       {doctor.consultation_fee}
//                     </p>
//                   </div>
//                 </div>
//                 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
//                   <span className="w-2 h-2 bg-green-500 rounded-full" />
//                   Available
//                 </span>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-2">
//               <Link href={`/patient/book/${doctor.id}`} className="flex-1">
//                 <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 text-sm">
//                   <Calendar className="w-4 h-4 mr-1.5" />
//                   Book Now
//                 </Button>
//               </Link>
//               <Link href={`/patient/doctors/${doctor.id}`}>
//                 <Button variant="outline" className="h-10 w-10 p-0 border-gray-300 hover:border-blue-500 hover:text-blue-600">
//                   <ExternalLink className="w-4 h-4" />
//                 </Button>
//               </Link>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// }

// export default DoctorCard;




"use client";

import { Doctor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Heart, Star, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { favoritesAPI } from "@/lib/api";
import { toast } from "sonner";

interface DoctorCardProps {
  doctor: Doctor;
  index?: number;
}

const DoctorCard = ({ doctor, index = 0 }: DoctorCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [doctor.id]);

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const response = await favoritesAPI.checkIfFavorited(doctor.id);
      setIsFavorite(response.data.is_favorite);
    } catch {
      // Silently fail
    }
  }, [doctor.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoritesAPI.remove(doctor.id);
        setIsFavorite(false);
        toast.info("Removed from favorites");
      } else {
        await favoritesAPI.add(doctor.id);
        setIsFavorite(true);
        toast.success("Added to favorites! ❤️");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating);
    const totalReviews = doctor.total_reviews || 0;
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= roundedRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {Number(doctor.avg_rating || 0).toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">({totalReviews})</span>
      </div>
    );
  };

  const getPhotoUrl = () => {
    if (!doctor.user?.photo_url) return null;
    return doctor.user.photo_url.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${doctor.user.photo_url}`
      : doctor.user.photo_url;
  };

  const doctorName = (doctor.user?.name || "Unknown").replace(/^Dr\.?\s*/i, "");
  const photoUrl = getPhotoUrl();
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className="overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all h-full flex flex-col">
        <CardContent className="p-0 flex flex-col flex-1">

          {/* ── Header ─ */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 relative flex items-start gap-3">
            {/* Avatar */}
            {photoUrl && !imageError ? (
              <img
                src={photoUrl}
                alt={doctorName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/40 shadow shrink-0"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-semibold border-2 border-white/40 shrink-0">
                {doctorName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name + Specialization */}
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-bold text-white text-base leading-tight truncate pr-8">
                Dr. {doctorName}
              </h3>
              <p className="text-blue-100 text-sm mt-0.5 truncate">{doctor.specialization}</p>
            </div>

            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                isFavorite
                  ? "bg-white/20 text-red-400"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </motion.button>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-col flex-1 p-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col gap-3 flex-1">

              {/* Rating */}
              {renderStars(parseFloat(doctor.avg_rating?.toString() || "0"))}

              {/* City + Experience */}
              <div className="flex items-center gap-4">
                {doctor.city && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{doctor.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{doctor.experience_years} yrs</span>
                </div>
              </div>

              {/* ── Fee + Availability ── */}
              <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
                {/* Left: PKR badge + label + amount */}
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shrink-0">
                    PKR
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] text-gray-400">Consultation Fee</span>
                    <span className="text-base font-bold text-gray-900">
                      {Number(doctor.consultation_fee).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Right: Available badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200 shrink-0">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Available
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href={`/patient/book/${doctor.id}`} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 text-sm">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Book Now
                </Button>
              </Link>
              <Link href={`/patient/doctors/${doctor.id}`}>
                <Button
                  variant="outline"
                  className="h-10 w-10 p-0 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DoctorCard;