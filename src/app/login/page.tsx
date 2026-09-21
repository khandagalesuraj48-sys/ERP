"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";

function LoginContent() {
  const router = useRouter();
  const { user, isConfigured, signIn, signUp, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user && !authLoading) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        }
      } else {
        const res = await signUp(email, password, fullName);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg("Account created! Redirecting to dashboard...");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-2xl p-8 shadow-sm relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-13 h-13 p-3 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3.5">
            <Icon name="precision_manufacturing" className="text-2xl" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">MILESTONE ERP</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">
            Construction Machinery &amp; Mechanical ERP
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border border-gray-200 bg-gray-50">
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? "bg-emerald-500" : "bg-blue-500"
              }`}
            />
            <span className="text-gray-600 font-sans font-medium">
              {isConfigured ? "Supabase Auth Connected" : "Local Development Mode"}
            </span>
          </div>
        </div>

        {/* Error / Success Messages */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <Icon name="error" className="text-base shrink-0 mt-0.5 text-rose-500" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <Icon name="check_circle" className="text-base shrink-0 mt-0.5 text-emerald-600" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <div className="relative">
                <Icon name="person" className="absolute left-3.5 top-2.5 text-gray-400 text-base" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Official Email *</label>
            <div className="relative">
              <Icon name="mail" className="absolute left-3.5 top-2.5 text-gray-400 text-base" />
              <input
                type="email"
                required
                placeholder="admin@milestone.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 focus:outline-none font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password *</label>
            <div className="relative">
              <Icon name="lock" className="absolute left-3.5 top-2.5 text-gray-400 text-base" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : mode === "signin" ? (
              <>
                <Icon name="login" className="text-base" />
                <span>Sign In to Milestone ERP</span>
              </>
            ) : (
              <>
                <Icon name="person_add" className="text-base" />
                <span>Create Administrator Account</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{mode === "signin" ? "New installation or user?" : "Already have credentials?"}</span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            {mode === "signin" ? "Register Account" : "Sign In"}
          </button>
        </div>
      </div>

      {/* Footer Copyright & Security Notice */}
      <div className="mt-8 text-center text-[11px] text-gray-400 relative z-10">
        <p>Protected by Enterprise Row Level Security (RLS) &amp; Encrypted Sessions.</p>
        <p className="mt-1 text-gray-400">MILESTONE ERP &bull; Construction Plant &amp; Machinery Operations</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginContent />
    </AuthProvider>
  );
}
