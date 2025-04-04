"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { useAppointments } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatus, ServiceType } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

/**
 * Appointments page component
 * Displays a list of all appointments with filtering by date, status, and therapist
 */
export default function AppointmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const { useAppointmentsQuery } = useAppointments();

  // Format the selected date for API query
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  const { data, isLoading, isError } = useAppointmentsQuery(
    page, 
    10, 
    formattedDate, 
    formattedDate, 
    status as AppointmentStatus | undefined
  );

  // Get status badge color based on appointment status
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get service type display text
  const getServiceTypeDisplay = (type: ServiceType) => {
    switch (type) {
      case "individual_therapy":
        return "Individual Therapy";
      case "group_therapy":
        return "Group Therapy";
      case "family_therapy":
        return "Family Therapy";
      case "couple_therapy":
        return "Couple Therapy";
      case "assessment":
        return "Assessment";
      case "consultation":
        return "Consultation";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Button onClick={() => router.push("/appointments/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={status} onValueChange={(value) => setStatus(value as AppointmentStatus | "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"} Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="font-medium">{data?.meta.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Scheduled:</span>
                <span className="font-medium">
                  {data?.data.filter(a => a.status === "scheduled").length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Completed:</span>
                <span className="font-medium">
                  {data?.data.filter(a => a.status === "completed").length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cancelled:</span>
                <span className="font-medium">
                  {data?.data.filter(a => a.status === "cancelled").length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-2">Loading appointments...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center text-red-500">
                <p>Error loading appointments. Please try again.</p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No appointments found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </TableCell>
                        <TableCell>{formatDate(appointment.date)}</TableCell>
                        <TableCell>
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </TableCell>
                        <TableCell>{getServiceTypeDisplay(appointment.serviceType)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/appointments/${appointment.id}`)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.meta.total)} of {data.meta.total} appointments
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page === data.meta.totalPages}
                      onClick={() => setPage((prev) => Math.min(prev + 1, data.meta.totalPages))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
