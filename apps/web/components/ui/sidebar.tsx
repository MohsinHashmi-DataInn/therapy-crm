'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  BarChart3, 
  Settings, 
  HelpCircle,
  BookMarked,
  GraduationCap,
  Clock
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  closeSidebar: () => void;
}

export const Sidebar = ({ isOpen, isMobile, closeSidebar }: SidebarProps) => {
  const pathname = usePathname();

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  // Main navigation items
  const mainNavItems = [
    { icon: Home, name: 'Dashboard', href: '/dashboard' },
    { icon: Users, name: 'Clients', href: '/clients' },
    { icon: GraduationCap, name: 'Learners', href: '/learners' },
    { icon: Calendar, name: 'Appointments', href: '/appointments' },
    { icon: BookMarked, name: 'Session Notes', href: '/notes' },
    { icon: CreditCard, name: 'Billing', href: '/billing' },
    { icon: BarChart3, name: 'Reports', href: '/reports' },
    { icon: Clock, name: 'Waitlist', href: '/waitlist' },
  ];

  // Secondary navigation items
  const secondaryNavItems = [
    { icon: Settings, name: 'Settings', href: '/settings' },
    { icon: HelpCircle, name: 'Help & Support', href: '/help' },
  ];

  // If sidebar is closed and not on mobile, show mini version
  if (!isOpen && !isMobile) {
    return (
      <div className="h-full w-16 flex-shrink-0 border-r border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex h-full flex-col py-4">
          <nav className="flex flex-col items-center space-y-3 px-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex h-10 w-10 items-center justify-center rounded-md p-2 ${
                  pathname.startsWith(item.href)
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                title={item.name}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{item.name}</span>
              </Link>
            ))}
          </nav>
          
          <div className="mt-auto">
            <nav className="flex flex-col items-center space-y-3 px-2">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex h-10 w-10 items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  title={item.name}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    );
  }

  // Full sidebar or mobile sidebar (with backdrop)
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 transition-opacity" 
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isMobile ? 'fixed inset-y-0 left-0 z-30' : 'relative'
        } h-full w-64 flex-shrink-0 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out dark:bg-gray-800 dark:border-gray-700`}
      >
        <div className="flex h-full flex-col overflow-y-auto pt-5 pb-4">
          {/* Therapy CRM branding for mobile */}
          {isMobile && (
            <div className="flex items-center px-4 mb-5">
              <Link href="/" className="flex items-center" onClick={handleLinkClick}>
                <img
                  className="h-8 w-auto"
                  src="/logo.svg"
                  alt="Therapy CRM"
                />
                <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Therapy CRM
                </span>
              </Link>
            </div>
          )}

          {/* Main navigation */}
          <nav className="mt-5 flex-1 space-y-1 px-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                  pathname.startsWith(item.href)
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    pathname.startsWith(item.href)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Secondary navigation */}
          <div className="mt-auto border-t border-gray-200 pt-4 dark:border-gray-700">
            <nav className="space-y-1 px-2">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
