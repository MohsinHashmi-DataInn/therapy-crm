'use client';

import React from 'react'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, ControllerRenderProps, FieldValues } from 'react-hook-form'; 
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'; 

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; 
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; 
import { apiClient } from '@/lib/api-client'; 

// Define the Zod schema based on UpdatePracticeDto (allow optional fields)
const practiceFormSchema = z.object({
  name: z.string().min(2, { message: 'Practice name must be at least 2 characters.' }).max(255),
  address: z.string().max(255).optional().or(z.literal('')), 
  city: z.string().max(100).optional().or(z.literal('')), 
  state: z.string().max(100).optional().or(z.literal('')), 
  zipCode: z.string().max(20).optional().or(z.literal('')), 
  phone: z.string().max(30).optional().or(z.literal('')), 
  email: z.string().email({ message: "Invalid email address." }).max(255).optional().or(z.literal('')), 
  website: z.string().url({ message: "Invalid URL." }).max(255).optional().or(z.literal('')), 
  hoursOfOperation: z.string().max(1000).optional().or(z.literal('')), 
});

type PracticeFormValues = z.infer<typeof practiceFormSchema>;

// Define the type for the fetched Practice data (matching backend Practice model)
interface PracticeData extends PracticeFormValues {
    id: bigint; 
    createdAt: string | Date;
    updatedAt: string | Date;
}

// API Fetching Functions
const fetchPracticeInfo = async (): Promise<PracticeData> => {
    const response = await apiClient.get<PracticeData>('/practice');
    return response.data; 
};

const updatePracticeInfo = async (data: PracticeFormValues): Promise<PracticeData> => {
    const response = await apiClient.put<PracticeData>('/practice', data);
    return response.data;
};

export function PracticeSettings() {
  const queryClient = useQueryClient();

  const { 
    data: practiceData, 
    isLoading: isLoadingPractice, 
    isError: isErrorLoading, 
    error: loadingError 
  } = useQuery<PracticeData, Error>({
    queryKey: ['practiceInfo'],
    queryFn: fetchPracticeInfo,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    // Use placeholderData instead of keepPreviousData for TanStack Query v5+
    placeholderData: (previousData) => previousData, 
    // keepPreviousData: true, // Outdated option
  });

  const { mutate: updatePractice, isPending: isUpdating } = useMutation<PracticeData, Error, PracticeFormValues>({
    mutationFn: updatePracticeInfo,
    onSuccess: (updatedData) => {
        toast.success('Practice information updated successfully!');
        queryClient.setQueryData(['practiceInfo'], updatedData);
    },
    onError: (error) => {
        toast.error(`Failed to update practice information: ${error.message}`);
    },
  });

  const form = useForm<PracticeFormValues>({
    resolver: zodResolver(practiceFormSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      website: '',
      hoursOfOperation: '',
    },
  });

  React.useEffect(() => {
    if (practiceData) {
      // Explicitly cast types if TS complains, though it shouldn't be needed with PracticeData type
      form.reset({
        name: practiceData.name || '',
        address: practiceData.address || '',
        city: practiceData.city || '',
        state: practiceData.state || '',
        zipCode: practiceData.zipCode || '',
        phone: practiceData.phone || '',
        email: practiceData.email || '',
        website: practiceData.website || '',
        hoursOfOperation: practiceData.hoursOfOperation || '',
      });
    }
  }, [practiceData, form.reset]); 

  function onSubmit(data: PracticeFormValues) {
    console.log('Submitting Practice Info:', data);
    updatePractice(data);
  }

  if (isLoadingPractice) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  if (isErrorLoading) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Practice Information</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load practice details. Please try again later.
            {loadingError?.message && ` Details: ${loadingError.message}`}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Information</CardTitle>
        <CardDescription>
          Manage your practice's details.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-4">
            <FormField
              control={form.control} 
              name="name"
              render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'name'> }) => (
                <FormItem>
                  <FormLabel>Practice Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Practice Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control} 
              name="address"
              render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'address'> }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control} 
                name="city"
                render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'city'> }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Anytown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} 
                name="state"
                render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'state'> }) => (
                  <FormItem>
                    <FormLabel>State / Province</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} 
                name="zipCode"
                render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'zipCode'> }) => (
                  <FormItem>
                    <FormLabel>Zip / Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="90210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control} 
              name="phone"
              render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'phone'> }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control} 
              name="email"
              render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'email'> }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@yourpractice.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control} 
              name="website"
              render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'website'> }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://www.yourpractice.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control} 
              name="hoursOfOperation"
              render={({ field }: { field: ControllerRenderProps<PracticeFormValues, 'hoursOfOperation'> }) => (
                <FormItem>
                  <FormLabel>Hours of Operation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Mon-Fri: 9am - 5pm\nSat: 10am - 2pm"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                    Enter operating hours as plain text.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
