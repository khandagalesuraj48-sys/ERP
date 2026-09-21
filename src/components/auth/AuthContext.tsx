"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { CurrentUser, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const OFFLINE_STORAGE_USER_KEY = "milestone_erp_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error("Supabase getSession error:", error);
          }
          if (session?.user && mounted) {
            const role = (session.user.user_metadata?.role as UserRole) || "SUPER_ADMIN";
            const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Operator";
            setUser({
              id: session.user.id,
              name,
              email: session.user.email || "",
              role,
              department: "Plant & Machinery (P&M)",
            });
          } else if (mounted) {
            setUser(null);
          }
        } catch (err) {
          console.error("Failed to check Supabase session:", err);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setLoading(false);
        }

        // Listen for Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;
          if (session?.user) {
            const role = (session.user.user_metadata?.role as UserRole) || "SUPER_ADMIN";
            const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Operator";
            setUser({
              id: session.user.id,
              name,
              email: session.user.email || "",
              role,
              department: "Plant & Machinery (P&M)",
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } else {
        // Offline / Development mode: check if user simulated login or default
        try {
          const saved = typeof window !== "undefined" ? localStorage.getItem(OFFLINE_STORAGE_USER_KEY) : null;
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            // Default developer administrative session for offline testing
            const defaultUser: CurrentUser = {
              id: "usr-admin-001",
              name: "System Administrator",
              email: "admin@milestone.internal",
              role: "SUPER_ADMIN",
              department: "Plant & Machinery (P&M)",
            };
            setUser(defaultUser);
          }
        } catch {
          // ignore
        } finally {
          if (mounted) setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error) {
            return { error: error.message };
          }
          if (data.user) {
            const role = (data.user.user_metadata?.role as UserRole) || "SUPER_ADMIN";
            const name = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Operator";
            setUser({
              id: data.user.id,
              name,
              email: data.user.email || "",
              role,
              department: "Plant & Machinery (P&M)",
            });
            router.push("/dashboard");
          }
          return {};
        } catch (err: any) {
          return { error: err.message || "Authentication failed" };
        }
      } else {
        // Offline simulation
        const offlineUser: CurrentUser = {
          id: `usr-${Date.now()}`,
          name: email.split("@")[0] || "Administrator",
          email: email.trim(),
          role: "SUPER_ADMIN",
          department: "Plant & Machinery (P&M)",
        };
        setUser(offlineUser);
        if (typeof window !== "undefined") {
          localStorage.setItem(OFFLINE_STORAGE_USER_KEY, JSON.stringify(offlineUser));
        }
        router.push("/dashboard");
        return {};
      }
    },
    [router]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string): Promise<{ error?: string }> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: name?.trim() || email.split("@")[0],
                role: "SUPER_ADMIN" as UserRole,
              },
            },
          });
          if (error) return { error: error.message };
          if (data.user && !data.session) {
            return { error: "Check your email for the confirmation link to complete registration." };
          }
          router.push("/dashboard");
          return {};
        } catch (err: any) {
          return { error: err.message || "Sign up failed" };
        }
      } else {
        return signIn(email, password);
      }
    },
    [router, signIn]
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(OFFLINE_STORAGE_USER_KEY);
    }
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

