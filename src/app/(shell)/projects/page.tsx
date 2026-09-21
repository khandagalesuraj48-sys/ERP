"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  getProjects,
  createProject,
  updateProject,
  getSites,
  createSite,
  updateSite,
  getMachinery,
  getStores,
  getAssets,
} from "@/lib/data/repository";
import Link from "next/link";
import type { Project, Site, Machinery, Store, Asset } from "@/lib/types";

export default function ProjectsAndSitesPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Active Project Detail Tab
  const [activeTab, setActiveTab] = useState<"sites" | "stores" | "machinery" | "assets">("sites");

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // Project Form
  const [pCode, setPCode] = useState("");
  const [pName, setPName] = useState("");
  const [pClient, setPClient] = useState("");
  const [pStatus, setPStatus] = useState<Project["status"]>("active");
  const [pStart, setPStart] = useState("");
  const [pEnd, setPEnd] = useState("");
  const [pDesc, setPDesc] = useState("");

  // Site Form
  const [sCode, setSCode] = useState("");
  const [sName, setSName] = useState("");
  const [sAddress, setSAddress] = useState("");
  const [sInCharge, setSInCharge] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sActive, setSActive] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prjs, stes, machs, strs, asts] = await Promise.all([
        getProjects(),
        getSites(),
        getMachinery(),
        getStores(),
        getAssets(),
      ]);
      setProjects(prjs);
      setSites(stes);
      setMachinery(machs);
      setStores(strs);
      setAssets(asts);
      if (prjs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(prjs[0].id);
      }
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load projects.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectSites = sites.filter((s) => s.projectId === activeProject?.id);
  const projectMachines = machinery.filter(
    (m) => m.currentProjectId === activeProject?.id || m.projectId === activeProject?.id
  );
  const projectStores = stores.filter((st) => st.projectId === activeProject?.id);
  const projectAssets = assets.filter((a) => a.projectId === activeProject?.id);

  // Open Project Modal
  function handleOpenProjectModal(projectToEdit?: Project) {
    if (projectToEdit) {
      setEditingProject(projectToEdit);
      setPCode(projectToEdit.code);
      setPName(projectToEdit.name);
      setPClient(projectToEdit.clientName || "");
      setPStatus(projectToEdit.status);
      setPStart(projectToEdit.startDate || "");
      setPEnd(projectToEdit.targetCompletionDate || "");
      setPDesc(projectToEdit.description || "");
    } else {
      setEditingProject(null);
      setPCode("");
      setPName("");
      setPClient("");
      setPStatus("active");
      setPStart(new Date().toISOString().slice(0, 10));
      setPEnd("");
      setPDesc("");
    }
    setIsProjectModalOpen(true);
  }

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    if (!pCode.trim() || !pName.trim()) {
      showToast("Validation Error", "Project code and name are required.", "error");
      return;
    }

    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          code: pCode.trim().toUpperCase(),
          name: pName.trim(),
          clientName: pClient.trim() || undefined,
          status: pStatus,
          startDate: pStart || undefined,
          targetCompletionDate: pEnd || undefined,
          description: pDesc.trim() || undefined,
        });
        showToast("Success", `Project '${pCode}' updated.`);
      } else {
        const created = await createProject({
          code: pCode.trim().toUpperCase(),
          name: pName.trim(),
          clientName: pClient.trim() || undefined,
          status: pStatus,
          startDate: pStart || undefined,
          targetCompletionDate: pEnd || undefined,
          description: pDesc.trim() || undefined,
        });
        setSelectedProjectId(created.id);
        showToast("Success", `New Project '${pCode}' created.`);
      }
      setIsProjectModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to save project.", "error");
    }
  }

  // Open Site Modal
  function handleOpenSiteModal(siteToEdit?: Site) {
    if (siteToEdit) {
      setEditingSite(siteToEdit);
      setSCode(siteToEdit.code);
      setSName(siteToEdit.name);
      setSAddress(siteToEdit.address || "");
      setSInCharge(siteToEdit.inChargePerson || "");
      setSPhone(siteToEdit.contactPhone || "");
      setSActive(siteToEdit.isActive);
    } else {
      setEditingSite(null);
      setSCode("");
      setSName("");
      setSAddress("");
      setSInCharge("");
      setSPhone("");
      setSActive(true);
    }
    setIsSiteModalOpen(true);
  }

  async function handleSaveSite(e: React.FormEvent) {
    e.preventDefault();
    if (!sCode.trim() || !sName.trim()) {
      showToast("Validation Error", "Site code and name are required.", "error");
      return;
    }
    if (!activeProject) {
      showToast("Error", "Please select a project first.", "error");
      return;
    }

    try {
      if (editingSite) {
        await updateSite(editingSite.id, {
          code: sCode.trim().toUpperCase(),
          name: sName.trim(),
          address: sAddress.trim() || undefined,
          inChargePerson: sInCharge.trim() || undefined,
          contactPhone: sPhone.trim() || undefined,
          isActive: sActive,
        });
        showToast("Success", `Site '${sCode}' updated.`);
      } else {
        await createSite({
          projectId: activeProject.id,
          code: sCode.trim().toUpperCase(),
          name: sName.trim(),
          address: sAddress.trim() || undefined,
          inChargePerson: sInCharge.trim() || undefined,
          contactPhone: sPhone.trim() || undefined,
          isActive: sActive,
        });
        showToast("Success", `New Site '${sCode}' added to project.`);
      }
      setIsSiteModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to save site.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects & Work Sites"
        subtitle="Manage construction packages, project stretches, batching plants, and physical work sites."
        action={
          <button
            onClick={() => handleOpenProjectModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="add" className="text-[18px]" /> New Project
          </button>
        }
      />

      {loading ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading projects &amp; sites...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center max-w-lg mx-auto">
          <Icon name="location_city" className="text-blue-600 text-4xl mb-3 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No Projects Configured</h3>
          <p className="text-xs text-gray-500 mb-6">
            Create your first infrastructure or construction project to begin assigning machinery, logging run time, and issuing fuel.
          </p>
          <button
            onClick={() => handleOpenProjectModal()}
            className="btn-primary text-xs"
          >
            <Icon name="add" className="text-sm mr-1.5" /> Create Project Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Projects List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Projects ({projects.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {projects.map((p) => {
                const countS = sites.filter((s) => s.projectId === p.id).length;
                const isSelected = p.id === activeProject?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`card p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-500/20 shadow-sm"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        {p.code}
                      </span>
                      <StatusPill tone={p.status === "active" ? "green" : "slate"}>
                        {p.status}
                      </StatusPill>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{p.name}</h4>
                    {p.clientName && (
                      <p className="text-xs text-gray-500 mb-2">Client: {p.clientName}</p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                      <span>{countS} Work Sites</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProjectModal(p);
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Icon name="edit" className="text-xs" /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2 & 3: Selected Project Details & Sites Master */}
          <div className="lg:col-span-2 space-y-6">
            {activeProject && (
              <>
                {/* Project Overview Card */}
                <div className="card p-6 border-gray-200/80">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{activeProject.name}</h3>
                        <StatusPill tone={activeProject.status === "active" ? "green" : "slate"}>
                          {activeProject.status}
                        </StatusPill>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Code: <span className="font-mono text-gray-800 font-semibold">{activeProject.code}</span> ·
                        Client: <span className="text-gray-800 font-medium">{activeProject.clientName || "Direct"}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenSiteModal()}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <Icon name="add_location" className="text-sm text-blue-600" /> Add Work Site
                    </button>
                  </div>

                  {activeProject.description && (
                    <p className="text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      {activeProject.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-gray-500 text-[11px]">Active Work Sites</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{projectSites.length} Sites</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[11px]">Material Stores</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{projectStores.length} Stores</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[11px]">Assigned Machinery</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{projectMachines.length} Units</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[11px]">Site Assets</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{projectAssets.length} Assets</p>
                    </div>
                  </div>
                </div>

                {/* Tabbed Project Assets & Resources Layout */}
                <div className="card overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50/60 px-6 flex items-center gap-6 overflow-x-auto text-xs font-medium">
                    <button
                      onClick={() => setActiveTab("sites")}
                      className={`py-3 border-b-2 transition-colors ${
                        activeTab === "sites"
                          ? "border-blue-600 text-blue-600 font-semibold"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Work Sites ({projectSites.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("stores")}
                      className={`py-3 border-b-2 transition-colors ${
                        activeTab === "stores"
                          ? "border-blue-600 text-blue-600 font-semibold"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Material Stores ({projectStores.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("machinery")}
                      className={`py-3 border-b-2 transition-colors ${
                        activeTab === "machinery"
                          ? "border-blue-600 text-blue-600 font-semibold"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Assigned Machinery ({projectMachines.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("assets")}
                      className={`py-3 border-b-2 transition-colors ${
                        activeTab === "assets"
                          ? "border-blue-600 text-blue-600 font-semibold"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Fixed Assets ({projectAssets.length})
                    </button>
                  </div>

                  {/* Tab 1: Sites */}
                  {activeTab === "sites" && (
                    <div>
                      <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Work Sites in {activeProject.code}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Specific chainages, batching plants, borrow pits, and camp yards.
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenSiteModal()}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Icon name="add" className="text-sm" /> Add Site
                        </button>
                      </div>

                      {projectSites.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-xs">
                          <p className="mb-3">No work sites have been defined under this project yet.</p>
                          <button
                            onClick={() => handleOpenSiteModal()}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            + Add First Site to {activeProject.code}
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-head">
                                <th className="px-5 py-3">Site Code</th>
                                <th className="px-5 py-3">Site Name</th>
                                <th className="px-5 py-3">Location / Address</th>
                                <th className="px-5 py-3">In-Charge &amp; Phone</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {projectSites.map((s) => (
                                <tr key={s.id} className="table-row">
                                  <td className="px-5 py-3 font-mono font-semibold text-blue-600 text-xs">
                                    {s.code}
                                  </td>
                                  <td className="px-5 py-3 font-medium text-gray-900 text-xs">
                                    {s.name}
                                  </td>
                                  <td className="px-5 py-3 text-gray-600 text-xs">
                                    {s.address || "—"}
                                  </td>
                                  <td className="px-5 py-3 text-xs">
                                    <p className="text-gray-900 font-medium">{s.inChargePerson || "—"}</p>
                                    <p className="text-[11px] text-gray-500">{s.contactPhone || ""}</p>
                                  </td>
                                  <td className="px-5 py-3">
                                    <StatusPill tone={s.isActive ? "green" : "slate"}>
                                      {s.isActive ? "Active" : "Inactive"}
                                    </StatusPill>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSiteModal(s)}
                                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Project Stores */}
                  {activeTab === "stores" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Material Stores ({projectStores.length})
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">Stores and warehouses deployed at this project.</p>
                        </div>
                        <Link
                          href="/store"
                          className="btn-primary text-xs flex items-center gap-1"
                        >
                          <Icon name="warehouse" className="text-sm" /> Open Store Hub
                        </Link>
                      </div>

                      {projectStores.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-8 text-center">
                          No material stores registered under this project yet. Go to Store Hub to create stores.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-head">
                                <th className="px-4 py-2.5">Store Code</th>
                                <th className="px-4 py-2.5">Store Name</th>
                                <th className="px-4 py-2.5">Site Location</th>
                                <th className="px-4 py-2.5">Type</th>
                                <th className="px-4 py-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {projectStores.map((st) => {
                                const stSite = sites.find((s) => s.id === st.siteId);
                                return (
                                  <tr key={st.id} className="table-row">
                                    <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">
                                      {st.storeCode}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 text-xs">{st.storeName}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{stSite ? `${stSite.code} — ${stSite.name}` : "Central Project Store"}</td>
                                    <td className="px-4 py-3 capitalize text-gray-500 text-xs">{st.storeType}</td>
                                    <td className="px-4 py-3">
                                      <StatusPill tone={st.isActive ? "green" : "slate"}>
                                        {st.isActive ? "Active" : "Inactive"}
                                      </StatusPill>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Machinery */}
                  {activeTab === "machinery" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Assigned Machinery &amp; Equipment ({projectMachines.length})
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">Fleet deployed to this project&apos;s sites.</p>
                        </div>
                        <Link
                          href="/machinery"
                          className="btn-primary text-xs flex items-center gap-1"
                        >
                          <Icon name="precision_manufacturing" className="text-sm" /> Fleet Directory
                        </Link>
                      </div>

                      {projectMachines.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-8 text-center">
                          No machinery currently deployed to this project.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-head">
                                <th className="px-4 py-2.5">Asset Code</th>
                                <th className="px-4 py-2.5">Equipment Name</th>
                                <th className="px-4 py-2.5">Category</th>
                                <th className="px-4 py-2.5">Plate / Serial</th>
                                <th className="px-4 py-2.5">Current Meter</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {projectMachines.map((m) => (
                                <tr key={m.id} className="table-row">
                                  <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">
                                    {m.assetCode}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-gray-900 text-xs">
                                    {m.machineryName}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 text-xs">{m.category}</td>
                                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{m.registrationNo || "Non-Road"}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-gray-900 text-xs">
                                    {m.currentReading} {m.meterType}
                                  </td>
                                  <td className="px-4 py-3">
                                    <StatusPill tone={m.status === "active" ? "green" : m.status === "under_repair" ? "red" : "amber"}>
                                      {m.status.replace("_", " ")}
                                    </StatusPill>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Link
                                      href={`/machinery/${m.id}`}
                                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                      View &rarr;
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Fixed Assets */}
                  {activeTab === "assets" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Site Assets ({projectAssets.length})
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">Fixed assets and equipment deployed to this project.</p>
                        </div>
                        <Link
                          href="/assets"
                          className="btn-primary text-xs flex items-center gap-1"
                        >
                          <Icon name="inventory_2" className="text-sm" /> Asset Register
                        </Link>
                      </div>

                      {projectAssets.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-8 text-center">
                          No fixed assets currently deployed to this project.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-head">
                                <th className="px-4 py-2.5">Asset Code</th>
                                <th className="px-4 py-2.5">Asset Name</th>
                                <th className="px-4 py-2.5">Category</th>
                                <th className="px-4 py-2.5">Serial No</th>
                                <th className="px-4 py-2.5">Condition</th>
                                <th className="px-4 py-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {projectAssets.map((a) => (
                                <tr key={a.id} className="table-row">
                                  <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-xs">
                                    {a.assetCode}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-gray-900 text-xs">{a.assetName}</td>
                                  <td className="px-4 py-3 text-gray-600 text-xs">{a.category}</td>
                                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{a.serialNumber || "—"}</td>
                                  <td className="px-4 py-3 capitalize text-gray-600 text-xs">{a.currentCondition}</td>
                                  <td className="px-4 py-3">
                                    <StatusPill tone={a.status === "active" ? "green" : a.status === "under_repair" ? "amber" : "slate"}>
                                      {a.status.replace("_", " ")}
                                    </StatusPill>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProject ? `Edit Project: ${editingProject.code}` : "Create Construction Project"}
        subtitle="Foundational project record for assigning machinery and tracking site operations."
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Code *</label>
              <input
                type="text"
                required
                value={pCode}
                onChange={(e) => setPCode(e.target.value)}
                placeholder="e.g. PRJ-MUM-EXPR"
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client / Authority</label>
              <input
                type="text"
                value={pClient}
                onChange={(e) => setPClient(e.target.value)}
                placeholder="e.g. NHAI / MSRDC"
                className="form-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="e.g. Mumbai-Nagpur Expressway Package 4"
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={pStatus}
                onChange={(e) => setPStatus(e.target.value as Project["status"])}
                className="form-select text-xs font-medium"
              >
                <option value="active">Active</option>
                <option value="bidding">Bidding</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={pStart}
                onChange={(e) => setPStart(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Completion</label>
              <input
                type="date"
                value={pEnd}
                onChange={(e) => setPEnd(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project Scope &amp; Description</label>
            <textarea
              rows={3}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="Enter scope details, chainages, and key deliverables..."
              className="form-input text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
            >
              {editingProject ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Site Modal */}
      <Modal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        title={editingSite ? `Edit Site: ${editingSite.code}` : `Add Work Site to ${activeProject?.code}`}
        subtitle="Define physical construction location, batching plant, or section stretch."
      >
        <form onSubmit={handleSaveSite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Site Code *</label>
              <input
                type="text"
                required
                value={sCode}
                onChange={(e) => setSCode(e.target.value)}
                placeholder="e.g. SITE-CH-0-15"
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={sActive ? "true" : "false"}
                onChange={(e) => setSActive(e.target.value === "true")}
                className="form-select text-xs font-medium"
              >
                <option value="true">Active Site</option>
                <option value="false">Inactive / Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site Name *</label>
            <input
              type="text"
              required
              value={sName}
              onChange={(e) => setSName(e.target.value)}
              placeholder="e.g. Batching Plant #1 &amp; Pre-cast Yard"
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Site In-Charge Person</label>
              <input
                type="text"
                value={sInCharge}
                onChange={(e) => setSInCharge(e.target.value)}
                placeholder="e.g. Rajesh Sharma (Site Engineer)"
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={sPhone}
                onChange={(e) => setSPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="form-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Physical Address / Chainage Location</label>
            <textarea
              rows={2}
              value={sAddress}
              onChange={(e) => setSAddress(e.target.value)}
              placeholder="e.g. KM 12+400 Left hand side, Village Khardi, Panvel..."
              className="form-input text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsSiteModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
            >
              {editingSite ? "Save Site" : "Add Work Site"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
