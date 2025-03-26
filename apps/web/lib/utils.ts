import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with conditionals
 * This helps create dynamic class names with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date object to a localized string
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a time string (HH:MM:SS) to 12-hour format with AM/PM
 */
export function formatTime(time: string): string {
  // Check if time is a valid date string (like ISO format)
  if (!isNaN(Date.parse(time))) {
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // If time is in format HH:MM:SS
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a phone number to a standardized format (XXX) XXX-XXXX
 */
export function formatPhoneNumber(phoneNumberString: string): string {
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumberString;
}
