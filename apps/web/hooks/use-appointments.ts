'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Appointment, PaginatedResponse, AppointmentStatus } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for appointment data management
 * Provides functions to fetch, create, update, and delete appointments
 */
export const useAppointments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Fetch appointments with optional pagination, filtering and date range
   */
  const getAppointments = async (
    page = 1, 
    limit = 10, 
    startDate?: string, 
    endDate?: string, 
    status?: AppointmentStatus,
    therapistId?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);
    if (therapistId) params.append('therapistId', therapistId);

    const response = await api.get<PaginatedResponse<Appointment>>(`/appointments?${params.toString()}`);
    return response.data;
  };

  /**
   * Fetch a single appointment by ID
   */
  const getAppointmentById = async (id: string) => {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  };

  /**
   * Create a new appointment
   */
  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Appointment>('/appointments', appointment);
    return response.data;
  };

  /**
   * Update an existing appointment
   */
  const updateAppointment = async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
    const response = await api.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  };

  /**
   * Update appointment status (e.g., mark as completed, cancelled)
   */
  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    const response = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
    return response.data;
  };

  /**
   * Delete an appointment
   */
  const deleteAppointment = async (id: string) => {
    const response = await api.delete<void>(`/appointments/${id}`);
    return response.data;
  };

  /**
   * React Query hook for fetching appointments
   */
  const useAppointmentsQuery = (
    page = 1, 
    limit = 10, 
    startDate?: string, 
    endDate?: string, 
    status?: AppointmentStatus,
    therapistId?: string
  ) => {
    return useQuery({
      queryKey: ['appointments', page, limit, startDate, endDate, status, therapistId],
      queryFn: () => getAppointments(page, limit, startDate, endDate, status, therapistId),
    });
  };

  /**
   * React Query hook for fetching a single appointment
   */
  const useAppointmentQuery = (id: string) => {
    return useQuery({
      queryKey: ['appointment', id],
      queryFn: () => getAppointmentById(id),
      enabled: !!id,
    });
  };

  /**
   * React Query mutation hook for creating an appointment
   */
  const useCreateAppointmentMutation = () => {
    return useMutation({
      mutationFn: createAppointment,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        toast({
          title: 'Success',
          description: 'Appointment created successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create appointment',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for updating an appointment
   */
  const useUpdateAppointmentMutation = () => {
    return useMutation({
      mutationFn: updateAppointment,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['appointment', data.id] });
        toast({
          title: 'Success',
          description: 'Appointment updated successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update appointment',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for updating appointment status
   */
  const useUpdateAppointmentStatusMutation = () => {
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => 
        updateAppointmentStatus(id, status),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['appointment', data.id] });
        toast({
          title: 'Success',
          description: 'Appointment status updated successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update appointment status',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for deleting an appointment
   */
  const useDeleteAppointmentMutation = () => {
    return useMutation({
      mutationFn: deleteAppointment,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        toast({
          title: 'Success',
          description: 'Appointment deleted successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to delete appointment',
          variant: 'destructive',
        });
      },
    });
  };

  return {
    useAppointmentsQuery,
    useAppointmentQuery,
    useCreateAppointmentMutation,
    useUpdateAppointmentMutation,
    useUpdateAppointmentStatusMutation,
    useDeleteAppointmentMutation,
  };
};
