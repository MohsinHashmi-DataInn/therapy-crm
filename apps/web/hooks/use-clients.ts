'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Client, PaginatedResponse } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for client data management
 * Provides functions to fetch, create, update, and delete clients
 */
export const useClients = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Fetch clients with optional pagination and filtering
   */
  const getClients = async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    const response = await api.get<PaginatedResponse<Client>>(`/clients?${params.toString()}`);
    return response.data;
  };

  /**
   * Fetch a single client by ID
   */
  const getClientById = async (id: string) => {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  };

  /**
   * Create a new client
   */
  const createClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Client>('/clients', client);
    return response.data;
  };

  /**
   * Update an existing client
   */
  const updateClient = async ({ id, ...data }: Partial<Client> & { id: string }) => {
    const response = await api.patch<Client>(`/clients/${id}`, data);
    return response.data;
  };

  /**
   * Delete a client
   */
  const deleteClient = async (id: string) => {
    const response = await api.delete<void>(`/clients/${id}`);
    return response.data;
  };

  /**
   * React Query hook for fetching clients
   */
  const useClientsQuery = (page = 1, limit = 10, search?: string) => {
    return useQuery({
      queryKey: ['clients', page, limit, search],
      queryFn: () => getClients(page, limit, search),
    });
  };

  /**
   * React Query hook for fetching a single client
   */
  const useClientQuery = (id: string) => {
    return useQuery({
      queryKey: ['client', id],
      queryFn: () => getClientById(id),
      enabled: !!id,
    });
  };

  /**
   * React Query mutation hook for creating a client
   */
  const useCreateClientMutation = () => {
    return useMutation({
      mutationFn: createClient,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        toast({
          title: 'Success',
          description: 'Client created successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create client',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for updating a client
   */
  const useUpdateClientMutation = () => {
    return useMutation({
      mutationFn: updateClient,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['client', data.id] });
        toast({
          title: 'Success',
          description: 'Client updated successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update client',
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * React Query mutation hook for deleting a client
   */
  const useDeleteClientMutation = () => {
    return useMutation({
      mutationFn: deleteClient,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        toast({
          title: 'Success',
          description: 'Client deleted successfully',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to delete client',
          variant: 'destructive',
        });
      },
    });
  };

  return {
    useClientsQuery,
    useClientQuery,
    useCreateClientMutation,
    useUpdateClientMutation,
    useDeleteClientMutation,
  };
};
