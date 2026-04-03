"use client";

import { cn } from "@/lib/utils";

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (time: string) => void;
  className?: string;
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  className,
}: TimeSlotPickerProps) {
  const formatTime = (time: string) => {
    // Convert "14:00" to "2:00 PM"
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No available time slots for this date</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-4 gap-3", className)}>
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.time;
        const isDisabled = !slot.isAvailable;

        return (
          <button
            key={slot.time}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelectSlot(slot.time)}
            className={cn(
              "px-4 py-3 rounded-lg text-sm font-medium transition-all border",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isSelected &&
                "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md",
              !isSelected && slot.isAvailable
                ? "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
            )}
          >
            {formatTime(slot.time)}
          </button>
        );
      })}
    </div>
  );
}
