import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format timestamps for response display
export function formatResponseTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true,
    day: 'numeric',
    month: 'short'
  }).format(date);
}

/**
 * Utilities for handling text content that might be very large
 */

// Creates CSS properties for scrollable containers with adjustable height
export function scrollableContainerStyle(maxHeight?: string) {
  return {
    maxHeight: maxHeight || '70vh',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    scrollbarWidth: 'thin' as const
  };
}

// Truncates text to a specified maximum length with ellipsis
export function truncateText(text: string, maxLength = 1000): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Shorthand function to ensure no text is truncated - for use with the UI
export function ensureNoTruncation() {
  return {
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const, 
    textOverflow: 'unset' as const
  };
}