'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  Calendar, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';

// Client type definition
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  lastAppointment: string | null;
  nextAppointment: string | null;
  therapistId: string;
  therapistName: string;
}

// Mock data for development
const mockClients: Client[] = Array.from({ length: 15 }, (_, i) => ({
  id: `client-${i + 1}`,
  name: `Client ${i + 1}`,
  email: `client${i + 1}@example.com`,
  phone: `(555) ${100 + i}-${1000 + i}`,
  status: i % 5 === 0 ? 'inactive' : i % 7 === 0 ? 'pending' : 'active',
  lastAppointment: i % 3 === 0 ? null : `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
  nextAppointment: i % 4 === 0 ? null : `2023-${((i + 1) % 12) + 1}-${(i % 28) + 1}`,
  therapistId: `therapist-${(i % 3) + 1}`,
  therapistName: `Dr. Therapist ${(i % 3) + 1}`,
}));

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for client list and pagination
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [therapistFilter, setTherapistFilter] = useState<string>('all');
  const itemsPerPage = 10;

  // Load clients (replace with API call in production)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setClients(mockClients);
      setFilteredClients(mockClients);
      setIsLoading(false);
    }, 500);

    // Get search params
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'all';
    const therapist = searchParams.get('therapist') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);

    setSearchQuery(query);
    setStatusFilter(status);
    setTherapistFilter(therapist);
    setCurrentPage(page);
  }, [searchParams]);

  // Filter clients when search or filter changes
  useEffect(() => {
    let result = clients;

    // Apply search filter
    if (searchQuery) {
      result = result.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter);
    }

    // Apply therapist filter
    if (therapistFilter !== 'all') {
      result = result.filter(client => client.therapistId === therapistFilter);
    }

    setFilteredClients(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, therapistFilter, clients]);

  // Get paginated data
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Navigation handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClientClick = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleAddClient = () => {
    router.push('/clients/new');
  };

  const handleExport = () => {
    alert('Export functionality will be implemented here');
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Get unique therapists for filter
  const therapistOptions = [
    {id: 'all', name: 'All Therapists'},
    ...Array.from(new Set(clients.map(client => client.therapistId))).map(id => {
      const client = clients.find(c => c.therapistId === id);
      return {id, name: client?.therapistName || 'Unknown'};
    })
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button
          onClick={handleAddClient}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-4">
            <select
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            
            <select
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
            >
              {therapistOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleExport}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Client list */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No clients found matching your criteria.</p>
          <button
            onClick={handleAddClient}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Therapist
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Appointment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleClientClick(client.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                          <div className="text-sm text-gray-500">{client.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${client.status === 'active' ? 'bg-green-100 text-green-800' : 
                          client.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.therapistName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.nextAppointment ? new Date(client.nextAppointment).toLocaleDateString() : 'None Scheduled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/clients/${client.id}/appointments`);
                          }}
                        >
                          <Calendar className="h-5 w-5" title="Schedule" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/clients/${client.id}/notes`);
                          }}
                        >
                          <FileText className="h-5 w-5" title="Notes" />
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`More options for ${client.name}`);
                          }}
                        >
                          <MoreHorizontal className="h-5 w-5" title="More" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                    ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                    ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredClients.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredClients.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium 
                        ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                      // Show pages around the current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + idx;
                      } else {
                        pageNum = currentPage - 2 + idx;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${currentPage === pageNum 
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium 
                        ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
