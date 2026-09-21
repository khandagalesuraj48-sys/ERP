"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && isConfigured) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, loading, isConfigured, router, pathname]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#F7F8FA] flex flex-col items-center justify-center gap-3 text-gray-500">
        <span className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-wider uppercase text-gray-500">
          Verifying MILESTONE ERP Session...
        </p>
      </div>
    );
  }

  if (!user && isConfigured) {
    return null;
  }

  return <>{children}</>;
}

