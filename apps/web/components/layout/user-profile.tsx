"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-provider";
import { User as UserType } from "@/lib/types";
import { LogOut, Settings, User, Mail, Loader2 } from "lucide-react";

/**
 * User profile dropdown component for dashboard header
 * Provides user information and account-related actions
 */
export function UserProfile() {
  const { user: authUser, logout, hasRole, sendVerificationEmail } = useAuth();
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Use authenticated user data if available, otherwise fall back to placeholder
  const user = authUser || {
    id: "",
    email: "guest@example.com",
    name: "Guest User",
    role: "USER",
    createdAt: "",
    updatedAt: "",
  };
  
  // Determine user role for display
  let roleDisplay = "User";
  if (authUser) {
    if (hasRole("ADMIN")) roleDisplay = "Administrator";
    else if (hasRole("THERAPIST")) roleDisplay = "Therapist";
  }

  // Get name for display
  const displayName = user.name || user.email;
  
  // Get initials for avatar
  const initials = displayName.charAt(0).toUpperCase();
  
  // Check if email is verified
  const isEmailVerified = authUser?.isEmailVerified || false;
  
  // Handle resend verification email
  const handleResendVerification = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!authUser?.email) return;
    
    setIsSendingVerification(true);
    
    try {
      const success = await sendVerificationEmail(authUser.email);
      if (success) {
        console.log("Verification email sent");
      }
    } catch (error) {
      console.error("Failed to send verification email:", error);
    } finally {
      setIsSendingVerification(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {roleDisplay}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          {authUser && !isEmailVerified && (
            <DropdownMenuItem
              onClick={handleResendVerification}
              disabled={isSendingVerification}
            >
              {isSendingVerification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Verify Email</span>
                </>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Logout clicked"); // Debug log
            logout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
