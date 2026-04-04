"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { schedulesAPI } from "@/lib/api";

interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available: boolean;
}

const daysOfWeek = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const slotDurations = [15, 30, 60];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "17:00",
    slot_duration: 30,
    is_available: true,
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await schedulesAPI.getMySchedule();
      setSchedules(response.data);
    } catch (error: any) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (editingId) {
        response = await schedulesAPI.update(editingId, formData);
      } else {
        response = await schedulesAPI.create(formData);
      }

      toast.success(editingId ? "Schedule updated" : "Schedule added");
      loadSchedules();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.substring(0, 5),
      end_time: schedule.end_time.substring(0, 5),
      slot_duration: schedule.slot_duration,
      is_available: schedule.is_available,
    });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await schedulesAPI.delete(id);
      toast.success("Schedule deleted");
      loadSchedules();
    } catch (error: any) {
      toast.error("Failed to delete schedule");
    }
  };

  const resetForm = () => {
    setFormData({
      day_of_week: "Monday",
      start_time: "09:00",
      end_time: "17:00",
      slot_duration: 30,
      is_available: true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    resetForm();
  };

  return (
    <DashboardLayout role="doctor">
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Manage Schedule
            </h1>
            <p className="text-gray-600">
              Set your weekly availability for appointments
            </p>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              resetForm();
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancel" : "Add Schedule"}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>{editingId ? "Edit" : "Add"} Schedule</CardTitle>
              <CardDescription>
                {editingId ? "Update" : "Set"} your availability for a specific day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day of Week</Label>
                    <Select
                      value={formData.day_of_week}
                      onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
                    <Select
                      value={formData.slot_duration.toString()}
                      onValueChange={(value) => setFormData({ ...formData, slot_duration: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {slotDurations.map((duration) => (
                          <SelectItem key={duration} value={duration.toString()}>
                            {duration} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : editingId ? "Update" : "Add"} Schedule
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Schedules List */}
        <div className="space-y-3">
          {loading && schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Loading schedules...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No schedules added yet</p>
              <p className="text-sm mt-2">Click "Add Schedule" to set your availability</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ScheduleCard({ schedule, onEdit, onDelete }: {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{schedule.day_of_week}</h3>
                <Badge variant={schedule.is_available ? "default" : "secondary"}>
                  {schedule.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                {" • "}
                {schedule.slot_duration} min slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(schedule)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(schedule.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
