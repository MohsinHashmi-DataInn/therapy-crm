"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Calendar, Trash, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { useAppointments } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { formatDate, formatPhoneNumber } from "@/lib/utils";

/**
 * Client Detail Page component
 * Displays comprehensive information about a single client
 */
export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { useClientQuery, deleteClient } = useClients();
  const { useClientAppointmentsQuery } = useAppointments();
  
  const { data: client, isLoading: isClientLoading, isError: isClientError } = useClientQuery(params.id);
  const { data: appointments, isLoading: isAppointmentsLoading } = useClientAppointmentsQuery(params.id);

  const handleDelete = async () => {
    try {
      await deleteClient(params.id);
      toast({
        title: "Client deleted",
        description: "Client has been removed successfully.",
      });
      router.push("/clients");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPriorityLabel = (priority?: number) => {
    switch (priority) {
      case 1:
        return "High";
      case 2:
        return "Medium";
      case 3:
        return "Standard";
      default:
        return "Standard";
    }
  };

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 1:
        return "bg-red-100 text-red-800";
      case 2:
        return "bg-yellow-100 text-yellow-800";
      case 3:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "waitlist":
        return "bg-yellow-100 text-yellow-800";
      case "former":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isClientLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (isClientError || !client) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center text-red-500">
          <p>Error loading client details. Please try again.</p>
          <Button 
            onClick={() => router.push("/clients")} 
            className="mt-4"
          >
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/clients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-gray-500">Client ID: {client.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                {client.status}
              </span>
              {client.priority && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(client.priority)}`}>
                  {getPriorityLabel(client.priority)} Priority
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p>{client.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p>{client.phone ? formatPhoneNumber(client.phone) : "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Address:</span>
                <p>{client.address || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Date of Birth:</span>
                <p>{client.dateOfBirth ? formatDate(client.dateOfBirth) : "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created:</span>
                <p>{formatDate(client.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Updated:</span>
                <p>{formatDate(client.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Insurance Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Insurance Provider:</span>
                <p>{client.insuranceProvider || "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Insurance ID:</span>
                <p>{client.insuranceId || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p>{client.emergencyContactName || "Not provided"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p>{client.emergencyContactPhone ? formatPhoneNumber(client.emergencyContactPhone) : "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {client.notes ? (
              <p className="whitespace-pre-line">{client.notes}</p>
            ) : (
              <p className="text-gray-500 italic">No notes available</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Client appointments history and schedule</CardDescription>
          </div>
          <Button onClick={() => router.push(`/appointments/new?clientId=${client.id}`)}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
        </CardHeader>
        <CardContent>
          {isAppointmentsLoading ? (
            <div className="text-center py-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2">Loading appointments...</p>
            </div>
          ) : !appointments || appointments.data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointments found for this client.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push(`/appointments/new?clientId=${client.id}`)}
              >
                Schedule First Appointment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.data.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{formatDate(appointment.date)}</TableCell>
                    <TableCell>{appointment.startTime} - {appointment.endTime}</TableCell>
                    <TableCell>{appointment.serviceType}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === "scheduled" 
                          ? "bg-blue-100 text-blue-800" 
                          : appointment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {appointment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/appointments/${appointment.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/clients/${params.id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Client
        </Button>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this client? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Warning: Deleting this client will also remove:
                </p>
                <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                  <li>All appointment records</li>
                  <li>Waitlist entries</li>
                  <li>Any associated notes and documents</li>
                </ul>
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
