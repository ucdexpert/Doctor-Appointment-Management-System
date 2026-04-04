/**
 * Custom React Query hooks for Doctor Appointment System
 * 
 * These hooks provide a clean API for fetching and mutating data with automatic caching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  doctorsAPI,
  appointmentsAPI,
  schedulesAPI,
  reviewsAPI,
  favoritesAPI,
  notificationsAPI,
  searchHistoryAPI,
  adminAPI,
} from "@/lib/api";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════
// DOCTORS
// ═══════════════════════════════════════════════════════

export function useDoctors(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ["doctors", params],
    queryFn: () => doctorsAPI.getAll(params).then((res) => res.data),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useDoctor(doctorId: number | null) {
  return useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => doctorsAPI.getById(doctorId!).then((res) => res.data),
    enabled: !!doctorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDoctorReviews(doctorId: number | null) {
  return useQuery({
    queryKey: ["doctor-reviews", doctorId],
    queryFn: () => reviewsAPI.getByDoctor(doctorId!).then((res) => res.data),
    enabled: !!doctorId,
    staleTime: 1000 * 60 * 5,
  });
}

// ═══════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════

export function useMyAppointments(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["my-appointments", params],
    queryFn: () => appointmentsAPI.getMyAppointments(params).then((res) => res.data),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true, // Refetch when user comes back
  });
}

export function useDoctorAppointments(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["doctor-appointments", params],
    queryFn: () => appointmentsAPI.getDoctorAppointments(params).then((res) => res.data),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { doctor_id: number; appointment_date: string; time_slot: string; reason?: string }) =>
      appointmentsAPI.create(data),
    onSuccess: () => {
      toast.success("Appointment booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to book appointment");
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      appointmentsAPI.cancel(id, { reason }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to cancel appointment");
    },
  });
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => appointmentsAPI.confirm(id),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to confirm appointment");
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => appointmentsAPI.complete(id),
    onSuccess: () => {
      toast.success("Appointment completed");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to complete appointment");
    },
  });
}

// ═══════════════════════════════════════════════════════
// SCHEDULES
// ═══════════════════════════════════════════════════════

export function useMySchedule() {
  return useQuery({
    queryKey: ["my-schedule"],
    queryFn: () => schedulesAPI.getMySchedule().then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { day_of_week: string; start_time: string; end_time: string; slot_duration: number }) =>
      schedulesAPI.create(data),
    onSuccess: () => {
      toast.success("Schedule added");
      queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to add schedule");
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      schedulesAPI.update(id, data),
    onSuccess: () => {
      toast.success("Schedule updated");
      queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to update schedule");
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => schedulesAPI.delete(id),
    onSuccess: () => {
      toast.success("Schedule deleted");
      queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to delete schedule");
    },
  });
}

// ═══════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { doctor_id: number; appointment_id: number; rating: number; comment?: string }) =>
      reviewsAPI.create(data),
    onSuccess: () => {
      toast.success("Review submitted!");
      queryClient.invalidateQueries({ queryKey: ["doctor-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to submit review");
    },
  });
}

// ═══════════════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════════════

export function useMyFavorites() {
  return useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favoritesAPI.getMyFavorites().then((res) => res.data),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doctorId: number) => favoritesAPI.add(doctorId),
    onSuccess: () => {
      toast.success("Added to favorites! ❤️");
      queryClient.invalidateQueries({ queryKey: ["my-favorites"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to add favorite");
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doctorId: number) => favoritesAPI.remove(doctorId),
    onSuccess: () => {
      toast.info("Removed from favorites");
      queryClient.invalidateQueries({ queryKey: ["my-favorites"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to remove favorite");
    },
  });
}

// ═══════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════

export function useMyNotifications() {
  return useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => notificationsAPI.getMyNotifications().then((res) => res.data),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll every 30 seconds
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationsAPI.getUnreadCount().then((res) => res.data),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

// ═══════════════════════════════════════════════════════
// SEARCH HISTORY
// ═══════════════════════════════════════════════════════

export function useMySearchHistory(limit = 10) {
  return useQuery({
    queryKey: ["my-search-history", limit],
    queryFn: () => searchHistoryAPI.getMySearches(limit).then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useClearSearchHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => searchHistoryAPI.clearAll(),
    onSuccess: () => {
      toast.success("Search history cleared");
      queryClient.invalidateQueries({ queryKey: ["my-search-history"] });
    },
    onError: () => {
      toast.error("Failed to clear search history");
    },
  });
}

// ═══════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminAPI.getStats().then((res) => res.data),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

export function usePendingDoctors() {
  return useQuery({
    queryKey: ["admin-pending-doctors"],
    queryFn: () => adminAPI.getPendingDoctors().then((res) => res.data),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}

export function useAllUsers(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => adminAPI.getAllUsers(params).then((res) => res.data),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

export function useApproveDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminAPI.approveDoctor(id),
    onSuccess: () => {
      toast.success("Doctor approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to approve doctor");
    },
  });
}

export function useRejectDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminAPI.rejectDoctor(id, { reason }),
    onSuccess: () => {
      toast.success("Doctor rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-doctors"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to reject doctor");
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminAPI.banUser(id, { reason }),
    onSuccess: () => {
      toast.success("User banned");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to ban user");
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminAPI.unbanUser(id),
    onSuccess: () => {
      toast.success("User unbanned");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Failed to unban user");
    },
  });
}
