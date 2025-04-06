"use client";

import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { UserProfile } from "@/components/layout/user-profile";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";

/**
 * Dashboard layout for authenticated pages
 * Provides consistent layout with sidebar navigation and header
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Use the auth context for authentication state
  const { user, loading, isAuthenticated } = useAuth();
  
  // Redirection is now handled centrally in the AuthProvider
  // No need for duplicate redirect logic here
  
  // Get the page title based on the current path
  const getPageTitle = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    
    // Get the last segment and capitalize it
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium mb-2">Loading...</p>
          <p className="text-sm text-muted-foreground">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  // Only render dashboard content if authenticated
  // This is a visual guard only - actual redirect happens in AuthProvider
  if (!user) {
    return null; // Don't render content for unauthenticated users
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <h1 className="text-xl font-bold">Therapy CRM</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <UserProfile />
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <div className="h-full py-6 pr-6 md:py-8">
            <MainNav />
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          <div className="py-6 md:py-8">
            <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="grid gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{getPageTitle(pathname || '')}</h1>
                <p className="text-muted-foreground">
                  Manage your {getPageTitle(pathname || '').toLowerCase()} efficiently
                </p>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
