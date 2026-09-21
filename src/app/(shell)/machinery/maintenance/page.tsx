"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getMachinery,
  getVendors,
  getBreakdowns,
  generateMaintenanceNumber,
} from "@/lib/data/repository";
import { money } from "@/lib/utils";
import type {
  MaintenanceRecord,
  Machinery,
  Vendor,
  Breakdown,
  MaintenanceType,
  MaintenanceStatus,
} from "@/lib/types";

const MAINT_TYPES: { label: string; value: MaintenanceType }[] = [
  { label: "Preventive Maintenance", value: "preventive" },
  { label: "Breakdown Repair", value: "breakdown" },
  { label: "Periodic Scheduled Service", value: "service" },
  { label: "Corrective Overhaul", value: "corrective" },
  { label: "Safety & Quality Inspection", value: "inspection" },
];

const MAINT_STATUSES: { label: string; value: MaintenanceStatus }[] = [
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const queryBreakdownId = searchParams.get("breakdownId");
  const queryMachineryId = searchParams.get("machineryId");

  const { showToast } = useToast();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formNo, setFormNo] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMachineId, setFormMachineId] = useState("");
  const [formBreakdownId, setFormBreakdownId] = useState("");
  const [formVendorId, setFormVendorId] = useState("");
  const [formType, setFormType] = useState<MaintenanceType>("service");
  const [formReading, setFormReading] = useState("0");
  const [formComplaint, setFormComplaint] = useState("");
  const [formDiagnosis, setFormDiagnosis] = useState("");
  const [formWorkPerformed, setFormWorkPerformed] = useState("");
  const [formRequiredParts, setFormRequiredParts] = useState("");
  const [formQuotationRef, setFormQuotationRef] = useState("");
  const [formEstimatedCost, setFormEstimatedCost] = useState("0");
  const [formPartsCost, setFormPartsCost] = useState("0");
  const [formLabourCost, setFormLabourCost] = useState("0");
  const [formActualCost, setFormActualCost] = useState("0");
  const [formStatus, setFormStatus] = useState<MaintenanceStatus>("scheduled");
  const [formNextReading, setFormNextReading] = useState("");
  const [formNextDate, setFormNextDate] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, m, v, b] = await Promise.all([
        getMaintenanceRecords(machineFilter !== "all" ? machineFilter : undefined),
        getMachinery(),
        getVendors(),
        getBreakdowns(),
      ]);
      setRecords(recs);
      setMachinery(m);
      setVendors(v);
      setBreakdowns(b);
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load maintenance records.", "error");
    } finally {
      setLoading(false);
    }
  }, [machineFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal pre-filled from query params if requested
  useEffect(() => {
    if (queryBreakdownId || queryMachineryId) {
      handleOpenModal(undefined, queryBreakdownId || undefined, queryMachineryId || undefined);
    }
  }, [queryBreakdownId, queryMachineryId]);

  function handleMachineChange(mId: string) {
    setFormMachineId(mId);
    const m = machinery.find((mac) => mac.id === mId);
    if (m) {
      setFormReading(m.currentReading.toString());
    }
  }

  async function handleOpenModal(rec?: MaintenanceRecord, linkedBreakdownId?: string, linkedMachineryId?: string) {
    if (rec) {
      setEditingRecord(rec);
      setFormNo(rec.maintenanceNo);
      setFormDate(rec.serviceDate);
      setFormMachineId(rec.machineryId);
      setFormBreakdownId(rec.breakdownId || "");
      setFormVendorId(rec.vendorId || "");
      setFormType(rec.maintenanceType);
      setFormReading(rec.currentReading.toString());
      setFormComplaint(rec.complaint || "");
      setFormDiagnosis(rec.diagnosis || "");
      setFormWorkPerformed(rec.workPerformed || "");
      setFormRequiredParts(rec.requiredParts || "");
      setFormQuotationRef(rec.quotationReference || "");
      setFormEstimatedCost(rec.estimatedCost.toString());
      setFormPartsCost(rec.partsCost.toString());
      setFormLabourCost(rec.labourCost.toString());
      setFormActualCost(rec.actualCost.toString());
      setFormStatus(rec.status);
      setFormNextReading(rec.nextServiceReading?.toString() || "");
      setFormNextDate(rec.nextServiceDate || "");
      setFormRemarks(rec.remarks || "");
    } else {
      setEditingRecord(null);
      const today = new Date().toISOString().slice(0, 10);
      const nextNo = await generateMaintenanceNumber(today);
      setFormNo(nextNo);
      setFormDate(today);

      const targetMachineryId = linkedMachineryId || (machinery.length > 0 ? machinery[0].id : "");
      setFormMachineId(targetMachineryId);
      const m = machinery.find((mac) => mac.id === targetMachineryId);
      setFormReading(m ? m.currentReading.toString() : "0");

      setFormBreakdownId(linkedBreakdownId || "");
      setFormVendorId(vendors.length > 0 ? vendors[0].id : "");
      setFormType(linkedBreakdownId ? "breakdown" : "service");
      setFormComplaint("");
      setFormDiagnosis("");
      setFormWorkPerformed("");
      setFormRequiredParts("");
      setFormQuotationRef("");
      setFormEstimatedCost("0");
      setFormPartsCost("0");
      setFormLabourCost("0");
      setFormActualCost("0");
      setFormStatus(linkedBreakdownId ? "in_progress" : "scheduled");
      setFormNextReading("");
      setFormNextDate("");
      setFormRemarks("");
    }
    setIsModalOpen(true);
  }

  // Auto sum parts + labour when changed
  function handleCostChange(partsVal: string, labourVal: string) {
    setFormPartsCost(partsVal);
    setFormLabourCost(labourVal);
    const p = parseFloat(partsVal) || 0;
    const l = parseFloat(labourVal) || 0;
    if (p + l > 0) {
      setFormActualCost((p + l).toString());
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formMachineId) {
      showToast("Validation Error", "Please select an equipment asset.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        maintenanceNo: formNo,
        machineryId: formMachineId,
        breakdownId: formBreakdownId || null,
        serviceDate: formDate,
        currentReading: parseFloat(formReading) || 0,
        maintenanceType: formType,
        complaint: formComplaint.trim() || null,
        diagnosis: formDiagnosis.trim() || null,
        workPerformed: formWorkPerformed.trim() || null,
        requiredParts: formRequiredParts.trim() || null,
        vendorId: formVendorId || null,
        quotationReference: formQuotationRef.trim() || null,
        estimatedCost: parseFloat(formEstimatedCost) || 0,
        partsCost: parseFloat(formPartsCost) || 0,
        labourCost: parseFloat(formLabourCost) || 0,
        actualCost: parseFloat(formActualCost) || (parseFloat(formPartsCost) || 0) + (parseFloat(formLabourCost) || 0),
        status: formStatus,
        nextServiceReading: formNextReading ? parseFloat(formNextReading) : null,
        nextServiceDate: formNextDate || null,
        remarks: formRemarks.trim() || null,
      };

      if (editingRecord) {
        await updateMaintenanceRecord(editingRecord.id, payload);
        showToast("Success", `Maintenance record '${formNo}' updated.`);
      } else {
        await createMaintenanceRecord(payload);
        showToast("Success", `Maintenance record '${formNo}' logged.`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to save maintenance record.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const totalSpend = records.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);
  const activeJobs = records.filter((r) => r.status === "in_progress" || r.status === "scheduled").length;

  const filtered = records.filter((r) => {
    const matchesType = typeFilter === "all" || r.maintenanceType === typeFilter;
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Machinery Maintenance & Servicing"
        subtitle="Preventive maintenance, periodic servicing, workshop repairs, and parts & labour costs."
        action={
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="handyman" className="text-[18px]" /> + Maintenance Entry
          </button>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Total Maintenance Spend</p>
            <p className="text-2xl text-emerald-600 font-bold font-mono mt-1">{money(totalSpend)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Icon name="attach_money" className="text-xl" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Active Service Jobs</p>
            <p className="text-2xl text-amber-600 font-bold font-mono mt-1">{activeJobs}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Icon name="pending_actions" className="text-xl" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Total Service Tickets</p>
            <p className="text-2xl text-gray-900 font-bold font-mono mt-1">{records.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <Icon name="fact_check" className="text-xl" />
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Service Types</option>
            {MAINT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Statuses</option>
            {MAINT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="form-select text-xs font-medium w-auto"
          >
            <option value="all">All Machinery ({machinery.length})</option>
            {machinery.map((m) => (
              <option key={m.id} value={m.id}>
                {m.assetCode} — {m.machineryName}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing {filtered.length} records
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading maintenance records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="handyman"
          title="No Maintenance Records Found"
          description="There are no scheduled or completed maintenance jobs recorded yet. Log preventive servicing and overhaul jobs."
          actionLabel="Log Maintenance Service"
          actionHref="#"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="px-5 py-3">Mnt No</th>
                  <th className="px-5 py-3">Service Date</th>
                  <th className="px-5 py-3">Machinery Asset</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Work / Parts</th>
                  <th className="px-5 py-3">Vendor / Workshop</th>
                  <th className="px-5 py-3 text-right">Actual Cost</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const m = machinery.find((mac) => mac.id === r.machineryId);
                  const v = vendors.find((vnd) => vnd.id === r.vendorId);
                  return (
                    <tr key={r.id} className="table-row">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">
                        {r.maintenanceNo}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-gray-700">
                        {r.serviceDate}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 text-xs">
                          {m ? `${m.assetCode} — ${m.machineryName}` : r.machineryId}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {r.currentReading} {m?.meterType}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="capitalize text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {r.maintenanceType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{r.workPerformed || r.complaint || "Routine Service"}</p>
                        {r.requiredParts && (
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">Parts: {r.requiredParts}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-700">
                        {v ? v.name : "Internal P&M Workshop"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-emerald-600 text-right">
                        {money(r.actualCost || r.estimatedCost)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill tone={r.status === "completed" ? "green" : r.status === "in_progress" ? "amber" : "slate"}>
                          {r.status.replace("_", " ")}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenModal(r)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? `Edit Maintenance: ${editingRecord.maintenanceNo}` : "Log Maintenance / Service Record"}
        subtitle="Record scheduled servicing, workshop repairs, spare parts and labour expenses."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Maintenance No *</label>
              <input
                type="text"
                required
                value={formNo}
                onChange={(e) => setFormNo(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Service Date *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Maintenance Type *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as MaintenanceType)}
                className="form-select text-xs font-medium"
              >
                {MAINT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    {m.assetCode} — {m.machineryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Meter Reading at Service</label>
              <input
                type="number"
                step="0.01"
                required
                value={formReading}
                onChange={(e) => setFormReading(e.target.value)}
                className="form-input text-xs font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vendor / Workshop</label>
              <select
                value={formVendorId}
                onChange={(e) => setFormVendorId(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="">-- Internal P&amp;M Workshop --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vendorType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked Breakdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link Breakdown Incident (Optional)</label>
            <select
              value={formBreakdownId}
              onChange={(e) => setFormBreakdownId(e.target.value)}
              className="form-select text-xs"
            >
              <option value="">-- No Linked Breakdown (Routine / Preventive) --</option>
              {breakdowns.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.breakdownNo} — {b.problemDescription} ({b.status})
                </option>
              ))}
            </select>
          </div>

          {/* Diagnosis & Work Performed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Complaint / Symptoms</label>
              <input
                type="text"
                value={formComplaint}
                onChange={(e) => setFormComplaint(e.target.value)}
                placeholder="e.g. Engine overheating under heavy load..."
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Work Performed / Service Scope</label>
              <input
                type="text"
                value={formWorkPerformed}
                onChange={(e) => setFormWorkPerformed(e.target.value)}
                placeholder="e.g. Flushed radiator; changed coolant and thermostat valve..."
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Parts Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Required Spare Parts / Consumables</label>
            <textarea
              rows={2}
              value={formRequiredParts}
              onChange={(e) => setFormRequiredParts(e.target.value)}
              placeholder="e.g. 1x Thermostat valve (Cat #320-112), 20L Coolant concentrate, 1x Radiator cap..."
              className="form-input text-xs resize-none"
            />
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200/80">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formEstimatedCost}
                onChange={(e) => setFormEstimatedCost(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Parts Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formPartsCost}
                onChange={(e) => handleCostChange(e.target.value, formLabourCost)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Labour Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formLabourCost}
                onChange={(e) => handleCostChange(formPartsCost, e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Actual Total Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formActualCost}
                onChange={(e) => setFormActualCost(e.target.value)}
                className="form-input text-xs text-emerald-700 font-mono font-bold"
              />
            </div>
          </div>

          {/* Status & Next Service Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Job Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as MaintenanceStatus)}
                className="form-select text-xs font-semibold"
              >
                {MAINT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Next Service Reading</label>
              <input
                type="number"
                step="0.01"
                value={formNextReading}
                onChange={(e) => setFormNextReading(e.target.value)}
                placeholder="e.g. 15500"
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Next Service Due Date</label>
              <input
                type="date"
                value={formNextDate}
                onChange={(e) => setFormNextDate(e.target.value)}
                className="form-input text-xs font-mono"
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
              Save Maintenance Job
            </button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}

export default function MaintenancePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-gray-400 text-xs font-medium">Loading maintenance...</div>}>
      <MaintenanceContent />
    </React.Suspense>
  );
}
