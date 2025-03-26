"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Filter } from "lucide-react";
import { useWaitlist } from "@/hooks/use-waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaitlistStatus, ServiceType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/**
 * Waitlist page component
 * Displays a list of all clients on the waitlist with filtering options
 */
export default function WaitlistPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<WaitlistStatus | "">("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const { useWaitlistQuery } = useWaitlist();

  const { data, isLoading, isError } = useWaitlistQuery(
    page, 
    10, 
    status as WaitlistStatus | undefined,
    serviceType as ServiceType | undefined
  );

  // Get status badge color based on waitlist status
  const getStatusColor = (status: WaitlistStatus) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get service type display text
  const getServiceTypeDisplay = (type: ServiceType) => {
    switch (type) {
      case "individual_therapy":
        return "Individual Therapy";
      case "group_therapy":
        return "Group Therapy";
      case "family_therapy":
        return "Family Therapy";
      case "couple_therapy":
        return "Couple Therapy";
      case "assessment":
        return "Assessment";
      case "consultation":
        return "Consultation";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Waitlist</h1>
        <Button onClick={() => router.push("/waitlist/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add to Waitlist
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Waitlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={status} onValueChange={(value) => setStatus(value as WaitlistStatus | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Service Type</label>
              <Select value={serviceType} onValueChange={(value) => setServiceType(value as ServiceType | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All services</SelectItem>
                  <SelectItem value="individual_therapy">Individual Therapy</SelectItem>
                  <SelectItem value="group_therapy">Group Therapy</SelectItem>
                  <SelectItem value="family_therapy">Family Therapy</SelectItem>
                  <SelectItem value="couple_therapy">Couple Therapy</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-2">Loading waitlist...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center text-red-500">
                <p>Error loading waitlist. Please try again.</p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No waitlist entries found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((waitlistEntry) => (
                      <TableRow key={waitlistEntry.id}>
                        <TableCell className="font-medium">
                          {waitlistEntry.client?.firstName} {waitlistEntry.client?.lastName}
                        </TableCell>
                        <TableCell>{getServiceTypeDisplay(waitlistEntry.serviceType)}</TableCell>
                        <TableCell>{formatDate(waitlistEntry.requestDate)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(waitlistEntry.status)}`}>
                            {waitlistEntry.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {waitlistEntry.client?.priority === 1 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              High
                            </span>
                          )}
                          {waitlistEntry.client?.priority === 2 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Medium
                            </span>
                          )}
                          {waitlistEntry.client?.priority === 3 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Standard
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/waitlist/${waitlistEntry.id}`)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/waitlist/${waitlistEntry.id}/edit`)}
                            >
                              Update
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.meta.total)} of {data.meta.total} waitlist entries
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page === data.meta.totalPages}
                      onClick={() => setPage((prev) => Math.min(prev + 1, data.meta.totalPages))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
