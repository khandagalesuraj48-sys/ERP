"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  getBreakdowns,
  createBreakdown,
  updateBreakdown,
  getMachinery,
  getProjects,
  getSites,
  generateBreakdownNumber,
} from "@/lib/data/repository";
import type {
  Breakdown,
  Machinery,
  Project,
  Site,
  BreakdownPriority,
  BreakdownStatus,
} from "@/lib/types";

const PRIORITIES: BreakdownPriority[] = ["low", "medium", "high", "critical"];
const STATUSES: { label: string; value: BreakdownStatus }[] = [
  { label: "Open (Unassigned)", value: "open" },
  { label: "Under Inspection", value: "under_inspection" },
  { label: "Waiting for Parts", value: "waiting_for_parts" },
  { label: "Under Repair", value: "under_repair" },
  { label: "Completed / Resolved", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function BreakdownsPage() {
  const { showToast } = useToast();
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formNo, setFormNo] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("09:00");
  const [formMachineId, setFormMachineId] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formSiteId, setFormSiteId] = useState("");
  const [formReading, setFormReading] = useState<string>("0");
  const [formReportedBy, setFormReportedBy] = useState("");
  const [formProblem, setFormProblem] = useState("");
  const [formPriority, setFormPriority] = useState<BreakdownPriority>("medium");
  const [formStatus, setFormStatus] = useState<BreakdownStatus>("open");
  const [formRemarks, setFormRemarks] = useState("");

  // Status Update / Resolve Modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = useState<BreakdownStatus>("under_repair");
  const [resNotes, setResNotes] = useState("");
  const [downtimeHours, setDowntimeHours] = useState("4");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, m, p, s] = await Promise.all([
        getBreakdowns(machineFilter !== "all" ? machineFilter : undefined),
        getMachinery(),
        getProjects(),
        getSites(),
      ]);
      setBreakdowns(b);
      setMachinery(m);
      setProjects(p);
      setSites(s);
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load breakdowns.", "error");
    } finally {
      setLoading(false);
    }
  }, [machineFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleMachineChange(mId: string) {
    setFormMachineId(mId);
    const m = machinery.find((mac) => mac.id === mId);
    if (m) {
      setFormReading(m.currentReading.toString());
      if (m.currentProjectId || m.projectId) {
        setFormProjectId(m.currentProjectId || m.projectId || "");
      }
      if (m.currentSiteId || m.siteId) {
        setFormSiteId(m.currentSiteId || m.siteId || "");
      }
    }
  }

  async function handleOpenModal() {
    const today = new Date().toISOString().slice(0, 10);
    const nextNo = await generateBreakdownNumber(today);
    setFormNo(nextNo);
    setFormDate(today);
    setFormTime(new Date().toTimeString().slice(0, 5));

    if (machinery.length > 0) {
      const defM = machinery[0];
      setFormMachineId(defM.id);
      setFormReading(defM.currentReading.toString());
      setFormProjectId(defM.currentProjectId || defM.projectId || "");
      setFormSiteId(defM.currentSiteId || defM.siteId || "");
    }
    setFormReportedBy("Site Mechanical Supervisor");
    setFormProblem("");
    setFormPriority("medium");
    setFormStatus("open");
    setFormRemarks("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formMachineId || !formProblem.trim() || !formReportedBy.trim()) {
      showToast("Validation Error", "Please fill in all required breakdown details.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createBreakdown({
        breakdownNo: formNo,
        breakdownDate: formDate,
        breakdownTime: formTime || null,
        machineryId: formMachineId,
        currentReading: parseFloat(formReading) || 0,
        projectId: formProjectId || null,
        siteId: formSiteId || null,
        reportedBy: formReportedBy.trim(),
        problemDescription: formProblem.trim(),
        priority: formPriority,
        status: formStatus,
        remarks: formRemarks.trim() || null,
      });

      showToast("Success", `Breakdown incident '${formNo}' reported.`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to record breakdown.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenResolve(b: Breakdown) {
    setSelectedBreakdown(b);
    setUpdateStatusVal(b.status);
    setResNotes(b.resolutionNotes || "");
    setDowntimeHours(b.downtimeHours ? b.downtimeHours.toString() : "4");
    setIsResolveModalOpen(true);
  }

  async function handleSaveStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBreakdown) return;

    try {
      await updateBreakdown(selectedBreakdown.id, {
        status: updateStatusVal,
        resolutionNotes: resNotes.trim() || undefined,
        resolutionDate: updateStatusVal === "completed" ? new Date().toISOString() : undefined,
        downtimeHours: downtimeHours ? parseFloat(downtimeHours) : undefined,
      });

      showToast("Status Updated", `Breakdown '${selectedBreakdown.breakdownNo}' set to ${updateStatusVal}.`);
      setIsResolveModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to update breakdown status.", "error");
    }
  }

  const counts = {
    all: breakdowns.length,
    open: breakdowns.filter((b) => b.status === "open").length,
    under_repair: breakdowns.filter((b) => ["under_repair", "under_inspection", "waiting_for_parts"].includes(b.status)).length,
    completed: breakdowns.filter((b) => b.status === "completed").length,
  };

  const filtered = breakdowns.filter((b) => {
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || b.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Breakdowns & Downtime"
        subtitle="Unscheduled breakdown reporting, mechanical triage, downtime tracking, and repair resolution."
        action={
          <button
            onClick={handleOpenModal}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="warning" className="text-[18px]" /> Report Breakdown
          </button>
        }
      />

      {/* Metric strip */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={`card px-4 py-2.5 flex items-center gap-3 transition-colors ${
            statusFilter === "all" ? "border-blue-600 bg-blue-50/40" : "hover:border-gray-300"
          }`}
        >
          <span className="text-xs font-semibold text-gray-500">Total Incidents</span>
          <span className="text-xl text-gray-900 font-bold tabular-nums">{counts.all}</span>
        </button>

        <button
          onClick={() => setStatusFilter("open")}
          className={`card px-4 py-2.5 flex items-center gap-3 transition-colors ${
            statusFilter === "open" ? "border-rose-500 bg-rose-50/40" : "hover:border-gray-300"
          }`}
        >
          <StatusPill tone="red">Open Tickets</StatusPill>
          <span className="text-xl text-gray-900 font-bold tabular-nums">{counts.open}</span>
        </button>

        <button
          onClick={() => setStatusFilter("under_repair")}
          className={`card px-4 py-2.5 flex items-center gap-3 transition-colors ${
            statusFilter === "under_repair" ? "border-amber-500 bg-amber-50/40" : "hover:border-gray-300"
          }`}
        >
          <StatusPill tone="amber">In Triage / Repair</StatusPill>
          <span className="text-xl text-gray-900 font-bold tabular-nums">{counts.under_repair}</span>
        </button>

        <button
          onClick={() => setStatusFilter("completed")}
          className={`card px-4 py-2.5 flex items-center gap-3 transition-colors ${
            statusFilter === "completed" ? "border-emerald-500 bg-emerald-50/40" : "hover:border-gray-300"
          }`}
        >
          <StatusPill tone="green">Resolved</StatusPill>
          <span className="text-xl text-gray-900 font-bold tabular-nums">{counts.completed}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Equipment ({machinery.length})</option>
            {machinery.map((m) => (
              <option key={m.id} value={m.id}>
                {m.assetCode} — {m.machineryName}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing {filtered.length} incidents
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading breakdowns...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="build_circle"
          title="Zero Reported Breakdowns"
          description="There are currently no active breakdown tickets matching your filter. Report unscheduled mechanical or electrical issues as they occur on site."
          actionLabel="Report First Breakdown"
          actionHref="#"
          onAction={handleOpenModal}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="px-5 py-3">Incident No</th>
                  <th className="px-5 py-3">Date &amp; Time</th>
                  <th className="px-5 py-3">Machinery Asset</th>
                  <th className="px-5 py-3">Problem Description</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Reported By / Hours</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => {
                  const m = machinery.find((mac) => mac.id === b.machineryId);
                  return (
                    <tr key={b.id} className="table-row">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">
                        {b.breakdownNo}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className="text-gray-900 font-medium">{b.breakdownDate}</p>
                        {b.breakdownTime && <p className="text-[11px] text-gray-500">{b.breakdownTime}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 text-xs">
                          {m ? `${m.assetCode} — ${m.machineryName}` : b.machineryId}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {b.currentReading} {m?.meterType}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs max-w-sm">
                        <p className="text-gray-900 font-medium">{b.problemDescription}</p>
                        {b.resolutionNotes && (
                          <p className="text-[11px] text-emerald-700 mt-1">Resolution: {b.resolutionNotes}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill
                          tone={
                            b.priority === "critical"
                              ? "red"
                              : b.priority === "high"
                              ? "red"
                              : b.priority === "medium"
                              ? "amber"
                              : "blue"
                          }
                        >
                          {b.priority}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill tone={b.status === "completed" ? "green" : b.status === "cancelled" ? "slate" : "red"}>
                          {b.status.replace(/_/g, " ")}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className="text-gray-900 font-medium">{b.reportedBy}</p>
                        {b.downtimeHours ? (
                          <p className="text-[11px] text-rose-600 font-mono font-medium">{b.downtimeHours} hrs downtime</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenResolve(b)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                          >
                            Update Status
                          </button>
                          <Link
                            href={`/machinery/maintenance?breakdownId=${b.id}&machineryId=${b.machineryId}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                          >
                            Service
                          </Link>
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

      {/* Report Breakdown Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Unscheduled Breakdown"
        subtitle="Log equipment failure, symptoms, priority, and assign to mechanical workshop."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Breakdown No *</label>
              <input
                type="text"
                required
                value={formNo}
                onChange={(e) => setFormNo(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Machinery *</label>
              <select
                required
                value={formMachineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="form-select text-xs font-semibold"
              >
                <option value="">-- Select Machine --</option>
                {machinery.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.assetCode} — {m.machineryName} ({m.meterType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Meter Reading at Failure</label>
              <input
                type="number"
                step="0.01"
                required
                value={formReading}
                onChange={(e) => setFormReading(e.target.value)}
                className="form-input text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Problem Description / Symptoms *</label>
            <textarea
              rows={3}
              required
              value={formProblem}
              onChange={(e) => setFormProblem(e.target.value)}
              placeholder="e.g. Hydraulic arm pressure loss; oil leakage near main control valve cylinder..."
              className="form-input text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority Level</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as BreakdownPriority)}
                className="form-select text-xs font-semibold"
              >
                <option value="low">Low (Minor Glitch)</option>
                <option value="medium">Medium (Impaired)</option>
                <option value="high">High (Machine Stopped)</option>
                <option value="critical">Critical (Site Stoppage)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Initial Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as BreakdownStatus)}
                className="form-select text-xs"
              >
                <option value="open">Open</option>
                <option value="under_inspection">Under Inspection</option>
                <option value="under_repair">Under Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reported By *</label>
              <input
                type="text"
                required
                value={formReportedBy}
                onChange={(e) => setFormReportedBy(e.target.value)}
                placeholder="e.g. Sunil Verma (Site Eng)"
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs flex items-center gap-2"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Report Breakdown
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve / Update Status Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Update Status: ${selectedBreakdown?.breakdownNo}`}
        subtitle="Update repair progress or record final resolution."
      >
        <form onSubmit={handleSaveStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Incident Status</label>
            <select
              value={updateStatusVal}
              onChange={(e) => setUpdateStatusVal(e.target.value as BreakdownStatus)}
              className="form-select text-xs font-semibold"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Downtime Incurred (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={downtimeHours}
              onChange={(e) => setDowntimeHours(e.target.value)}
              className="form-input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Resolution Notes / Action Taken</label>
            <textarea
              rows={3}
              value={resNotes}
              onChange={(e) => setResNotes(e.target.value)}
              placeholder="e.g. Replaced hydraulic high pressure seal kit; pressure tested to 250 bar. Machine operational."
              className="form-input text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsResolveModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
            >
              Save Resolution
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
