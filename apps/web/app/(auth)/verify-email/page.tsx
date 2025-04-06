"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-provider";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Get token from URL query parameter
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      verifyEmail(urlToken);
    } else {
      setError("Invalid or missing verification token. Please request a new verification link.");
    }
  }, [searchParams]);

  // Get auth context for email verification
  const { verifyEmail: verifyEmailWithContext } = useAuth();

  // Function to verify email with the backend
  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const success = await verifyEmailWithContext(verificationToken);
      
      if (success) {
        setIsSuccess(true);
        toast({
          title: "Success",
          description: "Your email has been verified successfully.",
        });
      } else {
        throw new Error("Email verification failed");
      }
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage = error.message || "An error occurred while verifying your email. Please try again later.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push(ROUTES.LOGIN);
  };

  // Get auth context for sending verification email
  const { sendVerificationEmail } = useAuth();

  const handleResendVerification = async () => {
    // If token exists, try to extract the email from it (token might be a JWT)
    // Otherwise, redirect to login with resend parameter
    if (token) {
      try {
        // Get email from localStorage if user is logged in
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          if (userData.email) {
            await sendVerificationEmail(userData.email);
            toast({
              title: "Verification Email Sent",
              description: "Please check your inbox for a new verification link.",
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error sending verification email:", error);
      }
    }
    
    // Fallback: redirect to login page with resend parameter
    router.push(`${ROUTES.LOGIN}?resend=true`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSuccess ? "Email Verified" : "Verifying Your Email"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSuccess
              ? "Your email has been successfully verified."
              : "Please wait while we verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-center">
            {isVerifying ? (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            ) : isSuccess ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : error ? (
              <AlertCircle className="h-16 w-16 text-red-500" />
            ) : null}
          </div>

          {isSuccess && (
            <div className="space-y-4 mt-4">
              <p className="text-center font-medium text-lg">Your account is now fully activated!</p>
              <div className="bg-slate-50 p-4 rounded-md border">
                <h3 className="font-medium mb-2">What's next?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Access your personalized dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Manage your therapy sessions and appointments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Complete your profile for a personalized experience</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4">
              <p className="text-center">If the verification link has expired, you can request a new one from the login page.</p>
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline"
                  asChild
                >
                  <Link href={ROUTES.LOGIN}>Return to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
