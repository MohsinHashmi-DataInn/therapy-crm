'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  FileText,
  User,
  CalendarDays, 
  Clock,
  CheckCircle2,
  XCircle 
} from 'lucide-react';

// Types for learner data
interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  clientName: string;
  clientId: string;
  status: 'active' | 'inactive' | 'on-hold';
  therapistName: string;
  nextSession: string | null;
}

// Mock data
const mockLearners: Learner[] = [
  {
    id: '1',
    firstName: 'Emily',
    lastName: 'Johnson',
    age: 8,
    clientName: 'Sarah Johnson',
    clientId: 'c1',
    status: 'active',
    therapistName: 'Dr. Rebecca Wilson',
    nextSession: '2025-03-26T15:30:00',
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Smith',
    age: 10,
    clientName: 'James Smith',
    clientId: 'c2',
    status: 'active',
    therapistName: 'Dr. Thomas Brown',
    nextSession: '2025-03-25T14:00:00',
  },
  {
    id: '3',
    firstName: 'Lucas',
    lastName: 'Garcia',
    age: 7,
    clientName: 'Maria Garcia',
    clientId: 'c3',
    status: 'on-hold',
    therapistName: 'Dr. Rebecca Wilson',
    nextSession: null,
  },
  {
    id: '4',
    firstName: 'Sophia',
    lastName: 'Williams',
    age: 9,
    clientName: 'David Williams',
    clientId: 'c4',
    status: 'inactive',
    therapistName: 'Dr. Robert Taylor',
    nextSession: null,
  },
  {
    id: '5',
    firstName: 'Ethan',
    lastName: 'Brown',
    age: 11,
    clientName: 'Jennifer Brown',
    clientId: 'c5',
    status: 'active',
    therapistName: 'Dr. Thomas Brown',
    nextSession: '2025-03-27T10:15:00',
  },
  {
    id: '6',
    firstName: 'Olivia',
    lastName: 'Martinez',
    age: 6,
    clientName: 'Carlos Martinez',
    clientId: 'c6',
    status: 'active',
    therapistName: 'Dr. Rebecca Wilson',
    nextSession: '2025-03-28T16:45:00',
  },
];

export default function LearnersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [therapistFilter, setTherapistFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter learners based on search term and filters
  const filteredLearners = mockLearners.filter((learner) => {
    // Apply search term filter
    const fullName = `${learner.firstName} ${learner.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
                          fullName.includes(searchLower) || 
                          learner.clientName.toLowerCase().includes(searchLower);
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || learner.status === statusFilter;
    
    // Apply therapist filter
    const matchesTherapist = therapistFilter === 'all' || 
                             learner.therapistName === therapistFilter;
    
    return matchesSearch && matchesStatus && matchesTherapist;
  });

  // Get therapists for filter dropdown
  const therapists = Array.from(new Set(mockLearners.map(learner => learner.therapistName)));

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLearners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLearners.length / itemsPerPage);

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No session scheduled';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      case 'on-hold':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            On Hold
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learners</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your learner information, profiles, and sessions.
          </p>
        </div>
        <Link
          href="/learners/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Learner
        </Link>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search learners or clients..."
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
          
          <div className="relative">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={therapistFilter}
                onChange={(e) => setTherapistFilter(e.target.value)}
              >
                <option value="all">All Therapists</option>
                {therapists.map((therapist) => (
                  <option key={therapist} value={therapist}>
                    {therapist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Learners table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Learner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Age
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Parent/Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Therapist
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Next Session
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {currentItems.length > 0 ? (
              currentItems.map((learner) => (
                <tr key={learner.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center dark:bg-gray-700">
                        <GraduationCap className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {learner.firstName} {learner.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          #{learner.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {learner.age} years
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/clients/${learner.clientId}`} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      {learner.clientName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(learner.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {learner.therapistName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {learner.nextSession ? (
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(learner.nextSession)}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        No upcoming sessions
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link 
                        href={`/learners/${learner.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/learners/${learner.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </Link>
                      <Link 
                        href={`/learners/${learner.id}/notes`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Notes
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No learners found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {filteredLearners.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastItem, filteredLearners.length)}
            </span>{' '}
            of <span className="font-medium">{filteredLearners.length}</span> learners
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
