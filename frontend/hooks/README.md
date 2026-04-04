# React Query Hooks - Usage Guide

## Overview

This project uses **@tanstack/react-query** for efficient server state management with automatic caching, background refetching, and optimistic updates.

## Installation

If not already installed:

```bash
cd frontend
npm install @tanstack/react-query
```

## Available Hooks

All hooks are located in `hooks/useQueries.ts`. Import them as needed:

```typescript
import { 
  useDoctors, 
  useDoctor, 
  useMyAppointments, 
  useCreateAppointment,
  // ... more hooks
} from '@/hooks/useQueries';
```

---

## Doctor Hooks

### Fetch Doctors List
```typescript
const { data, isLoading, error } = useDoctors({ 
  page: 1, 
  limit: 10,
  specialization: "Cardiologist"
});

// data.doctors - Array of doctors
// data.total - Total count
// data.pages - Total pages
```

### Fetch Single Doctor
```typescript
const { data: doctor, isLoading } = useDoctor(doctorId);
```

### Fetch Doctor Reviews
```typescript
const { data: reviews } = useDoctorReviews(doctorId);
```

---

## Appointment Hooks

### Fetch My Appointments
```typescript
const { data: appointments, isLoading } = useMyAppointments({
  status_filter: "pending" // optional
});
```

### Create Appointment
```typescript
const createMutation = useCreateAppointment();

const handleBook = async () => {
  await createMutation.mutateAsync({
    doctor_id: 1,
    appointment_date: "2026-04-10",
    time_slot: "10:00",
    reason: "Regular checkup"
  });
};

// Loading state
if (createMutation.isPending) {
  return <p>Booking...</p>;
}
```

### Cancel Appointment
```typescript
const cancelMutation = useCancelAppointment();

const handleCancel = async (appointmentId: number) => {
  await cancelMutation.mutateAsync({
    id: appointmentId,
    reason: "Personal reasons"
  });
};
```

### Confirm/Complete Appointment (Doctor)
```typescript
const confirmMutation = useConfirmAppointment();
const completeMutation = useCompleteAppointment();

// Confirm
await confirmMutation.mutateAsync(appointmentId);

// Complete
await completeMutation.mutateAsync(appointmentId);
```

---

## Schedule Hooks (Doctor)

### Fetch My Schedule
```typescript
const { data: schedules } = useMySchedule();
```

### Create/Update/Delete Schedule
```typescript
const createSchedule = useCreateSchedule();
const updateSchedule = useUpdateSchedule();
const deleteSchedule = useDeleteSchedule();

// Create
await createSchedule.mutateAsync({
  day_of_week: "Monday",
  start_time: "09:00",
  end_time: "17:00",
  slot_duration: 30
});

// Update
await updateSchedule.mutateAsync({
  id: 1,
  data: { is_available: false }
});

// Delete
await deleteSchedule.mutateAsync(1);
```

---

## Review Hooks

### Create Review
```typescript
const createReview = useCreateReview();

await createReview.mutateAsync({
  doctor_id: 1,
  appointment_id: 1,
  rating: 5,
  comment: "Excellent doctor!"
});
```

---

## Favorites Hooks

### Fetch Favorites
```typescript
const { data: favorites } = useMyFavorites();
```

### Add/Remove Favorite
```typescript
const addFavorite = useAddFavorite();
const removeFavorite = useRemoveFavorite();

// Add
await addFavorite.mutateAsync(doctorId);

// Remove
await removeFavorite.mutateAsync(doctorId);
```

---

## Notification Hooks

### Fetch Notifications
```typescript
const { data: notifications } = useMyNotifications();
const { data: unreadCount } = useUnreadNotificationCount();
```

---

## Search History Hooks

### Fetch Search History
```typescript
const { data: searchHistory } = useMySearchHistory(10);
```

### Clear Search History
```typescript
const clearHistory = useClearSearchHistory();
await clearHistory.mutateAsync();
```

---

## Admin Hooks

### Fetch Admin Stats
```typescript
const { data: stats } = useAdminStats();
```

### Fetch Pending Doctors
```typescript
const { data: pendingDoctors } = usePendingDoctors();
```

### Fetch All Users
```typescript
const { data: users } = useAllUsers({ role: "patient" });
```

### Approve/Reject Doctor
```typescript
const approveDoctor = useApproveDoctor();
const rejectDoctor = useRejectDoctor();

// Approve
await approveDoctor.mutateAsync(doctorId);

// Reject
await rejectDoctor.mutateAsync({ 
  id: doctorId, 
  reason: "Incomplete documentation" 
});
```

### Ban/Unban User
```typescript
const banUser = useBanUser();
const unbanUser = useUnbanUser();

// Ban
await banUser.mutateAsync({ 
  id: userId, 
  reason: "Violation of terms" 
});

// Unban
await unbanUser.mutateAsync(userId);
```

---

## Manual Cache Invalidation

If you need to manually invalidate queries:

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ["doctors"] });

// Invalidate all appointments
queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
```

---

## Migration Guide (From useEffect to React Query)

### Before (useEffect)
```typescript
const [doctors, setDoctors] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchDoctors = async () => {
    setLoading(true);
    const response = await doctorsAPI.getAll();
    setDoctors(response.data);
    setLoading(false);
  };
  fetchDoctors();
}, []);
```

### After (React Query)
```typescript
const { data: doctors, isLoading: loading } = useDoctors();
// That's it! Automatic caching, background refetch, etc.
```

---

## Benefits

✅ **Automatic Caching** - No redundant API calls  
✅ **Background Refetching** - Always fresh data  
✅ **Request Deduplication** - Multiple components = 1 request  
✅ **Optimistic Updates** - Instant UI feedback  
✅ **Error Handling** - Built-in retry logic  
✅ **DevTools** - Debug with React Query DevTools  

---

## Debugging

Install React Query DevTools:

```bash
npm install @tanstack/react-query-devtools
```

Add to your app:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your provider
<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

## Best Practices

1. **Always use hooks** instead of manual `useEffect` + `useState`
2. **Use mutation hooks** for POST/PUT/DELETE with automatic cache invalidation
3. **Handle loading states** with `isLoading`, `isPending`
4. **Handle errors** with `error` or `onError` callbacks
5. **Invalidate related queries** after mutations
6. **Use optimistic updates** for better UX when appropriate

---

**Last Updated**: April 4, 2026
