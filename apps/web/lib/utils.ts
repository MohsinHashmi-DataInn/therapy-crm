import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date as MM/DD/YYYY
export function formatDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    // Check if the date object is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDate:', dateInput);
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
}

// Format time as hh:mm AM/PM
export function formatTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    // Check if the date object is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatTime:', dateInput);
      return 'Invalid Date';
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Error';
  }
}
