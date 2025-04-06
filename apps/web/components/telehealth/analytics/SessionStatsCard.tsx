'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Check, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';

interface SessionStatsCardProps {
  title: string;
  value: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: 'calendar' | 'clock' | 'check' | 'x';
}

/**
 * Card component to display a single analytics metric
 * Includes formatting, icons, and trend indicators
 */
export const SessionStatsCard: React.FC<SessionStatsCardProps> = ({
  title,
  value,
  percentage,
  trend = 'neutral',
  icon = 'calendar',
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'calendar':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'check':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'x':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-500" />;
    }
  };

  const renderTrend = () => {
    if (percentage === undefined) return null;

    const formattedPercentage = percentage.toFixed(1);
    
    if (trend === 'up') {
      return (
        <div className="flex items-center text-green-500">
          <ChevronUp className="h-4 w-4 mr-1" />
          <span className="text-sm">{formattedPercentage}%</span>
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-red-500">
          <ChevronDown className="h-4 w-4 mr-1" />
          <span className="text-sm">{formattedPercentage}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <span className="text-sm">{formattedPercentage}%</span>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-end space-x-1">
            <p className="text-2xl font-bold">{value}</p>
            {renderTrend()}
          </div>
        </div>
        <div className="p-2 bg-gray-100 rounded-full">
          {renderIcon()}
        </div>
      </CardContent>
    </Card>
  );
};
