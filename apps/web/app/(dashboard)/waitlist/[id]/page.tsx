"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Edit, Trash, Calendar, User, AlertCircle } from "lucide-react";
import { useWaitlist } from "@/hooks/use-waitlist";
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
 * Waitlist Entry Detail Page component
 * Displays comprehensive information about a waitlist entry and allows for management actions
 */
export default function WaitlistDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { useWaitlistEntryQuery, removeFromWaitlist, updateWaitlistEntry } = useWaitlist();
  
  const { data: waitlistEntry, isLoading, isError } = useWaitlistEntryQuery(params.id);

  const handleDelete = async () => {
    try {
      await removeFromWaitlist(params.id);
      toast({
        title: "Removed from waitlist",
        description: "Client has been removed from the waitlist.",
      });
      router.push("/waitlist");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from waitlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scheduleAppointment = () => {
    if (waitlistEntry?.clientId) {
      router.push(`/appointments/new?clientId=${waitlistEntry.clientId}`);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      if (!waitlistEntry) return;

      await updateWaitlistEntry(params.id, {
        ...waitlistEntry,
        status,
      });

      toast({
        title: "Status updated",
        description: `Waitlist status updated to ${status}.`,
      });
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
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
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getServiceLabel = (service: string) => {
    switch (service) {
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
        return service;
    }
  };

  const getTimeOfDayLabel = (timeOfDay: string) => {
    switch (timeOfDay) {
      case "morning":
        return "Morning (8am-12pm)";
      case "afternoon":
        return "Afternoon (12pm-5pm)";
      case "evening":
        return "Evening (5pm-8pm)";
      case "any":
        return "Any Time";
      default:
        return timeOfDay || "Not specified";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading waitlist entry details...</p>
        </div>
      </div>
    );
  }

  if (isError || !waitlistEntry) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center text-red-500">
          <p>Error loading waitlist entry. Please try again.</p>
          <Button 
            onClick={() => router.push("/waitlist")} 
            className="mt-4"
          >
            Back to Waitlist
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/waitlist")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            Waitlist: {waitlistEntry.client.firstName} {waitlistEntry.client.lastName}
          </h1>
          <p className="text-gray-500">Added on {formatDate(waitlistEntry.dateAdded)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Current Status:</span>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(waitlistEntry.status)}`}>
                    {waitlistEntry.status}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Priority Level:</span>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(waitlistEntry.priority)}`}>
                    {getPriorityLabel(waitlistEntry.priority)}
                  </span>
                  {waitlistEntry.isUrgent && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      URGENT
                    </span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Waiting Since:</span>
                <p>{formatDate(waitlistEntry.dateAdded)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Updated:</span>
                <p>{formatDate(waitlistEntry.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium">
                  {waitlistEntry.client.firstName} {waitlistEntry.client.lastName}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p>{waitlistEntry.client.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p>{waitlistEntry.client.phone || "Not provided"}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => router.push(`/clients/${waitlistEntry.clientId}`)}
              >
                <User className="mr-2 h-4 w-4" />
                View Client Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Service Needed:</span>
                <p>{getServiceLabel(waitlistEntry.serviceNeeded)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Preferred Therapist:</span>
                <p>{waitlistEntry.preferredTherapist || "No preference"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Preferred Time:</span>
                <p>{getTimeOfDayLabel(waitlistEntry.preferredTimeOfDay)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {waitlistEntry.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line">{waitlistEntry.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Status</CardTitle>
          <CardDescription>Update the waitlist status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={waitlistEntry.status === "waiting" ? "default" : "outline"}
              onClick={() => updateStatus("waiting")}
              disabled={waitlistEntry.status === "waiting"}
            >
              Mark as Waiting
            </Button>
            <Button
              variant={waitlistEntry.status === "contacted" ? "default" : "outline"}
              onClick={() => updateStatus("contacted")}
              disabled={waitlistEntry.status === "contacted"}
            >
              Mark as Contacted
            </Button>
            <Button
              variant={waitlistEntry.status === "scheduled" ? "default" : "outline"}
              onClick={() => updateStatus("scheduled")}
              disabled={waitlistEntry.status === "scheduled"}
            >
              Mark as Scheduled
            </Button>
            <Button
              variant={waitlistEntry.status === "cancelled" ? "default" : "outline"}
              onClick={() => updateStatus("cancelled")}
              disabled={waitlistEntry.status === "cancelled"}
            >
              Mark as Cancelled
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/waitlist/${params.id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Entry
        </Button>
        <Button 
          variant="default"
          onClick={scheduleAppointment}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Remove from Waitlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove from Waitlist</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this client from the waitlist?
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  This will permanently remove this entry from the waitlist.
                </p>
                <p className="mt-1 text-sm text-yellow-700">
                  If the client has been scheduled, consider marking as "scheduled" instead.
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete}>
                Remove Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
