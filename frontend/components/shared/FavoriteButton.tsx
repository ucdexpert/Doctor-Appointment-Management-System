"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { favoritesAPI } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteButtonProps {
  doctorId: number;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({ doctorId, size = "md" }: FavoriteButtonProps) {
  const { token } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      checkIfFavorited();
    }
  }, [doctorId, token]);

  const checkIfFavorited = async () => {
    try {
      const response = await favoritesAPI.checkIfFavorited(doctorId);
      setIsFavorited(response.data.is_favorited);
    } catch (error) {
      console.error("Failed to check favorite status");
    }
  };

  const toggleFavorite = async () => {
    if (!token) {
      toast.error("Please login to favorite doctors");
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await favoritesAPI.remove(doctorId);
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        await favoritesAPI.add(doctorId);
        setIsFavorited(true);
        toast.success("Added to favorites ❤️");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to update favorites");
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 w-8 p-0",
    md: "h-10 w-10 p-0",
    lg: "h-12 w-12 p-0"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <Button
      variant={isFavorited ? "default" : "outline"}
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      onClick={toggleFavorite}
      disabled={loading}
      className={`
        rounded-full transition-all
        ${isFavorited
          ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
          : "border-gray-300 hover:border-red-300 hover:text-red-500"
        }
        ${sizeClasses[size]}
      `}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Heart className={`${iconSizes[size]} ${isFavorited ? "fill-current" : ""}`} />
      )}
    </Button>
  );
}
