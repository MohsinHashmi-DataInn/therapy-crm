'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { useState, useEffect } from 'react';
import './globals.css';
import { Providers } from '../contexts/providers';
import { Header } from '../components/ui/header';
import { Sidebar } from '../components/ui/sidebar';
import { Footer } from '../components/ui/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Therapy CRM',
  description: 'A comprehensive CRM system for therapy practices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial value
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col h-full bg-gray-50 dark:bg-gray-900`}>
        <Providers>
          <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} isMobile={isMobile} closeSidebar={() => setIsSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
