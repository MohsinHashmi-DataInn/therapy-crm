'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Waitlist, PaginatedResponse, WaitlistStatus, ServiceType } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for waitlist data management
 * Provides functions to fetch, create, update, and delete waitlist entries
 */
export const useWaitlist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Fetch waitlist entries with optional filtering
   */
  const getWaitlistEntries = async (
    page = 1, 
    limit = 10, 
    status?: WaitlistStatus,
    serviceType?: ServiceType
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);
    if (serviceType) params.append('serviceType', serviceType);

    const response = await api.get<PaginatedResponse<Waitlist>>(`/waitlist?${params.toString()}`);
    return response.data;
  };

  /**
   * Fetch a single waitlist entry by ID
   */
  const getWaitlistEntryById = async (id: string) => {
    const response = await api.get<Waitlist>(`/waitlist/${id}`);
    return response.data;
  };

  /**
   * Create a new waitlist entry
   */
  const createWaitlistEntry = async (waitlistEntry: Omit<Waitlist, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Waitlist>('/waitlist', waitlistEntry);
    return response.data;
  };

  /**
   * Update an existing waitlist entry
   */
  const updateWaitlistEntry = async ({ id, ...data }: Partial<Waitlist> & { id: string }) => {
    const response = await api.patch<Waitlist>(`/waitlist/${id}`, data);
    return response.data;
  };

  /**
   * Update waitlist entry status (e.g., mark as contacted, scheduled)
   */
  const updateWaitlistStatus = async (id: string, status: WaitlistStatus) => {
    const response = await api.patch<Waitlist>(`/waitlist/${id}/status`, { status });
    return response.data;
  };

  /**
   * Delete a waitlist entry
   */
  const deleteWaitlistEntry = async (id: string) => {
    const response = await api.delete<void>(`/waitlist/${id}`);
    return response.data;
  };

  /**
   * React Query hook for fetching waitlist entries
   */
  const useWaitlistQuery = (
    page = 1, 
    limit = 10, 
    status?: WaitlistStatus,
    serviceType?: ServiceType
  ) => {
    return useQuery({
      queryKey: ['waitlist', page, limit, status, serviceType],
      queryFn: () => getWaitlistEntries(page, limit, status, serviceType),
    });
  };

  /**
   * React Query hook for fetching a single waitlist entry
   */
  const useWaitlistEntryQuery = (id: string) => {
    return useQuery({
      queryKey: ['waitlist-entry', id],
      queryFn: () => getWaitlistEntryById(id),
      enabled: !!id,
    });
  };

  /**
   * React Query mutation hook for creating a waitlist entry
   */
  const useCreateWaitlistEntryMutation = () => {
    return useMutation({
      mutationFn: createWaitlistEntry,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['waitlist'] });
        toast({
          title: 'Success',
          description: 'Client added to waitlist successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to add client to waitlist',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for updating a waitlist entry
   */
  const useUpdateWaitlistEntryMutation = () => {
    return useMutation({
      mutationFn: updateWaitlistEntry,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['waitlist'] });
        queryClient.invalidateQueries({ queryKey: ['waitlist-entry', data.id] });
        toast({
          title: 'Success',
          description: 'Waitlist entry updated successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update waitlist entry',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for updating waitlist status
   */
  const useUpdateWaitlistStatusMutation = () => {
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: WaitlistStatus }) => 
        updateWaitlistStatus(id, status),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['waitlist'] });
        queryClient.invalidateQueries({ queryKey: ['waitlist-entry', data.id] });
        toast({
          title: 'Success',
          description: 'Waitlist status updated successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update waitlist status',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for deleting a waitlist entry
   */
  const useDeleteWaitlistEntryMutation = () => {
    return useMutation({
      mutationFn: deleteWaitlistEntry,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['waitlist'] });
        toast({
          title: 'Success',
          description: 'Waitlist entry removed successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to remove waitlist entry',
          variant: 'destructive',
        });
      },
    });
  };

  return {
    useWaitlistQuery,
    useWaitlistEntryQuery,
    useCreateWaitlistEntryMutation,
    useUpdateWaitlistEntryMutation,
    useUpdateWaitlistStatusMutation,
    useDeleteWaitlistEntryMutation,
  };
};
