"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Edit, Trash, Calendar, User, AlertCircle } from "lucide-react";
import { useAppointments } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

/**
 * Appointment Detail Page component
 * Displays details of a specific appointment and allows for management actions
 */
export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { useAppointmentQuery, deleteAppointment, updateAppointment } = useAppointments();
  
  const { data: appointment, isLoading, isError } = useAppointmentQuery(params.id);

  const handleDelete = async () => {
    try {
      await deleteAppointment(params.id);
      toast({
        title: "Appointment deleted",
        description: "The appointment has been cancelled and removed.",
      });
      router.push("/appointments");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (status: string) => {
    try {
      if (!appointment) return;
      
      await updateAppointment(params.id, {
        ...appointment,
        status,
      });
      
      toast({
        title: "Status updated",
        description: `Appointment marked as ${status}.`,
      });
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
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

  const getServiceTypeLabel = (type: string) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center text-red-500">
          <p>Error loading appointment details. Please try again.</p>
          <Button 
            onClick={() => router.push("/appointments")} 
            className="mt-4"
          >
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/appointments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            Appointment Details
          </h1>
          <p className="text-gray-500">ID: {appointment.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium">
                  {appointment.client.firstName} {appointment.client.lastName}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p>{appointment.client.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p>{appointment.client.phone || "Not provided"}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => router.push(`/clients/${appointment.clientId}`)}
              >
                <User className="mr-2 h-4 w-4" />
                View Client Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Date:</span>
                <p className="font-medium">{formatDate(appointment.date)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Time:</span>
                <p>{appointment.startTime} - {appointment.endTime}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Service:</span>
                <p>{getServiceTypeLabel(appointment.serviceType)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Location:</span>
                <p>{appointment.location || "Not specified"}</p>
              </div>
              {appointment.meetingLink && (
                <div>
                  <span className="text-sm text-gray-500">Meeting Link:</span>
                  <p>
                    <a 
                      href={appointment.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {appointment.meetingLink}
                    </a>
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Fee:</span>
                <p>{appointment.fee ? `$${appointment.fee.toFixed(2)}` : "Not specified"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created:</span>
                <p>{formatDate(appointment.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {appointment.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line">{appointment.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Status</CardTitle>
          <CardDescription>Update the appointment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={appointment.status === "scheduled" ? "default" : "outline"}
              onClick={() => updateStatus("scheduled")}
              disabled={appointment.status === "scheduled"}
            >
              Mark as Scheduled
            </Button>
            <Button
              variant={appointment.status === "completed" ? "default" : "outline"}
              onClick={() => updateStatus("completed")}
              disabled={appointment.status === "completed"}
            >
              Mark as Completed
            </Button>
            <Button
              variant={appointment.status === "cancelled" ? "default" : "outline"}
              onClick={() => updateStatus("cancelled")}
              disabled={appointment.status === "cancelled"}
            >
              Mark as Cancelled
            </Button>
            <Button
              variant={appointment.status === "no_show" ? "default" : "outline"}
              onClick={() => updateStatus("no_show")}
              disabled={appointment.status === "no_show"}
            >
              Mark as No-Show
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Button 
          variant="outline"
          onClick={() => router.push(`/appointments/${params.id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Appointment
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.push(`/appointments/new?clientId=${appointment.clientId}`)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  This will permanently remove the appointment record.
                </p>
                <p className="mt-1 text-sm text-yellow-700">
                  Consider marking it as "cancelled" instead to maintain your records.
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
