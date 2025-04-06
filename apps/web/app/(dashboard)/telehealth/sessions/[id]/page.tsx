'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionById, fetchSessionMetrics } from '@/lib/api/telehealth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Download, 
  FileText, 
  User,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

/**
 * Page component for viewing detailed information about a specific telehealth session
 * Includes session metadata, metrics, and recording access if available
 */
export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Fetch session details
  const { 
    data: sessionData, 
    isLoading: isLoadingSession, 
    isError: isSessionError, 
    error: sessionError 
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSessionById(sessionId),
    enabled: !!sessionId,
  });

  // Fetch session metrics
  const { 
    data: metricsData, 
    isLoading: isLoadingMetrics, 
    isError: isMetricsError, 
    error: metricsError 
  } = useQuery({
    queryKey: ['sessionMetrics', sessionId],
    queryFn: () => fetchSessionMetrics(sessionId),
    enabled: !!sessionId,
  });

  if (isLoadingSession || isLoadingMetrics) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isSessionError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {sessionError instanceof Error ? sessionError.message : 'Failed to load session details'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

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

  const statusInfo = formatStatus(sessionData?.status || 'UNKNOWN');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sessions
        </Button>
        
        {sessionData?.status === 'IN_PROGRESS' && (
          <Button>
            <Video className="h-4 w-4 mr-2" />
            Join Session
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-semibold">{sessionData?.title}</CardTitle>
                  <CardDescription>{sessionData?.description}</CardDescription>
                </div>
                <Badge className={`${statusInfo.color} font-medium`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      {sessionData?.scheduledStart
                        ? format(new Date(sessionData.scheduledStart), 'EEEE, MMMM d, yyyy')
                        : 'Date not set'}
                    </span>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      {sessionData?.scheduledStart && sessionData?.scheduledEnd
                        ? `${format(new Date(sessionData.scheduledStart), 'h:mm a')} - ${format(new Date(sessionData.scheduledEnd), 'h:mm a')}`
                        : 'Time not set'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Scheduled Duration</h3>
                    <p className="text-lg font-semibold">
                      {sessionData?.scheduledStart && sessionData?.scheduledEnd
                        ? `${Math.round((new Date(sessionData.scheduledEnd).getTime() - new Date(sessionData.scheduledStart).getTime()) / 60000)} minutes`
                        : 'Not available'}
                    </p>
                  </div>
                  {sessionData?.status === 'COMPLETED' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Actual Duration</h3>
                      <p className="text-lg font-semibold">
                        {sessionData?.actualStart && sessionData?.actualEnd
                          ? `${Math.round((new Date(sessionData.actualEnd).getTime() - new Date(sessionData.actualStart).getTime()) / 60000)} minutes`
                          : 'Not available'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Therapist</h3>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <p>{sessionData?.therapistName || `Provider #${sessionData?.providerId}`}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Client</h3>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <p>{sessionData?.clientId ? `Client #${sessionData?.clientId}` : 'No client assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Metrics */}
          {(sessionData?.status === 'COMPLETED' || sessionData?.status === 'IN_PROGRESS') && (
            <Card>
              <CardHeader>
                <CardTitle>Session Metrics</CardTitle>
                <CardDescription>Performance metrics and analytics for this session</CardDescription>
              </CardHeader>
              <CardContent>
                {isMetricsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {metricsError instanceof Error ? metricsError.message : 'Failed to load session metrics'}
                    </AlertDescription>
                  </Alert>
                ) : !metricsData ? (
                  <p className="text-gray-500">No metrics available for this session.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Start Time Difference</p>
                        <p className="text-lg font-semibold">
                          {metricsData.startTimeDifference || 0} min
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Participants</p>
                        <p className="text-lg font-semibold">
                          {metricsData.participants?.count || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Technical Issues</p>
                        <p className="text-lg font-semibold">
                          {metricsData.technicalIssues?.count || 0}
                        </p>
                      </div>
                    </div>

                    {metricsData.notes && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Session Notes</h3>
                        <p className="text-sm">{metricsData.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recordings and Resources */}
        <div className="space-y-6">
          {sessionData?.status === 'COMPLETED' && (
            <Card>
              <CardHeader>
                <CardTitle>Session Recordings</CardTitle>
                <CardDescription>Access recordings of this session</CardDescription>
              </CardHeader>
              <CardContent>
                {metricsData?.recordings?.length > 0 ? (
                  <div className="space-y-2">
                    {metricsData.recordings.map((recording: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Recording {index + 1}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recordings available for this session.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessionData?.status === 'SCHEDULED' && (
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              )}
              {sessionData?.status !== 'CANCELLED' && sessionData?.status !== 'COMPLETED' && (
                <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-700">
                  Cancel Session
                </Button>
              )}
              <Link href={`/telehealth/sessions/${sessionId}/notes`} passHref>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Session Notes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
