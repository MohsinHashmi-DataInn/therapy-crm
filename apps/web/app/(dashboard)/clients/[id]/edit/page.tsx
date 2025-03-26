"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { ClientStatus } from "@/lib/types";

// Validation schema for the client form
const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  status: z.enum(["active", "inactive", "waitlist", "former"] as const),
  notes: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  priority: z.string().transform(val => parseInt(val, 10)).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

/**
 * Edit Client Page component
 * Handles editing an existing client's information
 */
export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { useClientQuery, updateClient } = useClients();
  const { data: client, isLoading, isError } = useClientQuery(params.id);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      status: "active" as ClientStatus,
      notes: "",
      insuranceProvider: "",
      insuranceId: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      priority: "3",
    },
  });

  // Update form values when client data is loaded
  useEffect(() => {
    if (client) {
      form.reset({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone || "",
        address: client.address || "",
        dateOfBirth: client.dateOfBirth || "",
        status: client.status,
        notes: client.notes || "",
        insuranceProvider: client.insuranceProvider || "",
        insuranceId: client.insuranceId || "",
        emergencyContactName: client.emergencyContactName || "",
        emergencyContactPhone: client.emergencyContactPhone || "",
        priority: client.priority?.toString() || "3",
      });
    }
  }, [client, form]);

  const onSubmit = async (values: ClientFormValues) => {
    try {
      await updateClient(params.id, values);
      toast({
        title: "Client updated",
        description: "Client information has been updated successfully.",
      });
      router.push(`/clients/${params.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading client...</p>
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center text-red-500">
          <p>Error loading client. Please try again.</p>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Client</h1>
        <p className="text-gray-500">Update information for {client.firstName} {client.lastName}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update the client's personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    className={form.formState.errors.firstName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    className={form.formState.errors.lastName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    className={form.formState.errors.email ? "border-red-500" : ""}
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...form.register("address")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("status", value as ClientStatus)}
                    defaultValue={form.getValues("status")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insurance & Emergency Contact</CardTitle>
              <CardDescription>Update insurance and emergency contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input id="insuranceProvider" {...form.register("insuranceProvider")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceId">Insurance ID</Label>
                  <Input id="insuranceId" {...form.register("insuranceId")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input id="emergencyContactName" {...form.register("emergencyContactName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input id="emergencyContactPhone" {...form.register("emergencyContactPhone")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Other details about the client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register("notes")} className="min-h-32" />
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push(`/clients/${params.id}`)}>
                Cancel
              </Button>
              <Button type="submit">Update Client</Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
