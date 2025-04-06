'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClientSessionCard } from './ClientSessionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Session } from '@/types/telehealth';
import { fetchSessions, joinSession } from '@/lib/api/telehealth';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Dashboard component displaying a client's upcoming and past telehealth sessions
 * Includes filtering tabs and session cards with join functionality
 */
export const ClientSessionsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  // Fetch client sessions
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['telehealthSessions', activeTab],
    queryFn: () => fetchSessions({ 
      status: activeTab === 'upcoming' ? ['SCHEDULED', 'IN_PROGRESS'] : ['COMPLETED', 'CANCELLED'] 
    }),
  });

  // Handle session join button click
  const handleJoinSession = async (sessionId: string) => {
    try {
      const joinInfo = await joinSession(sessionId);
      if (joinInfo?.joinUrl) {
        window.open(joinInfo.joinUrl, '_blank');
      } else {
        toast({
          title: 'Unable to join session',
          description: 'The session link is not available.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: 'Session join failed',
        description: 'An error occurred when trying to join the session.',
        variant: 'destructive',
      });
    }
  };

  // Filter sessions by date for upcoming tab
  const filterUpcomingSessions = (sessions: Session[]) => {
    if (activeTab !== 'upcoming') return sessions;
    
    // Sort by scheduled start time
    return [...sessions].sort((a, b) => 
      new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
    );
  };

  // Filter sessions by date for past tab
  const filterPastSessions = (sessions: Session[]) => {
    if (activeTab !== 'past') return sessions;
    
    // Sort by scheduled start time, most recent first
    return [...sessions].sort((a, b) => 
      new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
    );
  };

  const renderSessions = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, index) => (
        <div key={`skeleton-${index}`} className="w-full mb-4">
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ));
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load sessions'}
          </AlertDescription>
        </Alert>
      );
    }

    const sessions = 
      activeTab === 'upcoming' 
        ? filterUpcomingSessions(data || [])
        : filterPastSessions(data || []);

    if (sessions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {activeTab === 'upcoming'
            ? 'You have no upcoming sessions scheduled.'
            : 'You have no past telehealth sessions.'}
        </div>
      );
    }

    return sessions.map((session) => (
      <div key={session.id} className="mb-4">
        <ClientSessionCard 
          session={session} 
          onJoin={handleJoinSession}
        />
      </div>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Telehealth Sessions</h1>
      
      <Tabs 
        defaultValue="upcoming" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {renderSessions()}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {renderSessions()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
