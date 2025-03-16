"use client";

import React from "react";
import NavMenu from "@/components/NavMenu";
import QueryProvider from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import Badges from "@/components/Badges";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="min-h-screen bg-dark-blue text-white">
          <NavMenu />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4">
            <div className="max-w-7xl mx-auto">
              <Badges />
              {children}
            </div>
          </main>
        </div>
      </AuthProvider>
    </QueryProvider>
  );
}
