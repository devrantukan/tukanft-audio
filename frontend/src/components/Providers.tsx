"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import LoginModal from "@/components/LoginModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
        <LoginModal />
      </LanguageProvider>
    </AuthProvider>
  );
}
