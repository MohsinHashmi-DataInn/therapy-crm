'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Provider {
  providerId: string;
  providerName: string;
  sessionCount: number;
}

interface ProviderPerformanceChartProps {
  providers: Provider[];
}

/**
 * Bar chart component for visualizing telehealth provider performance
 * Shows session count distribution across providers
 */
export const ProviderPerformanceChart: React.FC<ProviderPerformanceChartProps> = ({ providers }) => {
  // Format data for the chart
  const chartData = providers.map(provider => ({
    name: provider.providerName || `Provider ${provider.providerId}`,
    sessions: provider.sessionCount,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No provider data available for the selected period.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            height={60}
            tickMargin={10}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} sessions`, 'Sessions']}
            labelFormatter={(label) => `Provider: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey="sessions" 
            name="Total Sessions" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
