'use client';

import React from 'react';
import { ClientSessionsDashboard } from '@/components/telehealth/ClientSessionsDashboard';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { TherapistSessionsDashboard } from '@/components/telehealth/TherapistSessionsDashboard';

/**
 * Telehealth page that displays the appropriate dashboard based on user role
 */
export default function TelehealthPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  // Display proper dashboard based on user role
  return (
    <div className="min-h-screen">
      {user?.role === UserRole.THERAPIST ? (
        <TherapistSessionsDashboard />
      ) : (
        <ClientSessionsDashboard />
      )}
    </div>
  );
}
