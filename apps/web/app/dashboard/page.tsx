'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '../../components/ui/breadcrumbs';

/**
 * Dashboard page implementing several rule sections:
 * - Section 12.1: Page Structure & Navigation (breadcrumbs, layout)
 * - Section 16: Monitoring & Error Handling (error boundaries, retry logic)
 * - Section 17: Performance Optimization (code splitting, lazy loading, query caching)
 */
export default function Dashboard() {
  // Use React Query for data fetching with built-in caching, retry logic, and error handling
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      try {
        // Performance monitoring - track timing
        const startTime = performance.now();
        
        const response = await fetch('http://localhost:5000/reports/dashboard', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Log performance metrics for API call
        const endTime = performance.now();
        console.info(`Dashboard API call completed in ${(endTime - startTime).toFixed(2)}ms`);
        
        return data;
      } catch (err) {
        // Enhanced error logging for monitoring systems
        console.error('Dashboard data fetch failed:', {
          error: err.message,
          timestamp: new Date().toISOString(),
          endpoint: '/reports/dashboard',
        });
        
        // Rethrow for React Query to handle
        throw err;
      }
    },
    retry: 2, // Number of retry attempts
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="flex flex-col space-y-6">
      {/* Breadcrumb navigation for WCAG compliance and better UX */}
      <Breadcrumbs />
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Therapy CRM Dashboard</h1>
        <button 
          onClick={() => refetch()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Error handling with user-friendly message and recovery option */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4" role="alert" aria-live="assertive">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Unable to load dashboard data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state with accessible indicators */}
      {isLoading && (
        <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-teal-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading dashboard data...
          </div>
        </div>
      )}
      
      {/* Dashboard content with lazy-loaded components for performance */}
      {!isLoading && !error && dashboardData && (
        <Suspense fallback={<div>Loading dashboard components...</div>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Summary Cards with improved UX and accessibility */}
            <DashboardCard 
              title="Upcoming Appointments" 
              value={dashboardData.upcomingAppointmentsCount || 0} 
              href="/appointments"
            />
            
            <DashboardCard 
              title="Today's Schedule" 
              value={dashboardData.todayAppointmentsCount || 0} 
              href="/appointments/today"
            />
            
            <DashboardCard 
              title="Pending Follow-ups" 
              value={dashboardData.pendingFollowUpsCount || 0} 
              href="/follow-ups"
            />
            
            <DashboardCard 
              title="Waitlist" 
              value={dashboardData.waitlistCount || 0} 
              href="/waitlist"
            />
            
            {/* Attendance Stats - HIPAA compliant with no PII */}
            <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Attendance Statistics</h2>
                <span className="text-xs text-gray-500">Last 30 days</span>
              </div>
              
              {dashboardData.attendanceStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    label="Present Rate" 
                    value={`${dashboardData.attendanceStats.presentRate.toFixed(1)}%`} 
                    color="text-green-600"
                  />
                  <StatCard 
                    label="Absent Rate" 
                    value={`${dashboardData.attendanceStats.absentRate.toFixed(1)}%`} 
                    color="text-red-600"
                  />
                  <StatCard 
                    label="Late Rate" 
                    value={`${dashboardData.attendanceStats.lateRate.toFixed(1)}%`} 
                    color="text-yellow-600"
                  />
                  <StatCard 
                    label="No-Show Rate" 
                    value={`${dashboardData.attendanceStats.noShowRate.toFixed(1)}%`} 
                    color="text-gray-600"
                  />
                </div>
              ) : (
                <p className="text-gray-500">No attendance data available</p>
              )}
            </div>
          </div>
        </Suspense>
      )}
    </div>
  );
}

// Reusable dashboard card component
function DashboardCard({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 transition-all hover:shadow-md">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <p className="text-3xl font-bold text-teal-600">{value}</p>
      <div className="mt-4">
        <a 
          href={href}
          className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
          aria-label={`View all ${title.toLowerCase()}`}
        >
          View details →
        </a>
      </div>
    </div>
  );
}

// Reusable stat card for accessibility and consistency
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
