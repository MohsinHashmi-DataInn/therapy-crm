'use client';

import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Video } from 'lucide-react';
import { Session } from '@/types/telehealth';

interface ClientSessionCardProps {
  session: Session;
  onJoin: (sessionId: string) => void;
}

/**
 * Card component that displays telehealth session details for clients
 * Shows title, time, status, and join button when session is active
 */
export const ClientSessionCard: React.FC<ClientSessionCardProps> = ({ session, onJoin }) => {
  // Determine if the join button should be enabled based on session status and time
  const canJoin = session.status === 'IN_PROGRESS' || 
    (session.status === 'SCHEDULED' && 
     new Date(session.scheduledStart).getTime() - 5 * 60 * 1000 <= Date.now());
  
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
          {session.therapistName ? `with ${session.therapistName}` : 'Telehealth Session'}
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
        <div className="w-full flex justify-end">
          <Button 
            variant={canJoin ? "default" : "outline"}
            disabled={!canJoin}
            onClick={() => onJoin(session.id)}
            className="flex items-center"
          >
            <Video className="h-4 w-4 mr-2" />
            {canJoin ? 'Join Session' : 'Session Not Active'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
