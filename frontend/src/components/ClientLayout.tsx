"use client";

import React from "react";
import NavMenu from "@/components/NavMenu";
import QueryProvider from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <QueryProvider>
      <AuthProvider>
        <NavMenu />
        {children}
      </AuthProvider>
    </QueryProvider>
  );
};

export default ClientLayout;
