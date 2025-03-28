import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

/**
 * Home page / Dashboard component
 * Serves as the entry point for the application
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-lg font-semibold md:text-2xl">Therapy CRM</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href="/login">
            <Button variant="outline">Login</Button>
          </a>
          <a href="/register">
            <Button>Register</Button>
          </a>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto grid max-w-6xl gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome to Therapy CRM</h2>
            <p className="text-muted-foreground">
              Comprehensive CRM system for therapy practice management
            </p>
          </div>
          
          {/* Calendar Card - Login Prompt */}
          <Card className="col-span-1 row-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View and manage your schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="mb-4 text-center">
                  <p className="text-muted-foreground mb-2">
                    Sign in to access your appointment calendar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Manage appointments, view your schedule, and organize your day
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <a href="/login" className="w-full">
                <Button className="w-full">Sign in to View Calendar</Button>
              </a>
            </CardFooter>
          </Card>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>Manage your client information</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Easy access to client profiles, contact information, and session history.</p>
              </CardContent>
              <CardFooter>
                <a href="/login" className="w-full">
                  <Button className="w-full">Sign in to View Clients</Button>
                </a>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Schedule and manage appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Organize your schedule and keep track of upcoming sessions.</p>
              </CardContent>
              <CardFooter>
                <a href="/login" className="w-full">
                  <Button className="w-full">Sign in to View Appointments</Button>
                </a>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Waitlist</CardTitle>
                <CardDescription>Manage your waitlist</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Keep track of clients waiting for services and prioritize new appointments.</p>
              </CardContent>
              <CardFooter>
                <a href="/login" className="w-full">
                  <Button className="w-full">Sign in to View Waitlist</Button>
                </a>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t py-4 px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Therapy CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
