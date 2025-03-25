'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Calendar, CreditCard, FileText, Settings, 
  BarChart2, MessageSquare, HelpCircle
} from 'lucide-react';
import { useState } from 'react';

/**
 * Sidebar navigation component implementing rules from section 12.1
 * - Left sidebar for primary navigation (collapsible)
 * - Group navigation items by logical domains or user flows
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Navigation items grouped by domain
  const navigation = [
    {
      name: 'Core',
      items: [
        { name: 'Dashboard', icon: Home, href: '/dashboard' },
        { name: 'Clients', icon: Users, href: '/clients' },
        { name: 'Appointments', icon: Calendar, href: '/appointments' },
      ],
    },
    {
      name: 'Financial',
      items: [
        { name: 'Billing', icon: CreditCard, href: '/billing' },
        { name: 'Invoices', icon: FileText, href: '/invoices' },
      ],
    },
    {
      name: 'Insights',
      items: [
        { name: 'Reports', icon: BarChart2, href: '/reports' },
        { name: 'Analytics', icon: BarChart2, href: '/analytics' },
      ],
    },
    {
      name: 'Communication',
      items: [
        { name: 'Messages', icon: MessageSquare, href: '/messages' },
      ],
    },
    {
      name: 'Settings',
      items: [
        { name: 'Account Settings', icon: Settings, href: '/settings' },
        { name: 'Help & Support', icon: HelpCircle, href: '/support' },
      ],
    },
  ];

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 m-2 rounded hover:bg-gray-100 self-end"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
          </svg>
        )}
      </button>

      {/* Navigation groups */}
      <div className="mt-5 flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2" aria-label="Sidebar">
          {navigation.map((group) => (
            <div key={group.name} className="mb-6">
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.name}
                </h3>
              )}
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.startsWith(item.href)
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                  >
                    <item.icon
                      className={`${
                        pathname.startsWith(item.href) ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'
                      } ${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
