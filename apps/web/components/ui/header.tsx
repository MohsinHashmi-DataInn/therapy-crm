'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, User, Bell, ChevronDown } from 'lucide-react';
import { NotificationCenter } from '../notification/notification-center';

/**
 * Header component that provides consistent navigation across all pages
 * Implements rules from section 12.1 Page Structure & Navigation
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Clients', href: '/clients' },
    { name: 'Appointments', href: '/appointments' },
    { name: 'Billing', href: '/billing' },
    { name: 'Reports', href: '/reports' },
  ];

  const profileNavigation = [
    { name: 'Your Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
    { name: 'Help', href: '/help' },
    { name: 'Sign out', href: '/auth/logout' },
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard">
                <span className="text-xl font-bold text-teal-600">Therapy CRM</span>
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    pathname.startsWith(item.href)
                      ? 'border-teal-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side actions: notifications, profile */}
          <div className="flex items-center space-x-4">
            {/* Notification Center */}
            <NotificationCenter />

            {/* Profile dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  id="user-menu-button"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center gap-x-2 rounded-full bg-gray-100 p-2">
                    <User className="h-6 w-6 text-gray-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-700 mr-1">Admin</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </div>
                </button>
              </div>

              {/* Profile dropdown menu */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  {profileNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                  pathname.startsWith(item.href)
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">Admin User</div>
                <div className="text-sm font-medium text-gray-500">admin@therapycrm.com</div>
              </div>
              <div className="ml-auto">
                <NotificationCenter />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {profileNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
