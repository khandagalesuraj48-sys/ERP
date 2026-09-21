"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { QuickCreateModal } from "@/components/ui/QuickCreateModal";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getAssets,
  createAsset,
  transferAsset,
  getProjects,
  getSites,
  getVendors,
} from "@/lib/data/repository";
import type { Asset, Project, Site, Vendor } from "@/lib/types";

export default function AssetsPage() {
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] = useState<Asset | null>(null);

  // Asset Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Power Generator");
  const [serialNo, setSerialNo] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [condition, setCondition] = useState("Good");
  const [savingAsset, setSavingAsset] = useState(false);

  // Transfer Form states
  const [toProject, setToProject] = useState("");
  const [toSite, setToSite] = useState("");
  const [transferredBy, setTransferredBy] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [savingTransfer, setSavingTransfer] = useState(false);

  // Quick Create Modal states
  const [qcType, setQcType] = useState<"project" | "site" | "vendor">("project");
  const [isQcOpen, setIsQcOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [asts, prjs, stes, vnds] = await Promise.all([
        getAssets(),
        getProjects(),
        getSites(),
        getVendors(),
      ]);
      setAssets(asts);
      setProjects(prjs);
      setSites(stes);
      setVendors(vnds);
      if (prjs.length > 0 && !selectedProject) {
        setSelectedProject(prjs[0].id);
      }
    } catch (err: any) {
      showToast("Error", err.message || "Failed to load assets.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedProject, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Asset Registration
  async function handleSaveAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || !selectedSite || !name.trim()) {
      showToast("Validation Error", "Project, Site, and Asset Name are required.", "error");
      return;
    }
    setSavingAsset(true);
    try {
      const astCode = code.trim() || `AST-${Date.now().toString().slice(-4)}`;
      await createAsset({
        assetCode: astCode,
        assetName: name.trim(),
        category,
        serialNumber: serialNo.trim() || undefined,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        purchaseCost: purchaseCost || undefined,
        projectId: selectedProject,
        siteId: selectedSite,
        vendorId: vendorId || undefined,
        currentCondition: condition,
        status: "active",
      });

      showToast("Success", "Fixed Asset registered successfully.", "success");
      setIsAssetModalOpen(false);
      setName("");
      setCode("");
      loadData();
    } catch (err: any) {
      showToast("Creation Error", err.message || "Failed to register asset.", "error");
    } finally {
      setSavingAsset(false);
    }
  }

  // Asset Transfer
  async function handleTransferAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAssetForTransfer || !toProject || !toSite) {
      showToast("Validation Error", "Destination Project and Site are required.", "error");
      return;
    }
    setSavingTransfer(true);
    try {
      await transferAsset(
        selectedAssetForTransfer.id,
        toProject,
        toSite,
        transferredBy.trim() || "Plant Manager",
        transferReason.trim() || undefined
      );

      showToast("Success", `Asset ${selectedAssetForTransfer.assetCode} transferred successfully.`, "success");
      setIsTransferModalOpen(false);
      setSelectedAssetForTransfer(null);
      loadData();
    } catch (err: any) {
      showToast("Transfer Error", err.message || "Failed to transfer asset.", "error");
    } finally {
      setSavingTransfer(false);
    }
  }

  const assetSites = sites.filter((s) => s.projectId === selectedProject);
  const destinationSites = sites.filter((s) => s.projectId === toProject);

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.assetName.toLowerCase().includes(search.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Asset Master & Plant Registry"
        subtitle="Capital fixed assets, DG sets, batching plants, weighbridges, and project-to-site relocation tracking."
        action={
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="add" className="text-[18px]" /> Register Asset
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Icon name="search" className="absolute left-3 top-2.5 text-gray-400 text-[18px]" />
          <input
            type="text"
            placeholder="Search assets by code, name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-gray-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select text-xs font-medium w-full md:w-56"
          >
            <option value="all">All Asset Categories ({assets.length})</option>
            <option value="Power Generator">Power Generator (DG Set)</option>
            <option value="Batching Plant">Batching Plant</option>
            <option value="Lab Equipment">Lab Equipment</option>
            <option value="Weighbridge">Weighbridge</option>
            <option value="Survey Equipment">Survey Equipment</option>
            <option value="Prefab Structure">Prefab Structure</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-head">
                <th className="px-5 py-3">Asset Code</th>
                <th className="px-5 py-3">Asset Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Current Location</th>
                <th className="px-5 py-3">Make / Model</th>
                <th className="px-5 py-3">Condition</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 text-xs">
                    Loading Assets from Supabase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 text-xs">
                    No fixed assets registered yet. Click &quot;Register Asset&quot; to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((asset) => {
                  const prj = projects.find((p) => p.id === asset.projectId);
                  const st = sites.find((s) => s.id === asset.siteId);
                  return (
                    <tr key={asset.id} className="table-row">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-600 text-xs">{asset.assetCode}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 text-xs">{asset.assetName}</p>
                        {asset.serialNumber && (
                          <span className="block text-[11px] font-mono text-gray-500">
                            S/N: {asset.serialNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{asset.category}</td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="font-semibold text-gray-900 block">{prj?.name || "Project"}</span>
                        <span className="text-gray-500 text-[11px]">{st?.name || "Site"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">
                        {asset.make || "-"} {asset.model ? `/ ${asset.model}` : ""}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {asset.currentCondition}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedAssetForTransfer(asset);
                            setToProject("");
                            setToSite("");
                            setIsTransferModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Icon name="local_shipping" className="text-[14px]" /> Relocate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER ASSET */}
      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Register Fixed Asset">
        <form onSubmit={handleSaveAsset} className="space-y-4 pt-2">
          {/* Cascading Project -> Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Project *</label>
                <button
                  type="button"
                  onClick={() => { setQcType("project"); setIsQcOpen(true); }}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  + New Project
                </button>
              </div>
              <select
                required
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedSite("");
                }}
                className="form-select text-xs font-medium"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Site *</label>
                <button
                  type="button"
                  disabled={!selectedProject}
                  onClick={() => { setQcType("site"); setIsQcOpen(true); }}
                  className="text-[11px] text-blue-600 hover:underline font-medium disabled:text-gray-400"
                >
                  + New Site
                </button>
              </div>
              <select
                required
                disabled={!selectedProject}
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="">-- Select Site --</option>
                {assetSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Asset Code (Auto-generated if empty)
              </label>
              <input
                type="text"
                placeholder="e.g. AST-0001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Asset Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. 250 kVA Silent DG Set"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="Power Generator">Power Generator (DG Set)</option>
                <option value="Batching Plant">Batching Plant</option>
                <option value="Lab Equipment">Lab Testing Equipment</option>
                <option value="Weighbridge">Electronic Weighbridge</option>
                <option value="Survey Equipment">Survey Equipment</option>
                <option value="Prefab Structure">Prefab Camp Structure</option>
                <option value="Crane &amp; Hoist">Crane &amp; Hoist</option>
                <option value="Workshop Machine">Workshop Machine</option>
                <option value="Other">Other Asset</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                placeholder="e.g. SN-88219"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="Good">Good (Working)</option>
                <option value="Fair">Fair (Needs Minor Repair)</option>
                <option value="Poor">Poor (Major Overhaul Needed)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Make / Brand</label>
              <input
                type="text"
                placeholder="e.g. Cummins / Kirloskar"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                placeholder="e.g. QSB 6.7"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(Number(e.target.value))}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-700">Vendor / Supplier</label>
              <button
                type="button"
                onClick={() => { setQcType("vendor"); setIsQcOpen(true); }}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                + New Vendor
              </button>
            </div>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="form-select text-xs"
            >
              <option value="">-- Select Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.vendorCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAsset}
              className="btn-primary text-xs flex items-center gap-2"
            >
              {savingAsset ? "Saving..." : "Save Asset"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RELOCATE / TRANSFER ASSET */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`Relocate Asset: ${selectedAssetForTransfer?.assetCode} (${selectedAssetForTransfer?.assetName})`}
      >
        <form onSubmit={handleTransferAsset} className="space-y-4 pt-2">
          <div className="card p-3 bg-gray-50 text-xs text-gray-600">
            Current Location:{" "}
            <span className="text-gray-900 font-semibold">
              {projects.find((p) => p.id === selectedAssetForTransfer?.projectId)?.name} /{" "}
              {sites.find((s) => s.id === selectedAssetForTransfer?.siteId)?.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Destination Project *</label>
              <select
                required
                value={toProject}
                onChange={(e) => {
                  setToProject(e.target.value);
                  setToSite("");
                }}
                className="form-select text-xs font-medium"
              >
                <option value="">-- Select Destination Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Destination Site *</label>
              <select
                required
                disabled={!toProject}
                value={toSite}
                onChange={(e) => setToSite(e.target.value)}
                className="form-select text-xs font-medium"
              >
                <option value="">-- Select Destination Site --</option>
                {destinationSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transferred By / Driver</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Trailer Driver"
                value={transferredBy}
                onChange={(e) => setTransferredBy(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Reason</label>
              <input
                type="text"
                placeholder="e.g. Required for batching plant commissioning"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTransfer}
              className="btn-primary text-xs"
            >
              {savingTransfer ? "Processing Transfer..." : "Confirm Relocation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK CREATE MODAL */}
      <QuickCreateModal
        isOpen={isQcOpen}
        onClose={() => setIsQcOpen(false)}
        entityType={qcType}
        defaultProjectId={selectedProject}
        onCreated={(rec) => {
          loadData();
          if (qcType === "project") setSelectedProject(rec.id);
          else if (qcType === "site") setSelectedSite(rec.id);
          else if (qcType === "vendor") setVendorId(rec.id);
        }}
      />
    </PageTransition>
  );
}
