"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getAttachments,
  createAttachment,
  uploadAttachmentFile,
  getMachinery,
  getComplianceAlerts,
} from "@/lib/data/repository";
import type { Attachment, Machinery, AttachmentDocType, EntityType, ComplianceAlertItem } from "@/lib/types";
import { getMachineryDisplayName } from "@/lib/types";

const DOC_TYPES: { label: string; value: AttachmentDocType }[] = [
  { label: "Insurance Policy", value: "insurance" },
  { label: "PUC Certificate", value: "puc" },
  { label: "RTO Fitness Certificate", value: "fitness" },
  { label: "Road Tax Receipt", value: "road_tax" },
  { label: "Quotation / Estimate", value: "quotation" },
  { label: "Vendor Invoice", value: "invoice" },
  { label: "Site Repair Photo", value: "repair_photo" },
  { label: "General Document", value: "general" },
];

function ComplianceContent() {
  const searchParams = useSearchParams();
  const queryMachineryId = searchParams.get("machineryId");

  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"matrix" | "documents">("matrix");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [alerts, setAlerts] = useState<{
    all: ComplianceAlertItem[];
    valid: ComplianceAlertItem[];
    expiringSoon: ComplianceAlertItem[];
    expired: ComplianceAlertItem[];
  }>({ all: [], valid: [], expiringSoon: [], expired: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState(queryMachineryId || "all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formEntityType, setFormEntityType] = useState<EntityType>("machinery");
  const [formEntityId, setFormEntityId] = useState(queryMachineryId || "");
  const [formDocType, setFormDocType] = useState<AttachmentDocType>("insurance");
  const [formFileName, setFormFileName] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsData, att, m] = await Promise.all([
        getComplianceAlerts(30),
        getAttachments(),
        getMachinery(),
      ]);
      setAlerts(alertsData);
      setAttachments(att);
      setMachinery(m);
      if (queryMachineryId && !formEntityId) {
        setFormEntityId(queryMachineryId);
      }
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load compliance data.", "error");
    } finally {
      setLoading(false);
    }
  }, [queryMachineryId, formEntityId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);

  function getDocStatus(expiry?: string | null): "valid" | "expiring" | "expired" | "none" {
    if (!expiry) return "none";
    const exp = new Date(expiry);
    if (exp < now) return "expired";
    if (exp <= thirtyDaysOut) return "expiring";
    return "valid";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormFile(file);
      if (!formFileName) {
        setFormFileName(file.name);
      }
    }
  }

  async function handleOpenModal(initialMachineryId?: string) {
    if (initialMachineryId) {
      setFormEntityId(initialMachineryId);
    } else if (machinery.length > 0 && !formEntityId) {
      setFormEntityId(machinery[0].id);
    }
    setFormFileName("");
    setFormExpiryDate("");
    setFormFile(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formEntityId) {
      showToast("Validation Error", "Please select an entity/machinery.", "error");
      return;
    }
    if (!formFileName.trim()) {
      showToast("Validation Error", "File title or name is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = `storage://attachments/documents/${formFileName}`;
      let fileSizeBytes = formFile ? formFile.size : 1024;
      let mimeType = formFile ? formFile.type : "application/pdf";

      if (formFile) {
        fileUrl = await uploadAttachmentFile(formFile, formEntityType, formEntityId);
      }

      await createAttachment({
        entityType: formEntityType,
        entityId: formEntityId,
        documentType: formDocType,
        fileName: formFileName.trim(),
        fileUrl,
        fileSizeBytes,
        mimeType,
        expiryDate: formExpiryDate || null,
        uploadedBy: "usr-admin-001",
      });

      showToast("Uploaded", `Document '${formFileName}' registered successfully.`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to upload document.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredAttachments = attachments.filter((a) => {
    const matchesType = typeFilter === "all" || a.documentType === typeFilter;
    const matchesMachine = machineFilter === "all" || a.entityId === machineFilter;
    const st = getDocStatus(a.expiryDate);
    const matchesStatus = statusFilter === "all" || st === statusFilter;
    return matchesType && matchesMachine && matchesStatus;
  });

  const filteredMachinery = machinery.filter((m) => {
    if (machineFilter !== "all" && m.id !== machineFilter) return false;
    return true;
  });

  const renderBadge = (dateStr?: string | null, docNo?: string | null) => {
    if (!dateStr) return <span className="text-gray-400 font-mono text-[11px]">—</span>;
    const exp = new Date(dateStr);
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
    const isExpired = daysLeft < 0;
    const isSoon = daysLeft >= 0 && daysLeft <= 30;

    return (
      <div className="space-y-0.5">
        <span
          className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded ${
            isExpired
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : isSoon
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {dateStr}
        </span>
        <div className="text-[10px]">
          {isExpired ? (
            <span className="text-rose-600 font-medium font-mono">Expired {Math.abs(daysLeft)}d ago</span>
          ) : isSoon ? (
            <span className="text-amber-600 font-medium font-mono">{daysLeft}d left</span>
          ) : (
            <span className="text-gray-500 font-mono">{daysLeft}d left</span>
          )}
          {docNo && <span className="text-gray-500 ml-1 font-mono truncate max-w-[100px] inline-block align-bottom">({docNo})</span>}
        </div>
      </div>
    );
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Compliance &amp; Statutory Control"
        subtitle="Universal construction statutory compliance: Road Tax, Fitness, Insurance, PUC, and Permits with active expiry alerts."
        action={
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="upload_file" className="text-base" />
            <span>Upload Document</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Valid Documents"
          value={String(alerts.valid.length)}
          sub="Compliant statutory records"
          icon="verified"
          accent="green"
        />
        <StatCard
          label="Expiring Soon"
          value={String(alerts.expiringSoon.length)}
          sub="Within next 30 days"
          icon="hourglass_bottom"
          accent="amber"
        />
        <StatCard
          label="Overdue / Expired"
          value={String(alerts.expired.length)}
          sub="Requires immediate renewal"
          icon="gpp_bad"
          accent="red"
        />
        <StatCard
          label="Active Machinery"
          value={String(machinery.length)}
          sub="Tracked in fleet master"
          icon="precision_manufacturing"
          accent="blue"
        />
      </div>

      {/* Urgent Compliance Alerts Callout */}
      {(alerts.expired.length > 0 || alerts.expiringSoon.length > 0) && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
            <Icon name="warning" className="text-amber-600 text-base" />
            <span>Active Statutory Compliance Alerts ({alerts.expired.length + alerts.expiringSoon.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {alerts.expired.slice(0, 6).map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-white border border-rose-200 shadow-2xs flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                      {item.label} Expired
                    </span>
                    <span className="font-mono text-xs font-semibold text-rose-700">{item.expiryDate}</span>
                  </div>
                  <p className="font-semibold text-xs text-gray-900 mt-1 truncate max-w-[200px]">{item.displayName}</p>
                  {item.documentNo && <p className="text-[10px] font-mono text-gray-500">Doc: {item.documentNo}</p>}
                </div>
                <Link
                  href={`/machinery/${item.machineryId}`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0 mt-1"
                >
                  View &rarr;
                </Link>
              </div>
            ))}
            {alerts.expiringSoon.slice(0, 6).map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      {item.label} Soon
                    </span>
                    <span className="font-mono text-xs font-semibold text-amber-700">{item.daysRemaining}d left</span>
                  </div>
                  <p className="font-semibold text-xs text-gray-900 mt-1 truncate max-w-[200px]">{item.displayName}</p>
                  {item.documentNo && <p className="text-[10px] font-mono text-gray-500">Doc: {item.documentNo}</p>}
                </div>
                <Link
                  href={`/machinery/${item.machineryId}`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0 mt-1"
                >
                  View &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5 gap-6">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "matrix"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Icon name="table_chart" className="text-base" />
          <span>Statutory Compliance Matrix ({machinery.length} Machines)</span>
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "documents"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Icon name="folder" className="text-base" />
          <span>Document &amp; Certificate Files ({attachments.length} Files)</span>
        </button>
      </div>

      {/* TAB 1: STATUTORY COMPLIANCE MATRIX */}
      {activeTab === "matrix" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Asset Code</th>
                  <th className="px-4 py-3">Machinery Equipment</th>
                  <th className="px-4 py-3">Ownership</th>
                  <th className="px-4 py-3">Road Tax</th>
                  <th className="px-4 py-3">Fitness</th>
                  <th className="px-4 py-3">Insurance</th>
                  <th className="px-4 py-3">PUC</th>
                  <th className="px-4 py-3">Permit</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMachinery.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {m.assetCode}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/machinery/${m.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {getMachineryDisplayName(m)}
                      </Link>
                      <p className="text-[11px] text-gray-500">{m.category ? m.category.toUpperCase() : ""}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        m.ownership === "rental"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {m.ownership === "rental" ? "Rental" : "Own"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{renderBadge(m.roadTaxExpiry, m.roadTaxDocNo)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{renderBadge(m.fitnessExpiry, m.fitnessDocNo)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{renderBadge(m.insuranceExpiry, m.insuranceDocNo)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{renderBadge(m.pucExpiry, m.pucDocNo)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{renderBadge(m.permitExpiry, m.permitDocNo)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(m.id)}
                        className="btn-secondary text-[11px] py-1 px-2.5 mr-2"
                      >
                        Upload Doc
                      </button>
                      <Link
                        href={`/machinery/${m.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOADED DOCUMENTS & CERTIFICATES */}
      {activeTab === "documents" && (
        <>
          {/* Filter Bar */}
          <div className="card p-3 mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select text-xs py-1.5"
              >
                <option value="all">All Document Types</option>
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <select
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
                className="form-select text-xs py-1.5"
              >
                <option value="all">All Machinery ({machinery.length})</option>
                {machinery.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.assetCode} — {getMachineryDisplayName(m)}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select text-xs py-1.5"
              >
                <option value="all">All Expiry Statuses</option>
                <option value="valid">Valid</option>
                <option value="expiring">Expiring Soon (&lt; 30d)</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing {filteredAttachments.length} files
            </div>
          </div>

          {loading ? (
            <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs">Loading compliance registry...</p>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <EmptyState
              icon="verified"
              title="No Compliance Records Found"
              description="Statutory documents (Insurance policies, PUC certificates, Fitness certificates, and invoices) are stored per machine."
              actionLabel="Upload First Document"
              actionHref="#"
              onAction={() => handleOpenModal()}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="table-head">
                    <tr>
                      <th className="px-5 py-3">Document Title</th>
                      <th className="px-5 py-3">Document Type</th>
                      <th className="px-5 py-3">Associated Asset</th>
                      <th className="px-5 py-3">Storage Object Path</th>
                      <th className="px-5 py-3">Expiry Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAttachments.map((a) => {
                      const m = machinery.find((mac) => mac.id === a.entityId);
                      const st = getDocStatus(a.expiryDate);
                      return (
                        <tr key={a.id} className="table-row">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Icon name="description" className="text-blue-600 text-base" />
                              <span className="font-semibold text-gray-900">{a.fileName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] capitalize font-medium">
                              {a.documentType.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-gray-900">
                              {m ? `${m.assetCode} — ${getMachineryDisplayName(m)}` : a.entityId.slice(0, 10)}
                            </p>
                            <p className="text-[11px] text-gray-500 capitalize">{a.entityType}</p>
                          </td>
                          <td className="px-5 py-3 font-mono text-[11px] text-gray-500 max-w-xs truncate">
                            {a.fileUrl}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-700">
                            {a.expiryDate || "—"}
                          </td>
                          <td className="px-5 py-3">
                            {st === "valid" ? (
                              <StatusPill tone="green">Valid</StatusPill>
                            ) : st === "expiring" ? (
                              <StatusPill tone="amber">Expiring Soon</StatusPill>
                            ) : st === "expired" ? (
                              <StatusPill tone="red">Expired</StatusPill>
                            ) : (
                              <span className="text-xs text-gray-400">Permanent</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer hover:underline">
                              View File
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Compliance Certificate or File"
        subtitle="Upload document to Supabase Storage and register object path in attachments table."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Entity Type</label>
              <select
                value={formEntityType}
                onChange={(e) => setFormEntityType(e.target.value as EntityType)}
                className="form-select w-full"
              >
                <option value="machinery">Machinery Equipment</option>
                <option value="breakdown">Breakdown Ticket</option>
                <option value="maintenance">Maintenance Record</option>
                <option value="fuel">Fuel Transaction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Machinery Asset *</label>
              <select
                required
                value={formEntityId}
                onChange={(e) => setFormEntityId(e.target.value)}
                className="form-select w-full"
              >
                <option value="">-- Select Machine --</option>
                {machinery.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.assetCode} — {getMachineryDisplayName(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document Category *</label>
              <select
                value={formDocType}
                onChange={(e) => setFormDocType(e.target.value as AttachmentDocType)}
                className="form-select w-full"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date (For Policies / PUC / Tax)</label>
              <input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                className="form-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title / File Name *</label>
            <input
              type="text"
              required
              value={formFileName}
              onChange={(e) => setFormFileName(e.target.value)}
              placeholder="e.g. Tata-Prima-Insurance-Policy-2026.pdf"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Choose File</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
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
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Upload Certificate</span>
            </button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}

export default function CompliancePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-gray-500">Loading compliance...</div>}>
      <ComplianceContent />
    </React.Suspense>
  );
}
