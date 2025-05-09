"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-white/70 dark:bg-blue-950/40 backdrop-blur-sm border-b border-blue-200 dark:border-blue-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-blue-700 dark:text-blue-300 font-bold text-xl">OpenRouter Demo</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                )}
              >
                Chat
              </Link>
              <Link
                href="/pdf-to-haiku"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/pdf-to-haiku"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                )}
              >
                PDF to Haiku
              </Link>
            </div>
          </div>
          <div className="md:hidden">
            <div className="flex items-center space-x-2">
              <Link
                href="/"
                className={cn(
                  "p-2 rounded-md text-sm font-medium",
                  pathname === "/"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "text-blue-700 dark:text-blue-300"
                )}
              >
                Chat
              </Link>
              <Link
                href="/pdf-to-haiku"
                className={cn(
                  "p-2 rounded-md text-sm font-medium",
                  pathname === "/pdf-to-haiku"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "text-blue-700 dark:text-blue-300"
                )}
              >
                PDF to Haiku
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}