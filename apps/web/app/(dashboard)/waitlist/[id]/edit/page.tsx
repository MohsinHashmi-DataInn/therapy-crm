"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useWaitlist } from "@/hooks/use-waitlist";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

// Validation schema for the waitlist form
const waitlistSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  serviceNeeded: z.string().min(1, "Service type is required"),
  notes: z.string().optional(),
  priority: z.string().transform(val => parseInt(val, 10)),
  preferredTherapist: z.string().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimeOfDay: z.string().optional(),
  dateAdded: z.date(),
  isUrgent: z.boolean().default(false),
  status: z.string().optional(),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

/**
 * Edit Waitlist Entry Page component
 * Form for editing an existing waitlist entry
 */
export default function EditWaitlistEntryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { useWaitlistEntryQuery, updateWaitlistEntry } = useWaitlist();
  const { useClientsQuery } = useClients();
  const { data: clientsData } = useClientsQuery(1, 100);
  const { data: waitlistEntry, isLoading, isError } = useWaitlistEntryQuery(params.id);

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      clientId: "",
      serviceNeeded: "",
      notes: "",
      priority: "3",
      preferredTherapist: "",
      preferredDays: [],
      preferredTimeOfDay: "",
      dateAdded: new Date(),
      isUrgent: false,
      status: "waiting",
    },
  });

  // Initialize form with waitlist entry data once loaded
  useEffect(() => {
    if (waitlistEntry) {
      const dateAdded = new Date(waitlistEntry.dateAdded);
      
      form.reset({
        clientId: waitlistEntry.clientId,
        serviceNeeded: waitlistEntry.serviceNeeded,
        notes: waitlistEntry.notes || "",
        priority: waitlistEntry.priority?.toString() || "3",
        preferredTherapist: waitlistEntry.preferredTherapist || "",
        preferredDays: waitlistEntry.preferredDays || [],
        preferredTimeOfDay: waitlistEntry.preferredTimeOfDay || "",
        dateAdded: dateAdded,
        isUrgent: waitlistEntry.isUrgent || false,
        status: waitlistEntry.status || "waiting",
      });
    }
  }, [waitlistEntry, form]);

  const onSubmit = async (values: WaitlistFormValues) => {
    try {
      await updateWaitlistEntry(params.id, values);
      toast({
        title: "Waitlist entry updated",
        description: "Waitlist entry has been updated successfully.",
      });
      router.push(`/waitlist/${params.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update waitlist entry. Please try again.",
        variant: "destructive",
      });
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Waitlist Entry</h1>
        <p className="text-gray-500">Update waitlist information for {waitlistEntry.client.firstName} {waitlistEntry.client.lastName}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client and Status</CardTitle>
              <CardDescription>Client information and waitlist status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("clientId", value)}
                  defaultValue={form.getValues("clientId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.data.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.clientId && (
                  <p className="text-red-500 text-sm">{form.formState.errors.clientId.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  onValueChange={(value) => form.setValue("status", value)}
                  defaultValue={form.getValues("status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateAdded">Date Added</Label>
                <Input 
                  id="dateAdded" 
                  type="date" 
                  value={form.getValues("dateAdded") ? new Date(form.getValues("dateAdded")).toISOString().split('T')[0] : ""}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    form.setValue("dateAdded", date);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Preferences</CardTitle>
              <CardDescription>Details about the requested therapy services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceNeeded">Service Needed *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("serviceNeeded", value)}
                  defaultValue={form.getValues("serviceNeeded")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_therapy">Individual Therapy</SelectItem>
                    <SelectItem value="group_therapy">Group Therapy</SelectItem>
                    <SelectItem value="family_therapy">Family Therapy</SelectItem>
                    <SelectItem value="couple_therapy">Couple Therapy</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.serviceNeeded && (
                  <p className="text-red-500 text-sm">{form.formState.errors.serviceNeeded.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTherapist">Preferred Therapist (Optional)</Label>
                <Input id="preferredTherapist" {...form.register("preferredTherapist")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTimeOfDay">Preferred Time of Day</Label>
                <Select 
                  onValueChange={(value) => form.setValue("preferredTimeOfDay", value)}
                  defaultValue={form.getValues("preferredTimeOfDay")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                    <SelectItem value="evening">Evening (5pm-8pm)</SelectItem>
                    <SelectItem value="any">Any Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  onValueChange={(value) => form.setValue("priority", value)}
                  defaultValue={form.getValues("priority")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="isUrgent"
                  checked={form.getValues("isUrgent")}
                  onCheckedChange={(checked) => {
                    form.setValue("isUrgent", checked === true);
                  }}
                />
                <Label htmlFor="isUrgent" className="font-normal">
                  Mark as urgent case
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Any additional information or special requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register("notes")} className="min-h-32" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push(`/waitlist/${params.id}`)}>
                Cancel
              </Button>
              <Button type="submit">Update Waitlist Entry</Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
