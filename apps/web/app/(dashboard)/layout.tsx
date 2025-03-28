"use client";

import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { UserProfile } from "@/components/layout/user-profile";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Redirect to login if no token found
        router.push('/login');
        return;
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);
  
  // Get the page title based on the current path
  const getPageTitle = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    
    // Get the last segment and capitalize it
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Loading...</p>
          <p className="text-sm text-muted-foreground">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  // Only render dashboard content if authenticated
  if (!isAuthenticated) {
    return null; // Router will redirect, this prevents flash of dashboard content
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
                <h1 className="text-2xl font-bold tracking-tight">{getPageTitle(pathname)}</h1>
                <p className="text-muted-foreground">
                  Manage your {getPageTitle(pathname).toLowerCase()} efficiently
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
