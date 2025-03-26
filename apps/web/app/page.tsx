import { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Therapy CRM - Dashboard",
  description: "Therapy practice management dashboard",
};

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
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
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
                <Link href="/clients" className="w-full">
                  <Button className="w-full">View Clients</Button>
                </Link>
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
                <Link href="/appointments" className="w-full">
                  <Button className="w-full">View Calendar</Button>
                </Link>
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
                <Link href="/waitlist" className="w-full">
                  <Button className="w-full">View Waitlist</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t bg-background px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:gap-6">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Therapy CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
