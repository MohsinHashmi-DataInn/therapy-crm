'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPreferences, useSettings } from '@/hooks/use-settings';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Notification preferences schema validation
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  appointmentReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  smsNotifications: z.boolean().default(true),
  notificationLeadTime: z.number().min(1).max(72),
});

export function NotificationSettings() {
  const { fetchNotificationPreferences, updateNotificationPreferences, loading } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      appointmentReminders: true,
      marketingEmails: false,
      smsNotifications: true,
      notificationLeadTime: 24,
    },
  });

  // Fetch notification preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const preferences = await fetchNotificationPreferences();
        if (preferences) {
          form.reset(preferences);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [fetchNotificationPreferences, form]);

  // Handle form submission
  const onSubmit = async (data: NotificationPreferences) => {
    setIsSaving(true);
    try {
      await updateNotificationPreferences(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications.
        </CardDescription>
      </CardHeader>
      {isLoading ? (
        <CardContent className="flex justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading preferences...</p>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Email Notifications</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">General Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive system notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={form.watch('emailNotifications')}
                  onCheckedChange={(checked) => form.setValue('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appointmentReminders">Appointment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email reminders about upcoming appointments
                  </p>
                </div>
                <Switch
                  id="appointmentReminders"
                  checked={form.watch('appointmentReminders')}
                  onCheckedChange={(checked) => form.setValue('appointmentReminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive product updates and promotional emails
                  </p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={form.watch('marketingEmails')}
                  onCheckedChange={(checked) => form.setValue('marketingEmails', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">SMS Notifications</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotifications">Text Message Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important notifications via SMS
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={form.watch('smsNotifications')}
                  onCheckedChange={(checked) => form.setValue('smsNotifications', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notificationLeadTime">Notification Lead Time</Label>
              <p className="text-sm text-muted-foreground mb-2">
                How many hours before an appointment should we send a reminder?
              </p>
              <div className="max-w-xs">
                <Select
                  value={form.watch('notificationLeadTime').toString()}
                  onValueChange={(value) => form.setValue('notificationLeadTime', parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="4">4 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                    <SelectItem value="72">72 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
