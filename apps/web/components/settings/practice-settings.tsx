'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PracticeInfo, useSettings } from '@/hooks/use-settings';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

// Practice information schema validation
const practiceSchema = z.object({
  name: z.string().min(1, 'Practice name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(5, 'ZIP code must be at least 5 digits'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  website: z.string().optional(),
  hoursOfOperation: z.object({
    monday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    tuesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    wednesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    thursday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    friday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    saturday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    sunday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
  }),
});

export function PracticeSettings() {
  const { fetchPracticeInfo, updatePracticeInfo, loading } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<PracticeInfo>({
    resolver: zodResolver(practiceSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      website: '',
      hoursOfOperation: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: true },
        sunday: { open: '09:00', close: '17:00', closed: true },
      },
    },
  });

  // Fetch practice information on component mount
  useEffect(() => {
    const loadPracticeInfo = async () => {
      setIsLoading(true);
      try {
        const practiceInfo = await fetchPracticeInfo();
        if (practiceInfo) {
          form.reset(practiceInfo);
        }
      } catch (error) {
        console.error('Failed to load practice information:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPracticeInfo();
  }, [fetchPracticeInfo, form]);

  // Handle form submission
  const onSubmit = async (data: PracticeInfo) => {
    setIsSaving(true);
    try {
      await updatePracticeInfo(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Information</CardTitle>
        <CardDescription>
          Manage details about your therapy practice.
        </CardDescription>
      </CardHeader>
      {isLoading ? (
        <CardContent className="flex justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading practice information...</p>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Practice Name</Label>
                <Input
                  id="name"
                  placeholder="Serenity Therapy Services"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, Suite 456"
                  {...form.register('address')}
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    {...form.register('city')}
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    {...form.register('state')}
                  />
                  {form.formState.errors.state && (
                    <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    placeholder="94105"
                    {...form.register('zip')}
                  />
                  {form.formState.errors.zip && (
                    <p className="text-sm text-red-500">{form.formState.errors.zip.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="(415) 555-1234"
                    {...form.register('phone')}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  placeholder="https://www.example.com"
                  {...form.register('website')}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Hours of Operation</h3>
              
              {/* Monday */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Label>Monday</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.monday.open')}
                    disabled={form.watch('hoursOfOperation.monday.closed')}
                  />
                </div>
                <div className="col-span-1 text-center">to</div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.monday.close')}
                    disabled={form.watch('hoursOfOperation.monday.closed')}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="monday-closed"
                    checked={form.watch('hoursOfOperation.monday.closed')}
                    onCheckedChange={(checked) =>
                      form.setValue('hoursOfOperation.monday.closed', checked as boolean)
                    }
                  />
                  <Label htmlFor="monday-closed" className="text-sm">Closed</Label>
                </div>
              </div>
              
              {/* Tuesday */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Label>Tuesday</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.tuesday.open')}
                    disabled={form.watch('hoursOfOperation.tuesday.closed')}
                  />
                </div>
                <div className="col-span-1 text-center">to</div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.tuesday.close')}
                    disabled={form.watch('hoursOfOperation.tuesday.closed')}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="tuesday-closed"
                    checked={form.watch('hoursOfOperation.tuesday.closed')}
                    onCheckedChange={(checked) =>
                      form.setValue('hoursOfOperation.tuesday.closed', checked as boolean)
                    }
                  />
                  <Label htmlFor="tuesday-closed" className="text-sm">Closed</Label>
                </div>
              </div>
              
              {/* Wednesday */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Label>Wednesday</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.wednesday.open')}
                    disabled={form.watch('hoursOfOperation.wednesday.closed')}
                  />
                </div>
                <div className="col-span-1 text-center">to</div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.wednesday.close')}
                    disabled={form.watch('hoursOfOperation.wednesday.closed')}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="wednesday-closed"
                    checked={form.watch('hoursOfOperation.wednesday.closed')}
                    onCheckedChange={(checked) =>
                      form.setValue('hoursOfOperation.wednesday.closed', checked as boolean)
                    }
                  />
                  <Label htmlFor="wednesday-closed" className="text-sm">Closed</Label>
                </div>
              </div>
              
              {/* Thursday */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Label>Thursday</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.thursday.open')}
                    disabled={form.watch('hoursOfOperation.thursday.closed')}
                  />
                </div>
                <div className="col-span-1 text-center">to</div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.thursday.close')}
                    disabled={form.watch('hoursOfOperation.thursday.closed')}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="thursday-closed"
                    checked={form.watch('hoursOfOperation.thursday.closed')}
                    onCheckedChange={(checked) =>
                      form.setValue('hoursOfOperation.thursday.closed', checked as boolean)
                    }
                  />
                  <Label htmlFor="thursday-closed" className="text-sm">Closed</Label>
                </div>
              </div>
              
              {/* Friday */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Label>Friday</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.friday.open')}
                    disabled={form.watch('hoursOfOperation.friday.closed')}
                  />
                </div>
                <div className="col-span-1 text-center">to</div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.friday.close')}
                    disabled={form.watch('hoursOfOperation.friday.closed')}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="friday-closed"
                    checked={form.watch('hoursOfOperation.friday.closed')}
                    onCheckedChange={(checked) =>
                      form.setValue('hoursOfOperation.friday.closed', checked as boolean)
                    }
                  />
                  <Label htmlFor="friday-closed" className="text-sm">Closed</Label>
                </div>
              </div>
              
              {/* Saturday */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Label>Saturday</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.saturday.open')}
                    disabled={form.watch('hoursOfOperation.saturday.closed')}
                  />
                </div>
                <div className="col-span-1 text-center">to</div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.saturday.close')}
                    disabled={form.watch('hoursOfOperation.saturday.closed')}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="saturday-closed"
                    checked={form.watch('hoursOfOperation.saturday.closed')}
                    onCheckedChange={(checked) =>
                      form.setValue('hoursOfOperation.saturday.closed', checked as boolean)
                    }
                  />
                  <Label htmlFor="saturday-closed" className="text-sm">Closed</Label>
                </div>
              </div>
              
              {/* Sunday */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2">
                  <Label>Sunday</Label>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.sunday.open')}
                    disabled={form.watch('hoursOfOperation.sunday.closed')}
                  />
                </div>
                <div className="col-span-1 text-center">to</div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    {...form.register('hoursOfOperation.sunday.close')}
                    disabled={form.watch('hoursOfOperation.sunday.closed')}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="sunday-closed"
                    checked={form.watch('hoursOfOperation.sunday.closed')}
                    onCheckedChange={(checked) =>
                      form.setValue('hoursOfOperation.sunday.closed', checked as boolean)
                    }
                  />
                  <Label htmlFor="sunday-closed" className="text-sm">Closed</Label>
                </div>
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
