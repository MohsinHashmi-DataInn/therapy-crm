'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  homeHref?: string;
  omitHome?: boolean;
}

/**
 * Breadcrumbs component for multi-level navigation
 * Implements rules from section 12.1 Page Structure & Navigation
 */
export function Breadcrumbs({ homeHref = '/dashboard', omitHome = false }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  // Create breadcrumb segments from the URL path
  const createBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle slugs and dynamic paths with more readable names
    const formatSegment = (segment: string, index: number) => {
      // Check if segment is a slug (e.g., [id], [clientId])
      if (segment.match(/^\[.*\]$/)) {
        return 'Detail';
      }
      
      // First letter uppercase, replace hyphens with spaces
      return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    };
    
    let breadcrumbs = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const label = formatSegment(segment, index);
      
      return { href, label };
    });
    
    // Add home segment at the beginning
    if (!omitHome) {
      breadcrumbs = [{ href: homeHref, label: 'Home' }, ...breadcrumbs];
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = createBreadcrumbs();
  
  return (
    <nav className="flex py-3 px-5 text-gray-700 bg-gray-50 rounded-md" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="inline-flex items-center">
            {index === 0 ? (
              <div className="flex items-center">
                {breadcrumb.label === 'Home' && <Home className="w-4 h-4 mr-2" />}
                <Link 
                  href={breadcrumb.href}
                  className="text-sm font-medium text-gray-700 hover:text-teal-600"
                >
                  {breadcrumb.label}
                </Link>
              </div>
            ) : (
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <Link 
                  href={breadcrumb.href}
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-teal-600 md:ml-2"
                >
                  {breadcrumb.label}
                </Link>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
