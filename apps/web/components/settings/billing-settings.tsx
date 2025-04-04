'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client'; 
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const billingFormSchema = z.object({
  billingName: z.string().max(255).optional().nullable(),
  billingEmail: z.string().email().max(255).optional().nullable(),
  billingAddress: z.string().max(255).optional().nullable(),
  billingCity: z.string().max(100).optional().nullable(),
  billingState: z.string().max(100).optional().nullable(),
  billingZipCode: z.string().max(20).optional().nullable(),
});

type BillingFormValues = z.infer<typeof billingFormSchema>;

interface BillingData {
  id: bigint; 
  billingName?: string | null;
  billingEmail?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingZipCode?: string | null;
}

const fetchBillingSettings = async (): Promise<BillingData> => {
  const response = await apiClient.get<BillingData>('/billing');
  return response.data;
};

const updateBillingSettings = async (
  data: BillingFormValues,
): Promise<BillingData> => {
  const response = await apiClient.put<BillingData>('/billing', data);
  return response.data;
};

export function BillingSettings() {
  const queryClient = useQueryClient();

  const {
    data: billingData,
    isLoading,
    isError,
    error,
  } = useQuery<BillingData, Error>({
    queryKey: ['billingSettings'],
    queryFn: fetchBillingSettings,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, 
  });

  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      billingName: '',
      billingEmail: '',
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingZipCode: '',
    },
  });

  useEffect(() => {
    if (billingData) {
      form.reset({
        billingName: billingData.billingName ?? '',
        billingEmail: billingData.billingEmail ?? '',
        billingAddress: billingData.billingAddress ?? '',
        billingCity: billingData.billingCity ?? '',
        billingState: billingData.billingState ?? '',
        billingZipCode: billingData.billingZipCode ?? '',
      });
    }
  }, [billingData, form.reset]);

  const mutation = useMutation<BillingData, Error, BillingFormValues>({
    mutationFn: updateBillingSettings,
    onSuccess: (data) => {
      toast.success('Billing settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['billingSettings'] });
    },
    onError: (error) => {
      toast.error(`Failed to update billing settings: ${error.message}`);
      console.error('Update Billing Error:', error);
    },
  });

  const onSubmit = (values: BillingFormValues) => {
    console.log('Submitting billing data:', values);
    mutation.mutate(values);
  };

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Settings</CardTitle>
          <CardDescription>Manage your billing address and payment details.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading billing settings: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Settings</CardTitle>
        <CardDescription>Manage your billing address and payment details.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="billingName"
                  render={({ field }: { field: ControllerRenderProps<BillingFormValues, 'billingName'> }) => (
                    <FormItem>
                      <FormLabel>Billing Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name on Card/Account" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingEmail"
                  render={({ field }: { field: ControllerRenderProps<BillingFormValues, 'billingEmail'> }) => (
                    <FormItem>
                      <FormLabel>Billing Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="billing@example.com" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingAddress"
                  render={({ field }: { field: ControllerRenderProps<BillingFormValues, 'billingAddress'> }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Billing St" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="billingCity"
                    render={({ field }: { field: ControllerRenderProps<BillingFormValues, 'billingCity'> }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Billington" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billingState"
                    render={({ field }: { field: ControllerRenderProps<BillingFormValues, 'billingState'> }) => (
                      <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <FormControl>
                          <Input placeholder="CA" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billingZipCode"
                    render={({ field }: { field: ControllerRenderProps<BillingFormValues, 'billingZipCode'> }) => (
                      <FormItem>
                        <FormLabel>Zip / Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="90210" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={mutation.isPending || isLoading}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
