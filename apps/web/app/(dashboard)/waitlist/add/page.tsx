"use client";

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
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

/**
 * Add to Waitlist Page component
 * Form for adding a new or existing client to the waitlist
 */
export default function AddToWaitlistPage() {
  const router = useRouter();
  const { addToWaitlist } = useWaitlist();
  const { useClientsQuery } = useClients();
  const { data: clientsData } = useClientsQuery(1, 100);

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      clientId: "",
      serviceNeeded: "individual_therapy",
      notes: "",
      priority: "3",
      preferredTherapist: "",
      preferredDays: [],
      preferredTimeOfDay: "",
      dateAdded: new Date(),
      isUrgent: false,
    },
  });

  const onSubmit = async (values: WaitlistFormValues) => {
    try {
      await addToWaitlist(values);
      toast({
        title: "Added to waitlist",
        description: "Client has been added to the waitlist successfully.",
      });
      router.push("/waitlist");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add client to waitlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add to Waitlist</h1>
        <p className="text-gray-500">Add a client to the therapy waitlist</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Selection</CardTitle>
              <CardDescription>Select an existing client or create a new one</CardDescription>
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
              
              <div className="flex items-center">
                <span className="text-sm mr-2">Or</span>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/clients/new?fromWaitlist=true')}
                >
                  Add New Client
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
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
                <input
                  type="checkbox"
                  id="isUrgent"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register("isUrgent")}
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
              <Button variant="outline" onClick={() => router.push("/waitlist")}>
                Cancel
              </Button>
              <Button type="submit">Add to Waitlist</Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
