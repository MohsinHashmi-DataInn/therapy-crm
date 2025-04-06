'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchTelehealthAnalytics } from '@/lib/api/telehealth';
import { Skeleton } from '@/components/ui/skeleton';
import { TelehealthAnalytics } from '@/types/telehealth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar } from 'lucide-react';
import { SessionStatsCard } from './SessionStatsCard';
import { ProviderPerformanceChart } from './ProviderPerformanceChart';
import { ReportExportOptions } from './ReportExportOptions';
import { format, subMonths } from 'date-fns';

/**
 * Telehealth analytics dashboard component
 * Displays analytics data with filtering options and visualizations
 */
export const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [filterParams, setFilterParams] = useState({
    startDate,
    endDate
  });

  // Fetch analytics data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['telehealthAnalytics', startDate, endDate],
    queryFn: () => fetchTelehealthAnalytics(
      format(startDate, 'yyyy-MM-dd'), 
      format(endDate, 'yyyy-MM-dd')
    ),
  });

  // Handle date filter changes
  const handleFilterChange = () => {
    refetch();
  };

  const renderAnalyticsContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load analytics data'}
          </AlertDescription>
        </Alert>
      );
    }

    if (!data) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No analytics data available for the selected period.
          </AlertDescription>
        </Alert>
      );
    }

    return renderAnalyticsByTab(data);
  };

  const renderAnalyticsByTab = (analytics: TelehealthAnalytics) => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SessionStatsCard 
                title="Total Sessions"
                value={analytics.sessionCounts.total}
                icon="calendar"
              />
              <SessionStatsCard 
                title="Completed Sessions"
                value={analytics.sessionCounts.byStatus?.COMPLETED || 0}
                percentage={(analytics.sessionCounts.byStatus?.COMPLETED || 0) / analytics.sessionCounts.total * 100}
                icon="check"
              />
              <SessionStatsCard 
                title="Cancelled Sessions"
                value={analytics.sessionCounts.byStatus?.CANCELLED || 0}
                percentage={(analytics.sessionCounts.byStatus?.CANCELLED || 0) / analytics.sessionCounts.total * 100}
                icon="x"
                trend="down"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Session Duration</CardTitle>
                <CardDescription>Average duration of telehealth sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold">
                      {analytics.durations.averageScheduledDuration.toFixed(1)} min
                    </span>
                    <span className="text-sm text-gray-500">Scheduled Duration</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold">
                      {analytics.durations.averageActualDuration.toFixed(1)} min
                    </span>
                    <span className="text-sm text-gray-500">Actual Duration</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'providers':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Performance</CardTitle>
                <CardDescription>Session distribution by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderPerformanceChart providers={analytics.providers} />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Telehealth Analytics</CardTitle>
          <CardDescription>
            Session metrics and performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="providers">Provider Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {renderAnalyticsContent()}
            </TabsContent>
            
            <TabsContent value="providers" className="space-y-4">
              {renderAnalyticsContent()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
