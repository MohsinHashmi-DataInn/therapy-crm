"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addHours, format } from "date-fns";
import { useAppointments } from "@/hooks/use-appointments";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { AppointmentStatus, ServiceType } from "@/lib/types";

// Schema for appointment form validation
const appointmentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format"),
  serviceType: z.enum(["individual_therapy", "group_therapy", "family_therapy", "couple_therapy", "assessment", "consultation"] as const),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"] as const),
  notes: z.string().optional(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  fee: z.string().transform(val => parseFloat(val)).optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

/**
 * New Appointment Page component
 * Form for creating a new appointment
 */
export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  const { createAppointment } = useAppointments();
  const { useClientsQuery } = useClients();
  const { data: clientsData } = useClientsQuery(1, 100);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: clientIdParam || "",
      date: new Date(),
      startTime: format(new Date(), "HH:00"),
      endTime: format(addHours(new Date(), 1), "HH:00"),
      serviceType: "individual_therapy" as ServiceType,
      status: "scheduled" as AppointmentStatus,
      notes: "",
      location: "",
      meetingLink: "",
      fee: "",
    },
  });

  // Update the form when the date changes
  useEffect(() => {
    form.setValue("date", selectedDate);
  }, [selectedDate, form]);

  const onSubmit = async (values: AppointmentFormValues) => {
    try {
      const newAppointment = await createAppointment(values);
      toast({
        title: "Appointment created",
        description: "New appointment has been scheduled successfully.",
      });
      router.push(`/appointments/${newAppointment.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schedule New Appointment</h1>
        <p className="text-gray-500">Create a new appointment for a client</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
              <CardDescription>Basic appointment information</CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                  {form.formState.errors.date && (
                    <p className="text-red-500 text-sm">{form.formState.errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input 
                      id="startTime" 
                      type="time"
                      {...form.register("startTime")}
                      className={form.formState.errors.startTime ? "border-red-500" : ""}
                    />
                    {form.formState.errors.startTime && (
                      <p className="text-red-500 text-sm">{form.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input 
                      id="endTime" 
                      type="time"
                      {...form.register("endTime")}
                      className={form.formState.errors.endTime ? "border-red-500" : ""}
                    />
                    {form.formState.errors.endTime && (
                      <p className="text-red-500 text-sm">{form.formState.errors.endTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("serviceType", value as ServiceType)}
                      defaultValue={form.getValues("serviceType")}
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
                    {form.formState.errors.serviceType && (
                      <p className="text-red-500 text-sm">{form.formState.errors.serviceType.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Location, fees, and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...form.register("location")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input id="meetingLink" type="url" {...form.register("meetingLink")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee">Fee ($)</Label>
                  <Input 
                    id="fee" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    {...form.register("fee")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("status", value as AppointmentStatus)}
                    defaultValue={form.getValues("status")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register("notes")} className="min-h-32" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/appointments")}>
                Cancel
              </Button>
              <Button type="submit">Schedule Appointment</Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
