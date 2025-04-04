'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingInfo, useSettings } from '@/hooks/use-settings';
import { Loader2, CreditCard, Check, Package, ArrowRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Billing information schema validation
const billingSchema = z.object({
  plan: z.enum(['basic', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
  cardNumber: z.string().min(16, 'Invalid card number').max(19, 'Invalid card number'),
  cardName: z.string().min(1, 'Cardholder name is required'),
  expiryDate: z.string().min(5, 'Invalid expiry date'),
  cvv: z.string().min(3, 'Invalid CVV').max(4, 'Invalid CVV'),
  billingAddress: z.string().min(1, 'Billing address is required'),
  billingCity: z.string().min(1, 'City is required'),
  billingState: z.string().min(1, 'State is required'),
  billingZip: z.string().min(5, 'ZIP code must be at least 5 digits'),
  billingCountry: z.string().min(1, 'Country is required'),
});

// Subscription plans data
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'For solo practitioners',
    features: [
      'Up to 25 active clients',
      'Basic scheduling',
      'Client notes',
      'Automated appointment reminders',
    ],
    monthly: 49,
    annual: 470,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing practices',
    features: [
      'Up to 100 active clients',
      'Advanced scheduling',
      'Client portal',
      'Documentation templates',
      'Online payments',
      'Telehealth sessions',
    ],
    monthly: 99,
    annual: 950,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For multi-provider practices',
    features: [
      'Unlimited clients',
      'Multiple therapist accounts',
      'Custom branding',
      'Advanced analytics',
      'Priority support',
      'HIPAA compliant file sharing',
      'Group session support',
    ],
    monthly: 199,
    annual: 1900,
  },
];

export function BillingSettings() {
  const { fetchBillingInfo, updateBillingInfo, loading } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('subscription');
  
  const form = useForm<BillingInfo>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      plan: 'professional',
      billingCycle: 'monthly',
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingZip: '',
      billingCountry: 'United States',
    },
  });

  // Fetch billing information on component mount
  useEffect(() => {
    const loadBillingInfo = async () => {
      setIsLoading(true);
      try {
        const billingInfo = await fetchBillingInfo();
        if (billingInfo) {
          form.reset(billingInfo);
        }
      } catch (error) {
        console.error('Failed to load billing information:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingInfo();
  }, [fetchBillingInfo, form]);

  // Handle form submission
  const onSubmit = async (data: BillingInfo) => {
    setIsSaving(true);
    try {
      await updateBillingInfo(data);
    } finally {
      setIsSaving(false);
    }
  };

  // Mask card number
  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '';
    const lastFour = cardNumber.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/\D/g, '').substring(0, 4);
    let formatted = input;
    
    if (input.length > 2) {
      formatted = `${input.substring(0, 2)}/${input.substring(2)}`;
    }
    
    form.setValue('expiryDate', formatted);
  };

  // Format card number with spaces
  const formatCardNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/\D/g, '').substring(0, 16);
    const blocks = [4, 4, 4, 4];
    let formatted = '';
    let currentPosition = 0;
    
    blocks.forEach((block, index) => {
      if (input.substring(currentPosition, currentPosition + block)) {
        formatted += input.substring(currentPosition, currentPosition + block);
        if (index < blocks.length - 1 && currentPosition + block < input.length) {
          formatted += ' ';
        }
      }
      currentPosition += block;
    });
    
    form.setValue('cardNumber', formatted);
  };

  // Calculate savings for annual billing
  const calculateSavings = (plan: string) => {
    const selectedPlan = subscriptionPlans.find(p => p.id === plan);
    if (!selectedPlan) return 0;
    return (selectedPlan.monthly * 12) - selectedPlan.annual;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subscription" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscription">Subscription Plan</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing cycle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="billingCycle" className={form.watch('billingCycle') === 'monthly' ? 'font-bold' : ''}>Monthly</Label>
                      <Switch
                        id="billingCycle"
                        checked={form.watch('billingCycle') === 'annual'}
                        onCheckedChange={(checked: boolean) => form.setValue('billingCycle', checked ? 'annual' : 'monthly')}
                      />
                      <Label htmlFor="billingCycle" className={form.watch('billingCycle') === 'annual' ? 'font-bold' : ''}>Annual</Label>
                    </div>
                    {form.watch('billingCycle') === 'annual' && (
                      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Save ${calculateSavings(form.watch('plan'))}
                      </span>
                    )}
                  </div>
                  
                  <RadioGroup
                    value={form.watch('plan')}
                    onValueChange={(value: string) => form.setValue('plan', value as 'basic' | 'professional' | 'enterprise')}
                    className="grid grid-cols-1 gap-4"
                  >
                    {subscriptionPlans.map((plan) => (
                      <div key={plan.id} className={`border rounded-lg p-4 ${form.watch('plan') === plan.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}>
                        <RadioGroupItem
                          value={plan.id}
                          id={plan.id}
                          className="hidden"
                        />
                        <div className="flex justify-between">
                          <div>
                            <Label htmlFor={plan.id} className="text-lg font-semibold flex items-center">
                              {plan.name}
                              {form.watch('plan') === plan.id && (
                                <Check className="h-4 w-4 ml-2 text-primary" />
                              )}
                            </Label>
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              ${form.watch('billingCycle') === 'monthly' ? plan.monthly : Math.round(plan.annual / 12)}
                              <span className="text-sm font-normal">/mo</span>
                            </div>
                            {form.watch('billingCycle') === 'annual' && (
                              <p className="text-sm text-muted-foreground">${plan.annual}/year</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-start">
                              <Check className="h-4 w-4 mr-2 text-green-500 mt-1" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {form.watch('plan') === 'basic' ? (
                  <span>Need more features? <Button variant="link" className="p-0 h-auto" onClick={() => form.setValue('plan', 'professional')}>Upgrade to Professional</Button></span>
                ) : form.watch('plan') === 'professional' ? (
                  <span>Want to scale up? <Button variant="link" className="p-0 h-auto" onClick={() => form.setValue('plan', 'enterprise')}>Upgrade to Enterprise</Button></span>
                ) : (
                  <span>You're on our most comprehensive plan</span>
                )}
              </div>
              <Button 
                type="button" 
                disabled={isSaving}
                onClick={() => {
                  // Update subscription
                  setIsSaving(true);
                  setTimeout(() => {
                    setIsSaving(false);
                    setSelectedTab('payment');
                  }, 1000);
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your payment information and billing details.
              </CardDescription>
            </CardHeader>
            {isLoading ? (
              <CardContent className="flex justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading payment information...</p>
                </div>
              </CardContent>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {/* Credit Card Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit Card Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        {...form.register('cardNumber')}
                        onChange={formatCardNumber}
                      />
                      {form.formState.errors.cardNumber && (
                        <p className="text-sm text-red-500">{form.formState.errors.cardNumber.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        {...form.register('cardName')}
                      />
                      {form.formState.errors.cardName && (
                        <p className="text-sm text-red-500">{form.formState.errors.cardName.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          {...form.register('expiryDate')}
                          onChange={formatExpiryDate}
                          maxLength={5}
                        />
                        {form.formState.errors.expiryDate && (
                          <p className="text-sm text-red-500">{form.formState.errors.expiryDate.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="123"
                          {...form.register('cvv')}
                          maxLength={4}
                        />
                        {form.formState.errors.cvv && (
                          <p className="text-sm text-red-500">{form.formState.errors.cvv.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Billing Address */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Billing Address</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Street Address</Label>
                      <Input
                        id="billingAddress"
                        placeholder="123 Main St, Suite 456"
                        {...form.register('billingAddress')}
                      />
                      {form.formState.errors.billingAddress && (
                        <p className="text-sm text-red-500">{form.formState.errors.billingAddress.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          placeholder="San Francisco"
                          {...form.register('billingCity')}
                        />
                        {form.formState.errors.billingCity && (
                          <p className="text-sm text-red-500">{form.formState.errors.billingCity.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="billingState">State</Label>
                        <Input
                          id="billingState"
                          placeholder="CA"
                          {...form.register('billingState')}
                        />
                        {form.formState.errors.billingState && (
                          <p className="text-sm text-red-500">{form.formState.errors.billingState.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingZip">ZIP Code</Label>
                        <Input
                          id="billingZip"
                          placeholder="94105"
                          {...form.register('billingZip')}
                        />
                        {form.formState.errors.billingZip && (
                          <p className="text-sm text-red-500">{form.formState.errors.billingZip.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="billingCountry">Country</Label>
                        <Input
                          id="billingCountry"
                          placeholder="United States"
                          {...form.register('billingCountry')}
                        />
                        {form.formState.errors.billingCountry && (
                          <p className="text-sm text-red-500">{form.formState.errors.billingCountry.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Subscription Summary */}
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-medium">Subscription Summary</h3>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {subscriptionPlans.find(p => p.id === form.watch('plan'))?.name} Plan ({form.watch('billingCycle') === 'monthly' ? 'Monthly' : 'Annual'})
                        </span>
                      </div>
                      <div className="font-medium">
                        ${form.watch('billingCycle') === 'monthly' 
                          ? subscriptionPlans.find(p => p.id === form.watch('plan'))?.monthly 
                          : subscriptionPlans.find(p => p.id === form.watch('plan'))?.annual}/{form.watch('billingCycle') === 'monthly' ? 'month' : 'year'}
                      </div>
                    </div>
                    {form.watch('billingCycle') === 'annual' && (
                      <div className="text-sm text-green-600">
                        You save ${calculateSavings(form.watch('plan'))} with annual billing
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setSelectedTab('subscription')}
                  >
                    Back to Plans
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Payment Information'
                    )}
                  </Button>
                </CardFooter>
              </form>
            )}
          </Card>
          
          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past invoices and payment history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="flex items-center p-4 border-b">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Invoice #INV-2023-001</p>
                    <p className="text-xs text-muted-foreground">April 1, 2023</p>
                  </div>
                  <div className="text-sm font-medium">$99.00</div>
                  <Button variant="outline" size="sm" className="ml-4">
                    Download
                  </Button>
                </div>
                <div className="flex items-center p-4 border-b">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Invoice #INV-2023-002</p>
                    <p className="text-xs text-muted-foreground">May 1, 2023</p>
                  </div>
                  <div className="text-sm font-medium">$99.00</div>
                  <Button variant="outline" size="sm" className="ml-4">
                    Download
                  </Button>
                </div>
                <div className="flex items-center p-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Invoice #INV-2023-003</p>
                    <p className="text-xs text-muted-foreground">June 1, 2023</p>
                  </div>
                  <div className="text-sm font-medium">$99.00</div>
                  <Button variant="outline" size="sm" className="ml-4">
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
