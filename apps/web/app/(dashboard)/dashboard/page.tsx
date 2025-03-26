import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Therapy CRM - Dashboard",
  description: "Overview of your therapy practice",
};

/**
 * Dashboard page component
 * Displays summary cards and key performance metrics
 */
export default function DashboardPage() {
  // In a real implementation, this data would come from API calls
  const dashboardData = {
    totalClients: 48,
    activeClients: 32,
    upcomingAppointments: 12,
    waitlistCount: 8,
    recentCommunications: 15,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData.totalClients}</div>
          <p className="text-xs text-muted-foreground">
            {dashboardData.activeClients} active clients
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData.upcomingAppointments}</div>
          <p className="text-xs text-muted-foreground">Next 7 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData.waitlistCount}</div>
          <p className="text-xs text-muted-foreground">Clients waiting for services</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Communications</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData.recentCommunications}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>
      
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Welcome to Therapy CRM</CardTitle>
          <CardDescription>
            Here's an overview of your therapy practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            This dashboard provides a quick overview of your therapy practice. Use the navigation
            menu to access detailed views for clients, appointments, waitlist management, and
            communications.
          </p>
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Quick Tips:</h4>
            <ul className="list-disc pl-5 text-sm">
              <li>Click on card metrics to see detailed information</li>
              <li>Use the sidebar to navigate between different sections</li>
              <li>Check the appointments calendar for your upcoming schedule</li>
              <li>Review your waitlist to manage client priorities</li>
              <li>Manage client communications from the communications page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
