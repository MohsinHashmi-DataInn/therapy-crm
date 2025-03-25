'use client';

import Link from 'next/link';

/**
 * Footer component providing consistent legal links, copyright info and contact across all pages
 * Implements rules from section 12.1 Page Structure & Navigation
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2 space-x-6">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {currentYear} Therapy CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
