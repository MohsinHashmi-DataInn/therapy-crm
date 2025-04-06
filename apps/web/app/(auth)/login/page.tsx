"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";

/**
 * Login form schema with validation
 */
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Login page component
 * Handles user authentication
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login, sendVerificationEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  // Check if we need to show the resend verification dialog
  useEffect(() => {
    const resend = searchParams.get("resend");
    if (resend === "true") {
      setShowVerificationDialog(true);
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Handle form submission for login
   * Uses the auth context to authenticate and handle redirection
   */
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Use the auth context login method for actual API authentication
      const success = await login({ email: data.email, password: data.password });
      
      if (success) {
        // Auth provider will handle the redirection to dashboard
        console.log("Login successful");
      } else {
        // Login method already shows toast errors
        console.log("Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle resend verification email form submission
   */
  const handleResendVerification = async () => {
    if (!verificationEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setVerificationLoading(true);
    
    try {
      const success = await sendVerificationEmail(verificationEmail);
      if (success) {
        setVerificationSuccess(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };
  
  const closeVerificationDialog = () => {
    setShowVerificationDialog(false);
    setVerificationEmail("");
    setVerificationSuccess(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <div className="w-full flex flex-col space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href={ROUTES.REGISTER}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Register
                </Link>
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Haven't verified your email?{" "}
                <button
                  type="button"
                  onClick={() => setShowVerificationDialog(true)}
                  className="text-primary underline-offset-4 hover:underline bg-transparent border-none p-0 cursor-pointer inline"
                >
                  Resend verification email
                </button>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      {/* Verification Email Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resend Verification Email</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a new verification link.
            </DialogDescription>
          </DialogHeader>
          
          {verificationSuccess ? (
            <div className="py-6">
              <Alert className="mb-4 border-green-600">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Email Sent</AlertTitle>
                <AlertDescription>
                  Verification email has been sent successfully. Please check your inbox.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="verification-email">Email</Label>
                <Input
                  id="verification-email"
                  type="email"
                  placeholder="name@example.com"
                  value={verificationEmail}
                  onChange={(e) => setVerificationEmail(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            {verificationSuccess ? (
              <Button type="button" onClick={closeVerificationDialog}>
                Close
              </Button>
            ) : (
              <Button type="button" onClick={handleResendVerification} disabled={verificationLoading}>
                {verificationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Verification Email"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
