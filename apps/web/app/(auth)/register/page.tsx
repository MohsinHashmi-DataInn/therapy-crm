"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Registration form schema with validation
 */
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Registration page component
 * Handles user registration
 */
export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formStatus, setFormStatus] = useState<string>("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Handle form submission for registration
   * Submits user data to the API and handles response
   */
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setFormStatus("Submitting form...");
    
    try {
      console.log("Registration form submitted with:", data);
      setFormStatus("Sending request to API...");
      
      // Using absolute URL for API endpoint with updated fetch configuration
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.name.split(' ')[0],
          lastName: data.name.split(' ').slice(1).join(' ') || data.name.split(' ')[0],
          email: data.email,
          password: data.password,
          role: 'STAFF'
        }),
        // Updated CORS settings to match backend configuration
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache',
      });
      
      setFormStatus(`Response status: ${response.status}`);
      
      // Handle different response statuses
      let responseData;
      try {
        responseData = await response.json();
        console.log("Response data:", responseData);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        responseData = { message: 'Unable to parse server response' };
      }
      
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error('Server error: The backend service may be experiencing issues. Please try again later or contact support.');
        } else if (response.status === 409) {
          throw new Error('A user with this email already exists. Please try logging in instead.');
        } else if (response.status === 0 || !response.status) {
          throw new Error('Network error: Could not connect to the server. Please check your internet connection and try again.');
        } else {
          throw new Error(responseData.message || `Registration failed with status: ${response.status}`);
        }
      }
      
      setFormStatus("Registration successful!");
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      
      // Manually navigate to login after successful registration
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      setFormStatus(`Error: ${error instanceof Error ? error.message : "Registration failed"}`);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed. Please try again.",
        variant: "destructive",
      });
      
      // Add fallback for server errors
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast({
          title: "Connection Issue",
          description: "Could not connect to the server. Please check if the backend is running at http://localhost:5000",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if backend is running
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health', { 
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          cache: 'no-cache',
        });
        
        if (response.ok) {
          console.log("Backend connection successful");
          setFormStatus("Backend connection successful - ready to register");
        } else {
          console.error("Backend health check failed with status:", response.status);
          setFormStatus("Backend health check failed - registration may not work");
          toast({
            title: "Backend Connection Issue",
            description: "The backend service is running but returning errors. This may affect registration functionality.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Backend connection error:", error);
        setFormStatus("Backend connection error - please check if server is running");
        toast({
          title: "Backend Connection Issue",
          description: "Unable to connect to the backend service. Make sure it's running on port 5000.",
          variant: "destructive",
        });
      }
    };
    
    checkBackendConnection();
  }, [toast]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {formStatus && (
              <div className="bg-muted p-2 rounded text-sm">
                Status: {formStatus}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Login
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
