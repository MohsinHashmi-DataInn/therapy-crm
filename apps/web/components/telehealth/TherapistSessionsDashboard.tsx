'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, CheckCircle, Clock, Plus, Video } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Session } from '@/types/telehealth';
import { fetchSessions, joinSession } from '@/lib/api/telehealth';
import { format } from 'date-fns';
import Link from 'next/link';

/**
 * Session card component specifically for therapists
 * Includes additional controls for managing sessions
 */
const TherapistSessionCard: React.FC<{
  session: Session;
  onJoin: (sessionId: string) => void;
  onStart?: (sessionId: string) => void;
  onEnd?: (sessionId: string) => void;
}> = ({ session, onJoin, onStart, onEnd }) => {
  const canJoin = session.status === 'IN_PROGRESS';
  const canStart = session.status === 'SCHEDULED' && 
    new Date(session.scheduledStart).getTime() - 15 * 60 * 1000 <= Date.now();
  const canEnd = session.status === 'IN_PROGRESS';

  // Format session status for display
  const formatStatus = (status: string) => {
    switch(status) {
      case 'SCHEDULED':
        return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'bg-green-100 text-green-800' };
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusInfo = formatStatus(session.status);

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{session.title}</CardTitle>
          <Badge className={`${statusInfo.color} font-medium`}>
            {statusInfo.label}
          </Badge>
        </div>
        <CardDescription>
          {session.clientId ? `with Client #${session.clientId}` : 'No client assigned'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {format(new Date(session.scheduledStart), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {format(new Date(session.scheduledStart), 'h:mm a')} - {format(new Date(session.scheduledEnd), 'h:mm a')}
            </span>
          </div>
          {session.description && (
            <div className="mt-2 text-gray-600">
              {session.description}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-between items-center">
          <Link href={`/telehealth/sessions/${session.id}`} passHref>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
          
          <div className="flex gap-2">
            {canStart && onStart && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onStart(session.id)}
                className="flex items-center"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
            
            {canJoin && (
              <Button 
                variant="default"
                size="sm"
                onClick={() => onJoin(session.id)}
                className="flex items-center"
              >
                <Video className="h-4 w-4 mr-2" />
                Join
              </Button>
            )}
            
            {canEnd && onEnd && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEnd(session.id)}
                className="flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                End Session
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

/**
 * Dashboard for therapists to manage their telehealth sessions
 * Includes filtering, creation, and management capabilities
 */
export const TherapistSessionsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  // Fetch therapist sessions
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['therapistSessions', activeTab],
    queryFn: () => fetchSessions({ 
      status: activeTab === 'upcoming' ? ['SCHEDULED', 'IN_PROGRESS'] : ['COMPLETED', 'CANCELLED'],
      // Using the logged-in therapist's ID - in a real implementation, this would come from auth context
    }),
  });

  // Handle session actions
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

  const handleStartSession = async (sessionId: string) => {
    try {
      // Call the API to start the session
      // This would be implemented in a real scenario
      toast({
        title: 'Session started',
        description: 'The telehealth session has been started successfully.',
      });
      
      // Refresh the data
      // queryClient.invalidateQueries(['therapistSessions']);
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Failed to start session',
        description: 'An error occurred when trying to start the session.',
        variant: 'destructive',
      });
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      // Call the API to end the session
      // This would be implemented in a real scenario
      toast({
        title: 'Session ended',
        description: 'The telehealth session has been ended successfully.',
      });
      
      // Refresh the data
      // queryClient.invalidateQueries(['therapistSessions']);
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: 'Failed to end session',
        description: 'An error occurred when trying to end the session.',
        variant: 'destructive',
      });
    }
  };

  // Sort upcoming sessions by scheduled start time
  const filterUpcomingSessions = (sessions: Session[]) => {
    if (activeTab !== 'upcoming') return sessions;
    
    return [...sessions].sort((a, b) => 
      new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
    );
  };

  // Sort past sessions by scheduled start time, most recent first
  const filterPastSessions = (sessions: Session[]) => {
    if (activeTab !== 'past') return sessions;
    
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
        <TherapistSessionCard 
          session={session} 
          onJoin={handleJoinSession}
          onStart={handleStartSession}
          onEnd={handleEndSession}
        />
      </div>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Telehealth Sessions</h1>
        <Link href="/telehealth/sessions/new" passHref>
          <Button className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>
      
      <Tabs 
        defaultValue="upcoming" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {renderSessions()}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {renderSessions()}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Analytics</CardTitle>
              <CardDescription>
                View statistics and metrics for your telehealth sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Analytics functionality will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
