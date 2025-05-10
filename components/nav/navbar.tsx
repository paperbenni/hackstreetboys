"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Define navigation items - makes adding new pages easier
const navigationItems = [
  {
    name: "Process Documents", // Renamed from "PDF to Summary"
    path: "/", // Make process the home page
    mobileDisplay: true, // Show on mobile
  },
  {
    name: "Chat",
    path: "/chat", // Move chat to a new route
    mobileDisplay: true,
  },
  // New pages can be easily added here
];

export function Navbar() {
  const pathname = usePathname();
  
  return (
    <nav className="w-full bg-white/70 dark:bg-blue-950/40 backdrop-blur-sm border-b border-blue-200 dark:border-blue-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-blue-700 dark:text-blue-300 font-bold text-xl">Hackstreet Boys</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.path
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      : "text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Mobile navigation */}
          <div className="md:hidden">
            <div className="flex items-center space-x-2">
              {navigationItems
                .filter(item => item.mobileDisplay)
                .map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "p-2 rounded-md text-sm font-medium",
                      pathname === item.path
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        : "text-blue-700 dark:text-blue-300"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}