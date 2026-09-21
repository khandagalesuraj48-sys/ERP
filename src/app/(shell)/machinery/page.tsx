"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { MachineryModal } from "@/components/machinery/MachineryModal";
import { useToast } from "@/components/ui/Toast";
import { getMachinery, getProjects, getSites, archiveMachinery } from "@/lib/data/repository";
import { fmt } from "@/lib/utils";
import type { Machinery, Project, Site, MeterType } from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

export default function MachineryMasterPage() {
  const { showToast } = useToast();
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [meterFilter, setMeterFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [regFilter, setRegFilter] = useState("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machinery | null>(null);

  const fetchMachinery = useCallback(async () => {
    setLoading(true);
    try {
      const [data, prjs, sts] = await Promise.all([
        getMachinery({
          search: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          meterType: meterFilter !== "all" ? (meterFilter as MeterType) : undefined,
        }),
        getProjects(),
        getSites(),
      ]);
      setMachinery(data);
      setProjects(prjs);
      setSites(sts);
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load machinery list.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, meterFilter, showToast]);

  useEffect(() => {
    fetchMachinery();
  }, [fetchMachinery]);

  async function handleArchive(m: Machinery) {
    if (!window.confirm(`Are you sure you want to archive machinery '${m.assetCode} - ${m.machineryName}'?`)) {
      return;
    }
    try {
      await archiveMachinery(m.id);
      showToast("Archived", `Machinery '${m.assetCode}' has been archived.`);
      fetchMachinery();
    } catch (e: any) {
      showToast("Error", e.message || "Could not archive machinery.", "error");
    }
  }

  const counts = {
    all: machinery.length,
    active: machinery.filter((m) => m.status === "active").length,
    under_repair: machinery.filter((m) => m.status === "under_repair").length,
    inactive: machinery.filter((m) => m.status === "inactive").length,
  };

  const uniqueTypes = React.useMemo(() => {
    const set = new Set<string>();
    machinery.forEach((m) => {
      if (m.machineryType) set.add(m.machineryType);
    });
    return Array.from(set).sort();
  }, [machinery]);

  const filteredList = machinery.filter((m) => {
    if (projectFilter !== "all" && m.currentProjectId !== projectFilter) return false;
    if (siteFilter !== "all" && m.currentSiteId !== siteFilter) return false;
    if (typeFilter !== "all" && m.machineryType !== typeFilter) return false;
    if (ownershipFilter !== "all" && m.ownership !== ownershipFilter) return false;
    if (regFilter === "registered" && !m.registrationNo) return false;
    if (regFilter === "unregistered" && m.registrationNo) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Machinery"
        subtitle="Central registry of construction plant, earthmoving equipment, haulage trucks, and utility machinery."
        action={
          <button
            onClick={() => {
              setEditingMachine(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Icon name="add" className="text-[16px]" />
            <span>Add Machinery</span>
          </button>
        }
      />

      {/* KPI Metric Filter Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`card px-3 py-1.5 flex items-center gap-2 text-[12px] font-medium transition-colors ${
            statusFilter === "all" ? "border-blue-500 bg-blue-50/50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
          }`}
        >
          <span>All Units</span>
          <span className="font-bold font-mono text-gray-900">{counts.all}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={`card px-3 py-1.5 flex items-center gap-2 text-[12px] font-medium transition-colors ${
            statusFilter === "active" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700" : "hover:bg-gray-50 text-gray-600"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active</span>
          <span className="font-bold font-mono text-emerald-700">{counts.active}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("under_repair")}
          className={`card px-3 py-1.5 flex items-center gap-2 text-[12px] font-medium transition-colors ${
            statusFilter === "under_repair" ? "border-red-500 bg-red-50/50 text-red-700" : "hover:bg-gray-50 text-gray-600"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Under Repair</span>
          <span className="font-bold font-mono text-red-700">{counts.under_repair}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("inactive")}
          className={`card px-3 py-1.5 flex items-center gap-2 text-[12px] font-medium transition-colors ${
            statusFilter === "inactive" ? "border-amber-500 bg-amber-50/50 text-amber-700" : "hover:bg-gray-50 text-gray-600"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Inactive / Yard</span>
          <span className="font-bold font-mono text-amber-700">{counts.inactive}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Icon name="search" className="absolute left-3 top-2 text-gray-400 text-[18px]" />
          <input
            type="text"
            placeholder="Search code, equipment name, make, model, or RTO plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-9 text-[12px] h-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setSiteFilter("all");
            }}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-36"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>

          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            disabled={projectFilter === "all"}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-32 disabled:opacity-50"
          >
            <option value="all">All Sites</option>
            {sites
              .filter((st) => projectFilter === "all" || st.projectId === projectFilter)
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
          </select>

          {/* Type Filter */}
          {uniqueTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-32"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Ownership Filter */}
          <select
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value)}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-28"
          >
            <option value="all">Ownership</option>
            <option value="owned">Owned</option>
            <option value="rental">Rental</option>
            <option value="leased">Leased</option>
          </select>

          {/* Registration Filter */}
          <select
            value={regFilter}
            onChange={(e) => setRegFilter(e.target.value)}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-32"
          >
            <option value="all">All Reg Status</option>
            <option value="registered">Registered</option>
            <option value="unregistered">Unregistered</option>
          </select>

          {/* Meter Type Filter */}
          <select
            value={meterFilter}
            onChange={(e) => setMeterFilter(e.target.value)}
            className="form-select text-[12px] h-8 py-0 pl-2.5 pr-7 w-32"
          >
            <option value="all">All Meters</option>
            <option value="KM">KM Odometer</option>
            <option value="HOUR">Hour Meter</option>
          </select>

          {/* Clear Filters Button if any active */}
          {(projectFilter !== "all" || siteFilter !== "all" || typeFilter !== "all" || ownershipFilter !== "all" || regFilter !== "all" || meterFilter !== "all" || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setProjectFilter("all");
                setSiteFilter("all");
                setTypeFilter("all");
                setOwnershipFilter("all");
                setRegFilter("all");
                setMeterFilter("all");
                setSearchTerm("");
              }}
              title="Reset all filters"
              className="btn-secondary h-8 px-2 text-[11px] text-gray-500 hover:text-gray-900"
            >
              <Icon name="close" className="text-[14px]" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Machinery Data Table */}
      {loading ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[13px]">Loading equipment records...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon="precision_manufacturing"
          title="No Machinery Found"
          description={
            searchTerm || statusFilter !== "all" || meterFilter !== "all"
              ? "No equipment matched your active search or filter criteria. Try resetting filters."
              : "Your machinery fleet master is empty. Register your first equipment to start operations."
          }
          actionLabel="Register First Machinery"
          onAction={() => {
            setEditingMachine(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="table-head">
                  <th className="py-2.5 px-3.5">Asset Code</th>
                  <th className="py-2.5 px-3.5">Machinery</th>
                  <th className="py-2.5 px-3.5">Registration</th>
                  <th className="py-2.5 px-3.5">Type</th>
                  <th className="py-2.5 px-3.5">Meter</th>
                  <th className="py-2.5 px-3.5">Current Reading</th>
                  <th className="py-2.5 px-3.5">Project</th>
                  <th className="py-2.5 px-3.5">Site</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((m) => {
                  const prj = projects.find((p) => p.id === m.currentProjectId);
                  const st = sites.find((s) => s.id === m.currentSiteId);

                  return (
                    <tr key={m.id} className="table-row">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">
                        <Link href={`/machinery/${m.id}`} className="hover:underline">
                          {m.assetCode}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={`/machinery/${m.id}`} className="font-semibold text-gray-900 hover:text-blue-600 leading-tight">
                            {getMachineryDisplayName(m)}
                          </Link>
                          {m.ownership === "rental" ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                              Rental
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">
                              Owned
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-normal">
                          {m.make} {m.model}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">
                        {m.registrationNo ? (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-800 font-semibold">
                            {m.registrationNo}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unregistered</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-700 font-medium">
                        {m.machineryType}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded ${m.meterType === "KM" ? "bg-blue-50 text-blue-700 font-semibold" : "bg-purple-50 text-purple-700 font-semibold"}`}>
                          {m.meterConfiguration ? m.meterConfiguration.toUpperCase().replace("_", " ") : m.meterType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-gray-900">
                        {fmt(m.currentReading)} {m.meterType}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-700">
                        {prj ? (
                          <span className="font-medium text-gray-900">{prj.code}</span>
                        ) : (
                          <span className="text-gray-400 italic">Central Yard</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-500">
                        {st ? st.name : "—"}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <StatusPill
                          tone={
                            m.status === "active"
                              ? "green"
                              : m.status === "under_repair"
                              ? "red"
                              : m.status === "inactive"
                              ? "slate"
                              : "amber"
                          }
                        >
                          {m.status.replace("_", " ")}
                        </StatusPill>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/machinery/${m.id}`}
                            title="Open Details"
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Icon name="visibility" className="text-[16px]" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMachine(m);
                              setIsModalOpen(true);
                            }}
                            title="Edit Machinery"
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(m)}
                            title="Archive"
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Icon name="archive" className="text-[16px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Machinery Add/Edit Modal */}
      <MachineryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMachine(null);
        }}
        onSuccess={fetchMachinery}
        machineryToEdit={editingMachine}
      />
    </div>
  );
}
