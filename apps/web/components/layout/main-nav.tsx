"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  MessageSquare, 
  Settings, 
  Home 
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Navigation item interface
 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

/**
 * Main navigation component for the dashboard
 * Provides navigation links with active state indicators
 */
export function MainNav() {
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      title: "Clients",
      href: "/clients",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      title: "Appointments",
      href: "/appointments",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
    {
      title: "Waitlist",
      href: "/waitlist",
      icon: <ClipboardList className="h-4 w-4 mr-2" />,
    },
    {
      title: "Communications",
      href: "/communications",
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href || pathname.startsWith(`${item.href}/`)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
