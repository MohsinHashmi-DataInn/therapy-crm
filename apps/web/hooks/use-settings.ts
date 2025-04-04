'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './use-auth';

// Types for settings forms
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  title?: string;
  bio?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  appointmentReminders: boolean;
  marketingUpdates: boolean;
}

export interface PracticeInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  taxId?: string;
  npi?: string;
}

export interface BillingInfo {
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: Date;
  paymentMethod: {
    type: 'card' | 'bank';
    last4: string;
    expiryDate?: string;
  };
}

/**
 * Hook for managing user settings and preferences
 * Provides functions for fetching and updating various settings
 */
export const useSettings = () => {
  const { toast } = useToast();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const requestInProgress = useRef<boolean>(false);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!token || !user) {
      return null;
    }

    if (requestInProgress.current) {
      return profileData;
    }

    if (profileData) {
      return profileData; // Return existing data if already fetched
    }

    requestInProgress.current = true;
    setLoading(true);

    try {
      const response = await api.get<UserProfile>('/auth/profile');
      const data = response.data;
      setProfileData(data);
      setLoading(false);
      requestInProgress.current = false;
      return data;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      requestInProgress.current = false;
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load profile',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update user profile
  const updateUserProfile = useCallback(async (profileData: UserProfile): Promise<boolean> => {
    if (!token || !user) {
      return false;
    }

    setLoading(true);
    try {
      await api.put('/auth/profile', profileData);
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!token || !user) {
      return false;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Password changed successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change password',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Toggle two-factor authentication
  const toggleTwoFactor = useCallback(async (enable: boolean): Promise<boolean> => {
    if (!token || !user) {
      return false;
    }

    setLoading(true);
    try {
      await api.post('/auth/two-factor', { enable });
      setLoading(false);
      toast({
        title: 'Success',
        description: `Two-factor authentication ${enable ? 'enabled' : 'disabled'}`,
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to toggle two-factor authentication',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Fetch notification preferences
  const fetchNotificationPreferences = useCallback(async (): Promise<NotificationPreferences | null> => {
    if (!token || !user) {
      return null;
    }

    setLoading(true);
    try {
      const response = await api.get<NotificationPreferences>('/users/notification-preferences');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load notification preferences',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (preferences: NotificationPreferences): Promise<boolean> => {
    if (!token || !user) {
      return false;
    }

    setLoading(true);
    try {
      await api.put('/users/notification-preferences', preferences);
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update notification preferences',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Fetch practice information
  const fetchPracticeInfo = useCallback(async (): Promise<PracticeInfo | null> => {
    if (!token || !user) {
      return null;
    }

    setLoading(true);
    try {
      const response = await api.get<PracticeInfo>('/practice');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load practice information',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update practice information
  const updatePracticeInfo = useCallback(async (practiceData: PracticeInfo): Promise<boolean> => {
    if (!token || !user) {
      return false;
    }

    setLoading(true);
    try {
      await api.put('/practice', practiceData);
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Practice information updated successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update practice information',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Fetch billing information
  const fetchBillingInfo = useCallback(async (): Promise<BillingInfo | null> => {
    if (!token || !user) {
      return null;
    }

    setLoading(true);
    try {
      const response = await api.get<BillingInfo>('/billing');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load billing information',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update billing information
  const updateBillingInfo = useCallback(async (billingData: BillingInfo): Promise<boolean> => {
    if (!token || !user) {
      return false;
    }

    setLoading(true);
    try {
      await api.put('/billing', billingData);
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Billing information updated successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update billing information',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Get subscription plans
  const getSubscriptionPlans = useCallback(async () => {
    if (!token || !user) {
      return [];
    }

    setLoading(true);
    try {
      const response = await api.get('/billing/plans');
      setLoading(false);
      return response.data.plans;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load subscription plans',
        variant: 'destructive',
      });
      return [];
    }
  }, [token, user, toast]);

  // Change subscription plan
  const changeSubscriptionPlan = useCallback(async (planId: string, billingCycle: 'monthly' | 'annual'): Promise<boolean> => {
    if (!token || !user) {
      return false;
    }

    setLoading(true);
    try {
      await api.post('/billing/subscribe', { planId, billingCycle });
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Subscription plan changed successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      console.error('API call failed:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change subscription plan',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  return {
    loading,
    profileData,
    fetchUserProfile,
    updateUserProfile,
    changePassword,
    toggleTwoFactor,
    fetchNotificationPreferences,
    updateNotificationPreferences,
    fetchPracticeInfo,
    updatePracticeInfo,
    fetchBillingInfo,
    updateBillingInfo,
    getSubscriptionPlans,
    changeSubscriptionPlan,
  };
};
