"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { isDatabaseConnected } from "@/lib/data/repository";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  function handleCopyMigrationCmd() {
    navigator.clipboard.writeText("npx supabase db push");
    setCopied(true);
    showToast("Copied", "Command copied to clipboard.");
    setTimeout(() => setCopied(false), 3000);
  }

  function handleResetLocalStore() {
    if (window.confirm("Clear local cache and reload default plant & machinery data?")) {
      localStorage.clear();
      showToast("Reset", "Local cache cleared. Reloading page...");
      setTimeout(() => window.location.reload(), 800);
    }
  }

  return (
    <>
      <PageHeader
        title="System Settings &amp; Architecture"
        subtitle="ERP environment configuration, database connectivity, Supabase Storage and Enterprise 27-table schema status."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Card 1: Database & Supabase Connectivity */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Icon name="database" className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Database &amp; Connectivity</h4>
                <p className="text-xs text-gray-500">PostgreSQL / Supabase Engine</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isDatabaseConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {isDatabaseConnected ? "Live Supabase Cloud" : "Local Production Store"}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Provider:</span>
              <span className="font-mono text-gray-800 font-medium">@supabase/supabase-js v2.45.4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active Migration:</span>
              <span className="font-mono text-blue-600 font-medium">20260920150000_milestone_erp_master_upgrade.sql</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Schema Tables:</span>
              <span className="font-semibold text-gray-900">27 Enterprise Tables (Verified)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Storage Bucket:</span>
              <span className="font-mono text-gray-800">attachments (Documents &amp; Media)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs space-y-2.5">
            <p className="font-bold text-gray-900 flex items-center gap-1.5">
              <Icon name="link" className="text-sm text-blue-600" /> Connecting Supabase Project:
            </p>
            <p className="text-gray-600 leading-relaxed">
              Environment variables in <span className="font-mono font-medium text-gray-800">.env.local</span>:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>`}
            </pre>
            <p className="text-gray-600 leading-relaxed">
              Link via Supabase CLI and apply schema migrations:
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-white px-2.5 py-1.5 rounded text-[11px] text-emerald-700 font-mono flex-1 border border-gray-200">
                npx supabase db push
              </code>
              <button
                onClick={handleCopyMigrationCmd}
                className="btn-secondary text-xs py-1 px-3"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Enterprise Architecture Verification */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Icon name="schema" className="text-xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">ERP Database Schema</h4>
              <p className="text-xs text-gray-500">27 Approved Enterprise Tables</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 text-xs max-h-[380px] overflow-y-auto pr-1">
            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">1. projects &amp; sites</p>
                <p className="text-[11px] text-gray-500">Construction projects &amp; physical work sites</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">2. machinery &amp; engines</p>
                <p className="text-[11px] text-gray-500">Asset master, dual engines &amp; fuel tanks</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">3. vendors</p>
                <p className="text-[11px] text-gray-500">Suppliers, fuel stations, workshops &amp; OEMs</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">4. stores &amp; item_masters</p>
                <p className="text-[11px] text-gray-500">Site stores, parts catalog, UOMs &amp; reorder levels</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">5. stock_inwards &amp; outwards</p>
                <p className="text-[11px] text-gray-500">GRN receiving &amp; direct material issues</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">6. stock_ledger &amp; transactions</p>
                <p className="text-[11px] text-gray-500">Immutable store inventory journal &amp; balances</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">7. transfers, returns &amp; adjustments</p>
                <p className="text-[11px] text-gray-500">Inter-store transfers, vendor/site returns, reconciliation</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">8. fuel_issues</p>
                <p className="text-[11px] text-gray-500">Direct fuel dispense, dual-engine allocation &amp; averages</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">9. log_books</p>
                <p className="text-[11px] text-gray-500">Daily equipment run logs, auto-opening readings</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">10. breakdowns &amp; maintenance</p>
                <p className="text-[11px] text-gray-500">Breakdown triage &amp; scheduled preventive servicing</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">11. fixed_assets</p>
                <p className="text-[11px] text-gray-500">Non-machinery plant assets &amp; site relocation</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">12. attachments &amp; audit_logs</p>
                <p className="text-[11px] text-gray-500">Polymorphic storage documents &amp; system audit trail</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">Active</span>
            </div>
          </div>
        </div>

        {/* Card 3: Administrative Context & Diagnostics */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Icon name="badge" className="text-xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Enterprise Access Context</h4>
              <p className="text-xs text-gray-500">Administration and authorization status</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-2 text-xs">
            <p className="text-gray-500">User: <span className="text-gray-900 font-semibold">System Administrator</span></p>
            <p className="text-gray-500">Email: <span className="text-gray-900 font-mono">admin@milestone.internal</span></p>
            <p className="text-gray-500">Role: <span className="text-gray-900 font-semibold">Plant &amp; Machinery (P&amp;M) Lead</span></p>
            <p className="text-gray-500">Security Model: <span className="text-emerald-700 font-semibold">Row Level Security (RLS) &amp; Encrypted Sessions</span></p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleResetLocalStore}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
            >
              <Icon name="refresh" className="text-sm" /> Reset Local Development Store
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
