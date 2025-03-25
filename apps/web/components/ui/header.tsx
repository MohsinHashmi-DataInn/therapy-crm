'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Bell, User, Search, Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header = ({ toggleSidebar, isSidebarOpen }: HeaderProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<number>(2); // Example notification count
  const pathname = usePathname();

  const toggleDarkMode = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark');
      setIsDarkMode(!isDarkMode);
      
      // Store preference in localStorage
      localStorage.setItem('darkMode', (!isDarkMode).toString());
    }
  };

  // Menu items for the user dropdown
  const userMenuItems = [
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
    { label: 'Help', href: '/help' },
    { label: 'Sign out', href: '/auth/logout' }
  ];

  // Quick action items
  const quickActions = [
    { label: 'New Client', href: '/clients/new' },
    { label: 'New Appointment', href: '/appointments/new' },
    { label: 'New Note', href: '/notes/new' }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section: Menu toggle and Logo */}
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
            <Link href="/" className="flex flex-shrink-0 items-center ml-4 lg:ml-0">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="Therapy CRM"
              />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
                Therapy CRM
              </span>
            </Link>
          </div>

          {/* Center section: Primary navigation */}
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/dashboard" currentPath={pathname}>Dashboard</NavLink>
            <NavLink href="/clients" currentPath={pathname}>Clients</NavLink>
            <NavLink href="/learners" currentPath={pathname}>Learners</NavLink>
            <NavLink href="/appointments" currentPath={pathname}>Appointments</NavLink>
            <NavLink href="/reports" currentPath={pathname}>Reports</NavLink>
          </nav>

          {/* Right section: Search, notifications, theme toggle, and user menu */}
          <div className="flex items-center space-x-4">
            {/* Search button/input */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="absolute right-0 top-0 w-80 z-10">
                  <div className="flex items-center border rounded-md bg-white dark:bg-gray-700 shadow-lg">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full px-4 py-2 rounded-md border-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      autoFocus
                      onBlur={() => setIsSearchOpen(false)}
                    />
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="p-2 text-gray-500 dark:text-gray-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
                    {notifications}
                  </span>
                )}
              </button>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User dropdown */}
            <div className="relative group">
              <button
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="User menu"
              >
                <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                  <User className="h-5 w-5" />
                </span>
              </button>
              
              {/* Dropdown menu */}
              <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">admin@example.com</p>
                  </div>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick actions dropdown */}
            <div className="relative group hidden md:block">
              <button
                className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New <span className="ml-1">+</span>
              </button>
              
              {/* Dropdown menu for quick actions */}
              <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Helper component for navigation links
const NavLink = ({ href, children, currentPath }: { href: string; children: React.ReactNode; currentPath: string }) => {
  const isActive = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`px-1 py-2 text-sm font-medium ${
        isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {children}
    </Link>
  );
};
