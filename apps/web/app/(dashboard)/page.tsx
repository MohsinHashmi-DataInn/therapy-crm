"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

/**
 * Root dashboard redirect page
 * Automatically redirects to the main dashboard page
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log("[REDIRECT DEBUG] Dashboard redirect page loaded");
    console.log("[REDIRECT DEBUG] Redirecting to:", ROUTES.DASHBOARD);
    
    // Use both methods for maximum compatibility
    router.push(ROUTES.DASHBOARD);
    
    // Fallback with a slight delay
    setTimeout(() => {
      console.log("[REDIRECT DEBUG] Executing fallback redirect");
      window.location.href = ROUTES.DASHBOARD;
    }, 500);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-lg font-medium mb-2">Redirecting to Dashboard...</p>
        <p className="text-sm text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}
