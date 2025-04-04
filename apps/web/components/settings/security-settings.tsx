'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SecuritySettings, useSettings } from '@/hooks/use-settings';
import { Switch } from '@/components/ui/switch';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

// Password schema validation
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
  twoFactorEnabled: z.boolean().default(false),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function SecuritySettings() {
  const { changePassword, updateTwoFactorAuth, loading } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [hasTwoFactorChanged, setHasTwoFactorChanged] = useState(false);
  
  const form = useForm<SecuritySettings>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: SecuritySettings) => {
    setIsSaving(true);
    try {
      const { currentPassword, newPassword, confirmPassword } = data;
      // Don't proceed if passwords don't match
      if (newPassword !== confirmPassword) {
        return;
      }
      
      await changePassword({ currentPassword, newPassword, confirmPassword });
      form.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: form.getValues().twoFactorEnabled,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle two-factor authentication toggle
  const handleTwoFactorToggle = async (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    setHasTwoFactorChanged(true);
  };

  // Save two-factor authentication setting
  const saveTwoFactorSettings = async () => {
    if (!hasTwoFactorChanged) return;
    
    setIsSaving(true);
    try {
      await updateTwoFactorAuth(twoFactorEnabled);
      setHasTwoFactorChanged(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password to maintain security.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...form.register('currentPassword')}
              />
              {form.formState.errors.currentPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.currentPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...form.register('newPassword')}
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.newPassword.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 text-sm flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium text-yellow-800">Password requirements:</strong>
                <ul className="list-disc list-inside text-yellow-700 mt-1 text-xs space-y-1">
                  <li>At least 8 characters long</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                twoFactorEnabled: form.getValues().twoFactorEnabled,
              })}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                Require a verification code in addition to your password when signing in.
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
              aria-label="Toggle two-factor authentication"
            />
          </div>
        </CardContent>
        {hasTwoFactorChanged && (
          <CardFooter className="flex justify-end space-x-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                setHasTwoFactorChanged(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveTwoFactorSettings} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Session Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage and monitor all your active sessions across devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="flex items-center p-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Current Session</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Shield className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium mr-2">Active</span>
                  <span>Last active: Just now</span>
                </div>
              </div>
              <div className="text-xs text-right">
                <p className="font-medium">Your Device</p>
                <p className="text-muted-foreground">Current browser</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button type="button" variant="destructive">
            Sign Out All Other Sessions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
