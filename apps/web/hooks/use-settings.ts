'use client';

import { useState, useCallback } from 'react';
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
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  marketingEmails: boolean;
  smsNotifications: boolean;
  notificationLeadTime: number; // hours before appointment
}

export interface PracticeInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website?: string;
  hoursOfOperation: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

export interface BillingInfo {
  plan: 'basic' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
}

export const useSettings = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!token || !user) return null;

    setLoading(true);
    try {
      const response = await api.get<UserProfile>('/users/profile');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update user profile
  const updateUserProfile = useCallback(async (profileData: UserProfile): Promise<boolean> => {
    if (!token || !user) return false;

    setLoading(true);
    try {
      await api.put('/users/profile', profileData);
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
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
  const changePassword = useCallback(async (passwordData: Omit<SecuritySettings, 'twoFactorEnabled'>): Promise<boolean> => {
    if (!token || !user) return false;
    
    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Password changed successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change password',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Update two-factor authentication status
  const updateTwoFactorAuth = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!token || !user) return false;

    setLoading(true);
    try {
      await api.put('/auth/two-factor', { enabled });
      setLoading(false);
      toast({
        title: 'Success',
        description: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
        variant: 'success',
      });
      return true;
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update two-factor authentication',
        variant: 'destructive',
      });
      return false;
    }
  }, [token, user, toast]);

  // Fetch notification preferences
  const fetchNotificationPreferences = useCallback(async (): Promise<NotificationPreferences | null> => {
    if (!token || !user) return null;

    setLoading(true);
    try {
      const response = await api.get<NotificationPreferences>('/users/notification-preferences');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (preferences: NotificationPreferences): Promise<boolean> => {
    if (!token || !user) return false;

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
    if (!token || !user) return null;

    setLoading(true);
    try {
      const response = await api.get<PracticeInfo>('/practice');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load practice information',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update practice information
  const updatePracticeInfo = useCallback(async (practiceData: PracticeInfo): Promise<boolean> => {
    if (!token || !user) return false;

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
    if (!token || !user) return null;

    setLoading(true);
    try {
      const response = await api.get<BillingInfo>('/billing');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
      return null;
    }
  }, [token, user, toast]);

  // Update billing information
  const updateBillingInfo = useCallback(async (billingData: BillingInfo): Promise<boolean> => {
    if (!token || !user) return false;

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
    if (!token || !user) return [];

    setLoading(true);
    try {
      const response = await api.get('/billing/plans');
      setLoading(false);
      return response.data.plans;
    } catch (error: any) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive',
      });
      return [];
    }
  }, [token, user, toast]);

  // Change subscription plan
  const changeSubscriptionPlan = useCallback(async (planId: string, billingCycle: 'monthly' | 'annual'): Promise<boolean> => {
    if (!token || !user) return false;

    setLoading(true);
    try {
      await api.post('/billing/change-plan', { planId, billingCycle });
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Subscription plan changed successfully',
        variant: 'success',
      });
      return true;
    } catch (error: any) {
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
    // Account settings
    fetchUserProfile,
    updateUserProfile,
    // Security settings
    changePassword,
    updateTwoFactorAuth,
    // Notification settings
    fetchNotificationPreferences,
    updateNotificationPreferences,
    // Practice settings
    fetchPracticeInfo,
    updatePracticeInfo,
    // Billing settings
    fetchBillingInfo,
    updateBillingInfo,
    getSubscriptionPlans,
    changeSubscriptionPlan,
  };
};
