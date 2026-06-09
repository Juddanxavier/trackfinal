"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "./protected-route";
import Navbar from "./Navbar";

interface ProtectedLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href: string;
    icon?: ReactNode;
  };
}

export function ProtectedLayout({
  children,
  title,
  subtitle,
  action,
}: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 font-heading">
                  {title}
                </h1>
                {subtitle && <p className="text-slate-500 mt-2">{subtitle}</p>}
              </div>
              {action && (
                <a
                  href={action.href}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  {action.icon}
                  {action.label}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {children}
      </main>
    </ProtectedRoute>
  );
}
