"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, Search } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPhoneNumber } from "@/lib/utils";

/**
 * Clients page component
 * Displays a list of all clients with search and filtering functionality
 */
export default function ClientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { useClientsQuery } = useClients();

  const { data, isLoading, isError } = useClientsQuery(page, 10, search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search state is already updated via onChange, so just refresh the query
    // The useClientsQuery hook will use the current search state
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button onClick={() => router.push("/clients/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-2">Loading clients...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center text-red-500">
                <p>Error loading clients. Please try again.</p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No clients found. Add your first client to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link 
                            href={`/clients/${client.id}`}
                            className="font-medium hover:underline"
                          >
                            {client.firstName} {client.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>
                          {client.phone ? formatPhoneNumber(client.phone) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : client.status === "inactive"
                              ? "bg-gray-100 text-gray-800"
                              : client.status === "waitlist"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {client.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(client.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/clients/${client.id}`)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/clients/${client.id}/edit`)}
                            >
                              Edit
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
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.meta.total)} of {data.meta.total} clients
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
