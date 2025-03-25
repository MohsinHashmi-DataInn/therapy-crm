'use client';

import Link from 'next/link';

/**
 * Footer component providing consistent legal links, copyright info and contact across all pages
 * Implements rules from section 12.1 Page Structure & Navigation
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const legalLinks = [
    { name: 'Privacy Policy', href: '/legal/privacy-policy' },
    { name: 'Terms of Service', href: '/legal/terms-of-service' },
    { name: 'HIPAA Compliance', href: '/legal/hipaa-compliance' },
    { name: 'Cookie Policy', href: '/legal/cookie-policy' },
  ];

  const contactLinks = [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Support', href: '/support' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Information */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-gray-900">Therapy CRM</h3>
            <p className="mt-2 text-sm text-gray-500">
              A comprehensive practice management solution designed for therapists and mental health professionals.
            </p>
          </div>
          
          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-gray-900">Legal</h3>
            <ul className="mt-2 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-gray-900">Support</h3>
            <ul className="mt-2 space-y-2">
              {contactLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500 text-center">
            &copy; {currentYear} Therapy CRM. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
