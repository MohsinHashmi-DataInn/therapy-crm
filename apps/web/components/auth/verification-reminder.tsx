"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-provider";

interface VerificationReminderProps {
  email: string;
  onClose?: () => void;
}

/**
 * Verification reminder component that shows after registration
 * Provides options to resend verification email
 */
export function VerificationReminder({ email, onClose }: VerificationReminderProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { sendVerificationEmail } = useAuth();

  const handleResendEmail = async () => {
    setIsSending(true);
    setError(null);

    try {
      const success = await sendVerificationEmail(email);
      
      if (success) {
        setIsSuccess(true);
        toast({
          title: "Email Sent",
          description: "Verification email has been sent successfully",
        });
      } else {
        throw new Error("Failed to send verification email");
      }
    } catch (error: any) {
      console.error("Failed to send verification email:", error);
      setError(error.message || "Failed to send verification email. Please try again later.");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification email",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5 text-primary" />
          Verify Your Email
        </CardTitle>
        <CardDescription>
          Please verify your email address to access all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isSuccess ? (
          <Alert variant="default" className="border-green-600 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Email Sent</AlertTitle>
            <AlertDescription>
              We&apos;ve sent a verification email to <strong>{email}</strong>. 
              Please check your inbox and click the verification link.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <p>
              We&apos;ve sent a verification email to <strong>{email}</strong>. 
              Please check your inbox and click the verification link to complete your registration.
            </p>
            <p className="text-sm text-muted-foreground">
              If you didn&apos;t receive the email, please check your spam folder or click the button below to resend it.
            </p>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={handleResendEmail} 
          disabled={isSending || isSuccess}
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Email Sent
            </>
          ) : (
            "Resend Verification Email"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
