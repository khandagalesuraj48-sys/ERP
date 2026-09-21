"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { QuickCreateModal } from "@/components/ui/QuickCreateModal";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  getProjects,
  getSites,
  getStores,
  getItems,
  getVendors,
  getMachinery,
  getStoreStock,
  getMaterialInwards,
  createMaterialInward,
  getMaterialOutwards,
  createMaterialOutward,
  createStore,
  getStockLedger,
  createStockAdjustment,
  getStockTransfers,
  createStockTransfer,
  getMaterialReturns,
  createMaterialReturn,
} from "@/lib/data/repository";
import type {
  Project,
  Site,
  Store,
  Item,
  Vendor,
  Machinery,
  StoreStockSummary,
  MaterialInward,
  MaterialOutward,
  MaterialInwardItem,
  MaterialOutwardItem,
  StockTransaction,
  StockTransfer,
  StockTransferItem,
  MaterialReturn,
  MaterialReturnItem,
  TransferStatus,
} from "@/lib/types";

export default function StoreAndInventoryPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "stock" | "inward" | "outward" | "transfers" | "returns" | "adjustments" | "ledger" | "stores"
  >("stock");

  // Support deep-linking tabs like /store?tab=inward
  useEffect(() => {
    function handleTabFromUrl() {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab && ["stock", "inward", "outward", "transfers", "returns", "adjustments", "ledger", "stores"].includes(tab)) {
          setActiveTab(tab as any);
        }
      }
    }
    handleTabFromUrl();
    window.addEventListener("popstate", handleTabFromUrl);
    return () => window.removeEventListener("popstate", handleTabFromUrl);
  }, []);

  // Masters
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);

  // Transactions
  const [stockSummary, setStockSummary] = useState<StoreStockSummary[]>([]);
  const [inwards, setInwards] = useState<MaterialInward[]>([]);
  const [outwards, setOutwards] = useState<MaterialOutward[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [returnsList, setReturnsList] = useState<MaterialReturn[]>([]);
  const [ledger, setLedger] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [transferStoreFilter, setTransferStoreFilter] = useState<string>("");
  const [returnTypeFilter, setReturnTypeFilter] = useState<string>("all");
  const [returnStoreFilter, setReturnStoreFilter] = useState<string>("");
  const [ledgerItemFilter, setLedgerItemFilter] = useState<string>("");
  const [ledgerStoreFilter, setLedgerStoreFilter] = useState<string>("");

  // Quick Create Modal states
  const [qcType, setQcType] = useState<"project" | "site" | "vendor" | "store" | "item" | "engine" | "asset">("item");
  const [isQcOpen, setIsQcOpen] = useState(false);

  // New GRN Modal
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [grnProject, setGrnProject] = useState("");
  const [grnSite, setGrnSite] = useState("");
  const [grnStore, setGrnStore] = useState("");
  const [grnVendor, setGrnVendor] = useState("");
  const [grnPo, setGrnPo] = useState("");
  const [grnInvoice, setGrnInvoice] = useState("");
  const [grnChallan, setGrnChallan] = useState("");
  const [inwardItems, setInwardItems] = useState<{ itemId: string; quantity: number; rate: number; uom: string }[]>([
    { itemId: "", quantity: 1, rate: 0, uom: "Nos" },
  ]);
  const [savingGrn, setSavingGrn] = useState(false);

  // New Outward Modal
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [outProject, setOutProject] = useState("");
  const [outSite, setOutSite] = useState("");
  const [outStore, setOutStore] = useState("");
  const [outIssuedTo, setOutIssuedTo] = useState("");
  const [outMachinery, setOutMachinery] = useState("");
  const [outPurpose, setOutPurpose] = useState<any>("Machinery Repair");
  const [outwardItems, setOutwardItems] = useState<{ itemId: string; quantity: number; uom: string }[]>([
    { itemId: "", quantity: 1, uom: "Nos" },
  ]);
  const [savingOut, setSavingOut] = useState(false);

  // Stock Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromProject, setFromProject] = useState("");
  const [fromSite, setFromSite] = useState("");
  const [fromStore, setFromStore] = useState("");
  const [toProject, setToProject] = useState("");
  const [toSite, setToSite] = useState("");
  const [toStore, setToStore] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferIssuedBy, setTransferIssuedBy] = useState("");
  const [transferReceivedBy, setTransferReceivedBy] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferRemarks, setTransferRemarks] = useState("");
  const [transferStatus, setTransferStatus] = useState<TransferStatus>("received");
  const [transferItems, setTransferItems] = useState<{ itemId: string; quantity: number; uom: string; remarks: string }[]>([
    { itemId: "", quantity: 1, uom: "Nos", remarks: "" },
  ]);
  const [savingTransfer, setSavingTransfer] = useState(false);

  // Material Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnType, setReturnType] = useState<"store_return" | "vendor_return">("store_return");
  const [retProject, setRetProject] = useState("");
  const [retSite, setRetSite] = useState("");
  const [retStore, setRetStore] = useState("");
  const [retVendor, setRetVendor] = useState("");
  const [retMachinery, setRetMachinery] = useState("");
  const [retDate, setRetDate] = useState(new Date().toISOString().slice(0, 10));
  const [retReturnedBy, setRetReturnedBy] = useState("");
  const [retApprovedBy, setRetApprovedBy] = useState("");
  const [retOriginalRef, setRetOriginalRef] = useState("");
  const [retReason, setRetReason] = useState("Excess Unused Material");
  const [retRemarks, setRetRemarks] = useState("");
  const [retStatus, setRetStatus] = useState<"confirmed" | "draft">("confirmed");
  const [returnItems, setReturnItems] = useState<{ itemId: string; quantity: number; uom: string; remarks: string }[]>([
    { itemId: "", quantity: 1, uom: "Nos", remarks: "" },
  ]);
  const [savingReturn, setSavingReturn] = useState(false);

  // New Store Modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [strProject, setStrProject] = useState("");
  const [strSite, setStrSite] = useState("");
  const [strCode, setStrCode] = useState("");
  const [strName, setStrName] = useState("");
  const [strType, setStrType] = useState<any>("mechanical");
  const [strKeeper, setStrKeeper] = useState("");
  const [savingStore, setSavingStore] = useState(false);

  // Stock Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjProject, setAdjProject] = useState("");
  const [adjSite, setAdjSite] = useState("");
  const [adjStore, setAdjStore] = useState("");
  const [adjReason, setAdjReason] = useState<any>("Physical Count Difference");
  const [adjRemarks, setAdjRemarks] = useState("");
  const [adjApprovedBy, setAdjApprovedBy] = useState("");
  const [adjItems, setAdjItems] = useState<{ itemId: string; adjustmentType: "increase" | "decrease"; quantity: number; uom: string; remarks: string }[]>([
    { itemId: "", adjustmentType: "increase", quantity: 1, uom: "Nos", remarks: "" },
  ]);
  const [savingAdj, setSavingAdj] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prjs, stes, strs, itms, vnds, machs, stks, inws, outws, trfs, rets, ldgr] = await Promise.all([
        getProjects(),
        getSites(),
        getStores(),
        getItems(),
        getVendors(),
        getMachinery(),
        getStoreStock(),
        getMaterialInwards(),
        getMaterialOutwards(),
        getStockTransfers(),
        getMaterialReturns(),
        getStockLedger(),
      ]);
      setProjects(prjs);
      setSites(stes);
      setStores(strs);
      setItems(itms);
      setVendors(vnds);
      setMachinery(machs);
      setStockSummary(stks);
      setInwards(inws);
      setOutwards(outws);
      setTransfers(trfs);
      setReturnsList(rets);
      setLedger(ldgr);
    } catch (err: any) {
      showToast("Error", err.message || "Failed to load store data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // GRN Submission
  async function handleSaveGrn(e: React.FormEvent) {
    e.preventDefault();
    if (!grnProject || !grnSite || !grnStore || !grnVendor) {
      showToast("Validation Error", "Project, Site, Store, and Vendor are required.", "error");
      return;
    }
    const validItems = inwardItems.filter((i) => i.itemId && i.quantity > 0);
    if (validItems.length === 0) {
      showToast("Validation Error", "At least one item with valid quantity is required.", "error");
      return;
    }

    setSavingGrn(true);
    try {
      const itemsPayload: MaterialInwardItem[] = validItems.map((i) => {
        const itemObj = items.find((it) => it.id === i.itemId);
        return {
          itemId: i.itemId,
          quantity: Number(i.quantity),
          rate: Number(i.rate),
          uom: i.uom || itemObj?.uom || "Nos",
          gstPercent: Number(itemObj?.gstRatePercent || 18),
        };
      });

      await createMaterialInward(
        {
          projectId: grnProject,
          siteId: grnSite,
          storeId: grnStore,
          vendorId: grnVendor,
          poReference: grnPo.trim() || undefined,
          invoiceNo: grnInvoice.trim() || undefined,
          challanNo: grnChallan.trim() || undefined,
          status: "confirmed",
        },
        itemsPayload
      );

      showToast("Success", "Material Inward (GRN) confirmed. Stock increased automatically.", "success");
      setIsInwardModalOpen(false);
      setInwardItems([{ itemId: "", quantity: 1, rate: 0, uom: "Nos" }]);
      loadData();
    } catch (err: any) {
      showToast("GRN Error", err.message || "Failed to process inward.", "error");
    } finally {
      setSavingGrn(false);
    }
  }

  // Outward Submission
  async function handleSaveOutward(e: React.FormEvent) {
    e.preventDefault();
    if (!outProject || !outSite || !outStore || !outIssuedTo) {
      showToast("Validation Error", "Project, Site, Store, and Recipient are required.", "error");
      return;
    }
    const validItems = outwardItems.filter((i) => i.itemId && i.quantity > 0);
    if (validItems.length === 0) {
      showToast("Validation Error", "At least one item is required.", "error");
      return;
    }

    setSavingOut(true);
    try {
      const itemsPayload: MaterialOutwardItem[] = validItems.map((i) => {
        const itemObj = items.find((it) => it.id === i.itemId);
        return {
          itemId: i.itemId,
          quantity: Number(i.quantity),
          uom: i.uom || itemObj?.uom || "Nos",
        };
      });

      await createMaterialOutward(
        {
          projectId: outProject,
          siteId: outSite,
          storeId: outStore,
          issuedTo: outIssuedTo.trim(),
          machineryId: outMachinery || undefined,
          purpose: outPurpose,
          status: "confirmed",
        },
        itemsPayload
      );

      showToast("Success", "Material Outward issued successfully. Stock updated.", "success");
      setIsOutwardModalOpen(false);
      setOutwardItems([{ itemId: "", quantity: 1, uom: "Nos" }]);
      loadData();
    } catch (err: any) {
      showToast("Outward Error", err.message || "Failed to process outward issue.", "error");
    } finally {
      setSavingOut(false);
    }
  }

  // Store Creation
  async function handleSaveStore(e: React.FormEvent) {
    e.preventDefault();
    if (!strProject || !strSite || !strName.trim()) {
      showToast("Validation Error", "Project, Site, and Store Name are required.", "error");
      return;
    }
    setSavingStore(true);
    try {
      await createStore({
        projectId: strProject,
        siteId: strSite,
        storeCode: strCode.trim() || `STR-${Date.now().toString().slice(-4)}`,
        storeName: strName.trim(),
        storeType: strType,
        inChargePerson: strKeeper.trim() || undefined,
        isActive: true,
      });
      showToast("Success", "Physical Store created successfully.", "success");
      setIsStoreModalOpen(false);
      setStrName("");
      loadData();
    } catch (err: any) {
      showToast("Store Error", err.message || "Failed to create store.", "error");
    } finally {
      setSavingStore(false);
    }
  }

  // Filtered dropdowns for cascading
  const grnSites = sites.filter((s) => s.projectId === grnProject);
  const grnStores = stores.filter((s) => s.siteId === grnSite);

  const outSites = sites.filter((s) => s.projectId === outProject);
  const outStores = stores.filter((s) => s.siteId === outSite);
  const outMachines = machinery.filter((m) => !outSite || m.currentSiteId === outSite || m.siteId === outSite);

  const trfFromSites = sites.filter((s) => s.projectId === fromProject);
  const trfFromStores = stores.filter((s) => s.siteId === fromSite);
  const trfToSites = sites.filter((s) => s.projectId === toProject);
  const trfToStores = stores.filter((s) => s.siteId === toSite && s.id !== fromStore);

  const retSites = sites.filter((s) => s.projectId === retProject);
  const retStores = stores.filter((s) => s.siteId === retSite);
  const retMachines = machinery.filter((m) => !retSite || m.currentSiteId === retSite || m.siteId === retSite);

  const strSites = sites.filter((s) => s.projectId === strProject);
  const adjSites = sites.filter((s) => s.projectId === adjProject);
  const adjStores = stores.filter((s) => s.siteId === adjSite);

  const getStockFor = (storeId: string, itemId: string) => {
    return stockSummary.find((s) => s.storeId === storeId && s.itemId === itemId)?.availableQuantity || 0;
  };

  const filteredStock = selectedStoreId
    ? stockSummary.filter((s) => s.storeId === selectedStoreId)
    : stockSummary;

  const filteredTransfers = transfers.filter((t) => {
    if (transferStoreFilter && t.fromStoreId !== transferStoreFilter && t.toStoreId !== transferStoreFilter) return false;
    return true;
  });

  const filteredReturns = returnsList.filter((r) => {
    if (returnTypeFilter !== "all" && r.returnType !== returnTypeFilter) return false;
    if (returnStoreFilter && r.storeId !== returnStoreFilter) return false;
    return true;
  });

  const filteredLedger = ledger.filter((t) => {
    if (ledgerItemFilter && t.itemId !== ledgerItemFilter) return false;
    if (ledgerStoreFilter && t.storeId !== ledgerStoreFilter) return false;
    return true;
  });

  // Stock Transfer handler
  async function handleSaveTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!fromProject || !fromSite || !fromStore) {
      showToast("Validation Error", "Please select source project, site, and store.", "error");
      return;
    }
    if (!toProject || !toSite || !toStore) {
      showToast("Validation Error", "Please select destination project, site, and store.", "error");
      return;
    }
    if (fromStore === toStore) {
      showToast("Validation Error", "Source store and destination store cannot be the same.", "error");
      return;
    }
    const validItems = transferItems.filter((i) => i.itemId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      showToast("Validation Error", "Please add at least one item with valid quantity to transfer.", "error");
      return;
    }

    if (transferStatus === "received" || transferStatus === "in_transit") {
      for (const it of validItems) {
        const avail = getStockFor(fromStore, it.itemId);
        if (Number(it.quantity) > avail) {
          const itName = items.find((x) => x.id === it.itemId)?.itemName || "Item";
          showToast(
            "Insufficient Stock",
            `Cannot transfer ${it.quantity} of ${itName}. Only ${avail} available in source store.`,
            "error"
          );
          return;
        }
      }
    }

    setSavingTransfer(true);
    try {
      const created = await createStockTransfer(
        {
          fromProjectId: fromProject,
          fromSiteId: fromSite,
          fromStoreId: fromStore,
          toProjectId: toProject,
          toSiteId: toSite,
          toStoreId: toStore,
          transferDate,
          issuedBy: transferIssuedBy.trim() || undefined,
          receivedBy: transferReceivedBy.trim() || undefined,
          status: transferStatus,
          reason: transferReason.trim() || undefined,
          remarks: transferRemarks.trim() || undefined,
        },
        validItems.map((i) => ({
          itemId: i.itemId,
          quantity: Number(i.quantity),
          uom: i.uom || items.find((x) => x.id === i.itemId)?.uom || "Nos",
          remarks: i.remarks,
        }))
      );
      showToast("Success", `Stock Transfer ${created.transferNo} posted successfully.`, "success");
      setIsTransferModalOpen(false);
      setTransferItems([{ itemId: "", quantity: 1, uom: "Nos", remarks: "" }]);
      setTransferReason("");
      setTransferRemarks("");
      loadData();
    } catch (err: any) {
      showToast("Transfer Error", err.message || "Failed to save transfer.", "error");
    } finally {
      setSavingTransfer(false);
    }
  }

  // Material Return handler
  async function handleSaveReturn(e: React.FormEvent) {
    e.preventDefault();
    if (!retProject || !retSite || !retStore) {
      showToast("Validation Error", "Please select project, site, and store.", "error");
      return;
    }
    if (returnType === "vendor_return" && !retVendor) {
      showToast("Validation Error", "Vendor is required for vendor return.", "error");
      return;
    }
    const validItems = returnItems.filter((i) => i.itemId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      showToast("Validation Error", "Please add at least one item with valid quantity to return.", "error");
      return;
    }

    if (returnType === "vendor_return" && retStatus === "confirmed") {
      for (const it of validItems) {
        const avail = getStockFor(retStore, it.itemId);
        if (Number(it.quantity) > avail) {
          const itName = items.find((x) => x.id === it.itemId)?.itemName || "Item";
          showToast(
            "Insufficient Stock",
            `Cannot return ${it.quantity} of ${itName} to vendor. Store balance is only ${avail}.`,
            "error"
          );
          return;
        }
      }
    }

    setSavingReturn(true);
    try {
      const created = await createMaterialReturn(
        {
          returnType,
          projectId: retProject,
          siteId: retSite,
          storeId: retStore,
          vendorId: returnType === "vendor_return" ? retVendor : undefined,
          machineryId: returnType === "store_return" ? (retMachinery || undefined) : undefined,
          returnDate: retDate,
          returnedBy: retReturnedBy.trim() || undefined,
          approvedBy: retApprovedBy.trim() || undefined,
          originalReference: retOriginalRef.trim() || undefined,
          status: retStatus,
          reason: retReason.trim() || undefined,
          remarks: retRemarks.trim() || undefined,
        },
        validItems.map((i) => ({
          itemId: i.itemId,
          quantity: Number(i.quantity),
          uom: i.uom || items.find((x) => x.id === i.itemId)?.uom || "Nos",
          remarks: i.remarks,
        }))
      );
      showToast("Success", `Material Return ${created.returnNo} recorded successfully.`, "success");
      setIsReturnModalOpen(false);
      setReturnItems([{ itemId: "", quantity: 1, uom: "Nos", remarks: "" }]);
      setRetRemarks("");
      setRetOriginalRef("");
      loadData();
    } catch (err: any) {
      showToast("Return Error", err.message || "Failed to save return.", "error");
    } finally {
      setSavingReturn(false);
    }
  }

  // Stock Adjustment handler
  async function handleSaveAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!adjProject || !adjSite || !adjStore) {
      showToast("Validation Error", "Project, Site, and Store are required.", "error");
      return;
    }
    const validItems = adjItems.filter((i) => i.itemId && i.quantity > 0);
    if (validItems.length === 0) {
      showToast("Validation Error", "At least one item with valid quantity is required.", "error");
      return;
    }
    setSavingAdj(true);
    try {
      const result = await createStockAdjustment(
        {
          projectId: adjProject,
          siteId: adjSite,
          storeId: adjStore,
          reason: adjReason,
          remarks: adjRemarks.trim() || undefined,
          approvedBy: adjApprovedBy.trim() || undefined,
        },
        validItems.map((i) => ({
          itemId: i.itemId,
          adjustmentType: i.adjustmentType,
          quantity: Number(i.quantity),
          uom: i.uom || items.find((it) => it.id === i.itemId)?.uom || "Nos",
          remarks: i.remarks,
        }))
      );
      showToast("Success", `Stock Adjustment ${result.adjustmentNo} posted. Stock levels updated.`, "success");
      setIsAdjModalOpen(false);
      setAdjItems([{ itemId: "", adjustmentType: "increase", quantity: 1, uom: "Nos", remarks: "" }]);
      setAdjRemarks("");
      loadData();
    } catch (err: any) {
      showToast("Adjustment Error", err.message || "Failed to post adjustment.", "error");
    } finally {
      setSavingAdj(false);
    }
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Store &amp; Inventory Management"
        subtitle="Transactional stock engine, material inward (GRN), store issue slips, transfers, returns, and real-time site stock balances."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (projects.length > 0) setGrnProject(projects[0].id);
                setIsInwardModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm"
            >
              <Icon name="move_to_inbox" className="text-[16px]" /> Inward (GRN)
            </button>

            <button
              onClick={() => {
                if (projects.length > 0) setOutProject(projects[0].id);
                setIsOutwardModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm"
            >
              <Icon name="outbox" className="text-[16px]" /> Outward (Issue)
            </button>

            <button
              onClick={() => {
                if (projects.length > 0) {
                  setFromProject(projects[0].id);
                  setToProject(projects[0].id);
                }
                setIsTransferModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm"
            >
              <Icon name="swap_horiz" className="text-[16px]" /> Transfer
            </button>

            <button
              onClick={() => {
                if (projects.length > 0) setRetProject(projects[0].id);
                setIsReturnModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm"
            >
              <Icon name="assignment_return" className="text-[16px]" /> Return
            </button>

            <button
              onClick={() => {
                if (projects.length > 0) setAdjProject(projects[0].id);
                setIsAdjModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm"
            >
              <Icon name="tune" className="text-[16px]" /> Adjustment
            </button>

            <button
              onClick={() => {
                if (projects.length > 0) setStrProject(projects[0].id);
                setIsStoreModalOpen(true);
              }}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
            >
              <Icon name="add_business" className="text-[16px]" /> Add Store
            </button>
          </div>
        }
      />

      {/* 8 Navigation Tabs */}
      <div className="flex flex-wrap items-center p-1 bg-gray-100 rounded-xl mb-6 gap-1">
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "stock"
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="inventory" className="text-[16px]" /> Stock ({stockSummary.length})
        </button>

        <button
          onClick={() => setActiveTab("inward")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "inward"
              ? "bg-white text-emerald-700 shadow-sm border border-emerald-200"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="input" className="text-[16px]" /> Inward / GRN ({inwards.length})
        </button>

        <button
          onClick={() => setActiveTab("outward")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "outward"
              ? "bg-white text-rose-700 shadow-sm border border-rose-200"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="output" className="text-[16px]" /> Outward / Issue ({outwards.length})
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "transfers"
              ? "bg-white text-sky-700 shadow-sm border border-sky-200"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="swap_horiz" className="text-[16px]" /> Transfers ({transfers.length})
        </button>

        <button
          onClick={() => setActiveTab("returns")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "returns"
              ? "bg-white text-purple-700 shadow-sm border border-purple-200"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="assignment_return" className="text-[16px]" /> Returns ({returnsList.length})
        </button>

        <button
          onClick={() => setActiveTab("adjustments")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "adjustments"
              ? "bg-white text-amber-700 shadow-sm border border-amber-200"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="tune" className="text-[16px]" /> Adjustments
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "ledger"
              ? "bg-white text-blue-700 shadow-sm border border-blue-200"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="receipt_long" className="text-[16px]" /> Stock Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab("stores")}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === "stores"
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Icon name="warehouse" className="text-[16px]" /> Stores ({stores.length})
        </button>
      </div>

      {/* TAB 1: CURRENT STOCK BALANCES */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 card p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Filter by Store:</span>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="form-input text-xs py-1.5 text-xs w-64"
              >
                <option value="">All Stores Combined ({stores.length})</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storeName} ({s.storeCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-500">
              Formula: <span className="font-mono text-emerald-400 font-bold">Opening + Inward - Outward = Available Balance</span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="p-4">Store</th>
                    <th className="p-4">Item Code</th>
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Available Stock</th>
                    <th className="p-4">UOM</th>
                    <th className="p-4 text-right">Min Level</th>
                    <th className="p-4">Stock Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        Calculating transactional stock ledger...
                      </td>
                    </tr>
                  ) : filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        No active stock records. Create a Material Inward (GRN) to populate store stock.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((stk, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="p-4 font-semibold text-gray-900">{stk.storeName}</td>
                        <td className="p-4 font-mono font-bold text-primary">{stk.itemCode}</td>
                        <td className="p-4 font-semibold text-gray-900">{stk.itemName}</td>
                        <td className="p-4 text-gray-500">{stk.category}</td>
                        <td className="p-4 text-right font-mono font-extrabold text-lg text-emerald-400">
                          {stk.availableQuantity}
                        </td>
                        <td className="p-4 font-semibold text-gray-500">{stk.uom}</td>
                        <td className="p-4 text-right font-mono text-gray-500">{stk.minimumStock}</td>
                        <td className="p-4">
                          {stk.isLowStock ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INWARD GRN REGISTER */}
      {activeTab === "inward" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="p-4">GRN No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Store</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Invoice / Challan</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {inwards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No Material Inward GRNs registered yet.
                    </td>
                  </tr>
                ) : (
                  inwards.map((grn) => (
                    <tr key={grn.id} className="table-row">
                      <td className="p-4 font-mono font-bold text-gray-900">{grn.grnNo}</td>
                      <td className="p-4 text-gray-700">{grn.grnDate}</td>
                      <td className="p-4 text-gray-700">
                        {stores.find((s) => s.id === grn.storeId)?.storeName || "Store"}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">{grn.vendorName || "Vendor"}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">
                        Inv: {grn.invoiceNo || "-"} | Chl: {grn.challanNo || "-"}
                      </td>
                      <td className="p-4 text-center font-bold text-primary">{grn.items.length}</td>
                      <td className="p-4 text-right font-mono font-bold text-gray-900">
                        ₹{grn.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OUTWARD ISSUE REGISTER */}
      {activeTab === "outward" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="p-4">Issue Slip No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Store</th>
                  <th className="p-4">Issued To</th>
                  <th className="p-4">Machinery</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {outwards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No Material Outward issue slips created yet.
                    </td>
                  </tr>
                ) : (
                  outwards.map((iss) => (
                    <tr key={iss.id} className="table-row">
                      <td className="p-4 font-mono font-bold text-gray-900">{iss.issueNo}</td>
                      <td className="p-4 text-gray-700">{iss.issueDate}</td>
                      <td className="p-4 text-gray-700">
                        {stores.find((s) => s.id === iss.storeId)?.storeName || "Store"}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">{iss.issuedTo}</td>
                      <td className="p-4 font-mono text-xs text-primary">
                        {machinery.find((m) => m.id === iss.machineryId)?.assetCode || "-"}
                      </td>
                      <td className="p-4 text-xs text-gray-500">{iss.purpose}</td>
                      <td className="p-4 text-center font-bold text-rose-400">{iss.items.length}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Issued
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK TRANSFERS (Store-to-Store) */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 card p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Filter by Store:</span>
              <select
                value={transferStoreFilter}
                onChange={(e) => setTransferStoreFilter(e.target.value)}
                className="form-input text-xs py-1.5 text-xs w-64"
              >
                <option value="">All Stores ({stores.length})</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storeName} ({s.storeCode})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (projects.length > 0) {
                  setFromProject(projects[0].id);
                  setToProject(projects[0].id);
                }
                setIsTransferModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <Icon name="add" className="text-[16px]" /> New Store Transfer
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="p-4">Transfer No</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Source Store (From)</th>
                    <th className="p-4">Destination Store (To)</th>
                    <th className="p-4 text-center">Items</th>
                    <th className="p-4">Personnel</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        No Store-to-Store Transfers registered yet. Click &ldquo;New Store Transfer&rdquo; to initiate stock movement.
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((trf) => (
                      <tr key={trf.id} className="table-row">
                        <td className="p-4 font-mono font-bold text-sky-400">{trf.transferNo}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{trf.transferDate}</td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">
                            {stores.find((s) => s.id === trf.fromStoreId)?.storeName || "Source Store"}
                          </div>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {projects.find((p) => p.id === trf.fromProjectId)?.name || ""}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">
                            {stores.find((s) => s.id === trf.toStoreId)?.storeName || "Dest Store"}
                          </div>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {projects.find((p) => p.id === trf.toProjectId)?.name || ""}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-sky-400 font-mono">{trf.items.length}</span>
                          <div className="text-[11px] text-gray-500 truncate max-w-[160px]">
                            {trf.items.map((i) => `${i.itemName || "Item"} (${i.quantity} ${i.uom})`).join(", ")}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-700">
                          <div>Iss: <span className="text-gray-900">{trf.issuedBy || "—"}</span></div>
                          <div>Rec: <span className="text-gray-900">{trf.receivedBy || "—"}</span></div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              trf.status === "received"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : trf.status === "in_transit"
                                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                : trf.status === "cancelled"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-slate-700/40 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {trf.status === "received" ? "Confirmed / Received" : trf.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500 max-w-[180px] truncate">
                          {trf.reason || trf.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MATERIAL RETURNS (Store & Vendor) */}
      {activeTab === "returns" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Return Type:</span>
              <select
                value={returnTypeFilter}
                onChange={(e) => setReturnTypeFilter(e.target.value)}
                className="form-input text-xs py-1.5 text-xs w-44"
              >
                <option value="all">All Returns ({returnsList.length})</option>
                <option value="store_return">Store Returns (Site → Store)</option>
                <option value="vendor_return">Vendor Returns (Store → Vendor)</option>
              </select>

              <span className="text-xs font-semibold text-gray-500 ml-2">Store:</span>
              <select
                value={returnStoreFilter}
                onChange={(e) => setReturnStoreFilter(e.target.value)}
                className="form-input text-xs py-1.5 text-xs w-52"
              >
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (projects.length > 0) setRetProject(projects[0].id);
                setIsReturnModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <Icon name="add" className="text-[16px]" /> New Material Return
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="p-4">Return No</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Store</th>
                    <th className="p-4">Vendor / Equipment</th>
                    <th className="p-4 text-center">Items</th>
                    <th className="p-4">Personnel</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400">
                        No Material Returns registered yet. Click &ldquo;New Material Return&rdquo; to process store or vendor returns.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((ret) => (
                      <tr key={ret.id} className="table-row">
                        <td className="p-4 font-mono font-bold text-purple-400">{ret.returnNo}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{ret.returnDate}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              ret.returnType === "store_return"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {ret.returnType === "store_return" ? "Store Return (Inward)" : "Vendor Return (Outward)"}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-gray-900">
                          {stores.find((s) => s.id === ret.storeId)?.storeName || "Store"}
                        </td>
                        <td className="p-4 text-xs">
                          {ret.returnType === "vendor_return" ? (
                            <span className="font-semibold text-amber-300">{ret.vendorName || vendors.find(v => v.id === ret.vendorId)?.name || "Vendor"}</span>
                          ) : (
                            <span className="text-gray-700 font-mono">
                              {ret.machineryId ? machinery.find((m) => m.id === ret.machineryId)?.assetCode || ret.machineryId : "General Site Return"}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-purple-400 font-mono">{ret.items.length}</span>
                          <div className="text-[11px] text-gray-500 truncate max-w-[160px]">
                            {ret.items.map((i) => `${i.itemName || "Item"} (${i.quantity} ${i.uom})`).join(", ")}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-700">
                          <div>Ret: <span className="text-gray-900">{ret.returnedBy || "—"}</span></div>
                          <div>App: <span className="text-gray-900">{ret.approvedBy || "—"}</span></div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              ret.status === "confirmed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-700/40 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {ret.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500 max-w-[180px] truncate">
                          <div>{ret.reason || "—"}</div>
                          {ret.originalReference && (
                            <div className="text-[10px] text-primary font-mono">Ref: {ret.originalReference}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: STORES DIRECTORY */}
      {activeTab === "stores" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => (
            <div key={s.id} className="card p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-primary">{s.storeCode}</span>
                  <h3 className="text-lg font-bold text-gray-900">{s.storeName}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                  {s.storeType}
                </span>
              </div>

              <div className="text-xs space-y-1 text-gray-500 pt-2 border-t border-gray-200">
                <p>
                  Project: <span className="text-gray-900 font-semibold">{projects.find((p) => p.id === s.projectId)?.name || s.projectId}</span>
                </p>
                <p>
                  Site: <span className="text-gray-900 font-semibold">{sites.find((st) => st.id === s.siteId)?.name || s.siteId}</span>
                </p>
                <p>In-Charge: <span className="text-gray-900">{s.inChargePerson || "Not Assigned"}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: STOCK LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 card p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Item:</span>
              <select
                value={ledgerItemFilter}
                onChange={(e) => setLedgerItemFilter(e.target.value)}
                className="form-input text-xs py-1.5 text-xs w-56"
              >
                <option value="">All Items</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.itemName} ({it.itemCode})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Store:</span>
              <select
                value={ledgerStoreFilter}
                onChange={(e) => setLedgerStoreFilter(e.target.value)}
                className="form-input text-xs py-1.5 text-xs w-52"
              >
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.storeName}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-500 ml-auto font-mono">
              Showing {filteredLedger.length} transactions
            </span>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Txn Type</th>
                    <th className="p-4">Reference No</th>
                    <th className="p-4">Store</th>
                    <th className="p-4">Item</th>
                    <th className="p-4 text-right">Quantity</th>
                    <th className="p-4">UOM</th>
                    <th className="p-4 text-right">Unit Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        No stock transactions yet. Create a GRN or Outward Issue to see ledger entries.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((t) => {
                      const isPositive = t.quantity > 0;
                      const txnLabel: Record<string, string> = {
                        opening: "Opening", inward: "Inward (GRN)", outward: "Issue",
                        transfer_in: "Transfer In", transfer_out: "Transfer Out",
                        return_in: "Return In", return_out: "Return Out",
                        adjustment_pos: "Adjustment +", adjustment_neg: "Adjustment −",
                      };
                      return (
                        <tr key={t.id} className="table-row">
                          <td className="p-4 text-xs text-gray-500 font-mono">{t.transactionDate}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                              {txnLabel[t.transactionType] || t.transactionType}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-primary">{t.referenceNo}</td>
                          <td className="p-4 text-sm text-gray-700">{stores.find((s) => s.id === t.storeId)?.storeName || t.storeId}</td>
                          <td className="p-4 text-sm font-semibold text-gray-900">{items.find((it) => it.id === t.itemId)?.itemName || t.itemId}</td>
                          <td className={`p-4 text-right font-mono font-extrabold text-lg ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{t.quantity}
                          </td>
                          <td className="p-4 text-gray-500">{t.uom}</td>
                          <td className="p-4 text-right font-mono text-gray-500">
                            {t.unitRate > 0 ? `₹${t.unitRate.toLocaleString("en-IN")}` : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: STOCK ADJUSTMENTS */}
      {activeTab === "adjustments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Stock adjustments correct discrepancies found during physical counting or due to damage/loss.</p>
            <button
              onClick={() => {
                if (projects.length > 0) setAdjProject(projects[0].id);
                setIsAdjModalOpen(true);
              }}
              className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-gray-900 px-4 py-2 rounded-xl font-bold text-sm"
            >
              <Icon name="tune" className="text-[18px]" /> New Adjustment
            </button>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Txn Type</th>
                    <th className="p-4">Reference No</th>
                    <th className="p-4">Store</th>
                    <th className="p-4">Item</th>
                    <th className="p-4 text-right">Qty Change</th>
                    <th className="p-4">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {ledger.filter((t) => t.transactionType === "adjustment_pos" || t.transactionType === "adjustment_neg").length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        No stock adjustments posted yet. Click "New Adjustment" to correct stock discrepancies.
                      </td>
                    </tr>
                  ) : (
                    ledger
                      .filter((t) => t.transactionType === "adjustment_pos" || t.transactionType === "adjustment_neg")
                      .map((t) => {
                        const isPositive = t.quantity > 0;
                        return (
                          <tr key={t.id} className="table-row">
                            <td className="p-4 text-xs text-gray-500 font-mono">{t.transactionDate}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {isPositive ? "Increase +" : "Decrease −"}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-amber-400">{t.referenceNo}</td>
                            <td className="p-4 text-sm text-gray-700">{stores.find((s) => s.id === t.storeId)?.storeName || t.storeId}</td>
                            <td className="p-4 text-sm font-semibold text-gray-900">{items.find((it) => it.id === t.itemId)?.itemName || t.itemId}</td>
                            <td className={`p-4 text-right font-mono font-extrabold text-lg ${isPositive ? "text-emerald-400" : "text-amber-400"}`}>
                              {isPositive ? "+" : ""}{t.quantity}
                            </td>
                            <td className="p-4 text-gray-500">{t.uom}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MATERIAL INWARD (GRN) */}
      <Modal isOpen={isInwardModalOpen} onClose={() => setIsInwardModalOpen(false)} title="Material Inward / Goods Receipt Note (GRN)">
        <form onSubmit={handleSaveGrn} className="space-y-4 pt-2">
          {/* Cascading Project -> Site -> Store */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Project *</label>
                <button
                  type="button"
                  onClick={() => { setQcType("project"); setIsQcOpen(true); }}
                  className="text-[11px] text-primary hover:underline font-bold"
                >
                  + New Project
                </button>
              </div>
              <select
                required
                value={grnProject}
                onChange={(e) => {
                  setGrnProject(e.target.value);
                  setGrnSite("");
                  setGrnStore("");
                }}
                className="form-input text-xs"
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
                <label className="text-xs font-semibold text-gray-700">Site *</label>
                <button
                  type="button"
                  disabled={!grnProject}
                  onClick={() => { setQcType("site"); setIsQcOpen(true); }}
                  className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                >
                  + New Site
                </button>
              </div>
              <select
                required
                disabled={!grnProject}
                value={grnSite}
                onChange={(e) => {
                  setGrnSite(e.target.value);
                  setGrnStore("");
                }}
                className="form-input text-xs"
              >
                <option value="">-- Select Site --</option>
                {grnSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Store *</label>
                <button
                  type="button"
                  disabled={!grnSite}
                  onClick={() => { setQcType("store"); setIsQcOpen(true); }}
                  className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                >
                  + New Store
                </button>
              </div>
              <select
                required
                disabled={!grnSite}
                value={grnStore}
                onChange={(e) => setGrnStore(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">-- Select Store --</option>
                {grnStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storeName} ({s.storeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Vendor *</label>
                <button
                  type="button"
                  onClick={() => { setQcType("vendor"); setIsQcOpen(true); }}
                  className="text-[11px] text-primary hover:underline font-bold"
                >
                  + New Vendor
                </button>
              </div>
              <select
                required
                value={grnVendor}
                onChange={(e) => setGrnVendor(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vendorCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Invoice Number</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-99"
                value={grnInvoice}
                onChange={(e) => setGrnInvoice(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Challan / DC No</label>
              <input
                type="text"
                placeholder="e.g. DC-0081"
                value={grnChallan}
                onChange={(e) => setGrnChallan(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Inward Items</h4>
              <button
                type="button"
                onClick={() => setInwardItems([...inwardItems, { itemId: "", quantity: 1, rate: 0, uom: "Nos" }])}
                className="text-xs font-bold text-primary hover:text-blue-400 flex items-center gap-1"
              >
                <Icon name="add" className="text-[16px]" /> Add Item Row
              </button>
            </div>

            {inwardItems.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50/40 p-2.5 rounded-xl border border-gray-200">
                <div className="col-span-5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-500 font-semibold">Material / Part</span>
                    <button
                      type="button"
                      onClick={() => { setQcType("item"); setIsQcOpen(true); }}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      + New Item
                    </button>
                  </div>
                  <select
                    required
                    value={row.itemId}
                    onChange={(e) => {
                      const sel = items.find((it) => it.id === e.target.value);
                      const copy = [...inwardItems];
                      copy[idx].itemId = e.target.value;
                      if (sel) copy[idx].uom = sel.uom;
                      setInwardItems(copy);
                    }}
                    className="form-input text-xs text-xs py-1.5"
                  >
                    <option value="">-- Choose Item --</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.itemName} ({it.itemCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-gray-500 font-semibold block mb-1">Qty</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={row.quantity}
                    onChange={(e) => {
                      const copy = [...inwardItems];
                      copy[idx].quantity = Number(e.target.value);
                      setInwardItems(copy);
                    }}
                    className="form-input text-xs text-xs py-1.5 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-gray-500 font-semibold block mb-1">UOM</span>
                  <input
                    type="text"
                    readOnly
                    value={row.uom}
                    className="form-input text-xs text-xs py-1.5 bg-gray-50 text-gray-500"
                  />
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-gray-500 font-semibold block mb-1">Rate (₹)</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={row.rate}
                    onChange={(e) => {
                      const copy = [...inwardItems];
                      copy[idx].rate = Number(e.target.value);
                      setInwardItems(copy);
                    }}
                    className="form-input text-xs text-xs py-1.5 font-mono"
                  />
                </div>

                <div className="col-span-1 pt-4 text-center">
                  {inwardItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInwardItems(inwardItems.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsInwardModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200 hover:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingGrn}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              {savingGrn ? "Processing..." : "Confirm GRN & Post Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD MATERIAL OUTWARD (STORE ISSUE) */}
      <Modal isOpen={isOutwardModalOpen} onClose={() => setIsOutwardModalOpen(false)} title="Issue Material Outward Slip">
        <form onSubmit={handleSaveOutward} className="space-y-4 pt-2">
          {/* Cascading Project -> Site -> Store */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project *</label>
              <select
                required
                value={outProject}
                onChange={(e) => {
                  setOutProject(e.target.value);
                  setOutSite("");
                  setOutStore("");
                }}
                className="form-input text-xs"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Site *</label>
              <select
                required
                disabled={!outProject}
                value={outSite}
                onChange={(e) => {
                  setOutSite(e.target.value);
                  setOutStore("");
                }}
                className="form-input text-xs"
              >
                <option value="">-- Select Site --</option>
                {outSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store *</label>
              <select
                required
                disabled={!outSite}
                value={outStore}
                onChange={(e) => setOutStore(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">-- Select Store --</option>
                {outStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Issued To (Person) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mechanic Mahesh / Operator"
                value={outIssuedTo}
                onChange={(e) => setOutIssuedTo(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Target Machinery</label>
              <select
                value={outMachinery}
                onChange={(e) => setOutMachinery(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">-- Site Consumption / General --</option>
                {outMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.assetCode}] {m.machineryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Issue Purpose</label>
              <select
                value={outPurpose}
                onChange={(e) => setOutPurpose(e.target.value)}
                className="form-input text-xs"
              >
                <option value="Machinery Repair">Machinery Repair</option>
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Breakdown">Breakdown Overhaul</option>
                <option value="Site Consumption">Site Consumption</option>
                <option value="Construction Work">Construction Work</option>
                <option value="General Consumption">General Consumption</option>
              </select>
            </div>
          </div>

          {/* Line items with real-time available stock validation */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Items to Issue</h4>
              <button
                type="button"
                onClick={() => setOutwardItems([...outwardItems, { itemId: "", quantity: 1, uom: "Nos" }])}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Icon name="add" className="text-[16px]" /> Add Item Row
              </button>
            </div>

            {outwardItems.map((row, idx) => {
              const matchedStock = stockSummary.find(
                (s) => s.storeId === outStore && s.itemId === row.itemId
              );
              const available = matchedStock ? matchedStock.availableQuantity : 0;
              const hasInsufficientStock = outStore && row.itemId && row.quantity > available;

              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50/40 p-2.5 rounded-xl border border-gray-200">
                  <div className="col-span-6">
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">Item to Issue</span>
                    <select
                      required
                      value={row.itemId}
                      onChange={(e) => {
                        const sel = items.find((it) => it.id === e.target.value);
                        const copy = [...outwardItems];
                        copy[idx].itemId = e.target.value;
                        if (sel) copy[idx].uom = sel.uom;
                        setOutwardItems(copy);
                      }}
                      className="form-input text-xs text-xs py-1.5"
                    >
                      <option value="">-- Choose Item --</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.itemName} ({it.itemCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">
                      Qty {outStore && row.itemId && (
                        <span className="text-emerald-400 font-mono"> (Avail: {available})</span>
                      )}
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={row.quantity}
                      onChange={(e) => {
                        const copy = [...outwardItems];
                        copy[idx].quantity = Number(e.target.value);
                        setOutwardItems(copy);
                      }}
                      className={`form-input text-xs text-xs py-1.5 font-mono ${hasInsufficientStock ? "border-rose-500 text-rose-400" : ""}`}
                    />
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">UOM</span>
                    <input
                      type="text"
                      readOnly
                      value={row.uom}
                      className="form-input text-xs text-xs py-1.5 bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div className="col-span-1 pt-4 text-center">
                    {outwardItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setOutwardItems(outwardItems.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOutwardModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingOut}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md flex items-center gap-2"
            >
              {savingOut ? "Validating & Issuing..." : "Confirm Store Issue Slip"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD STORE */}
      <Modal isOpen={isStoreModalOpen} onClose={() => setIsStoreModalOpen(false)} title="Register Physical Store">
        <form onSubmit={handleSaveStore} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project *</label>
              <select
                required
                value={strProject}
                onChange={(e) => {
                  setStrProject(e.target.value);
                  setStrSite("");
                }}
                className="form-input text-xs"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Site *</label>
              <select
                required
                disabled={!strProject}
                value={strSite}
                onChange={(e) => setStrSite(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">-- Select Site --</option>
                {strSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Store Code</label>
              <input
                type="text"
                placeholder="e.g. STR-MUM-01"
                value={strCode}
                onChange={(e) => setStrCode(e.target.value.toUpperCase())}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Central Mechanical Store"
                value={strName}
                onChange={(e) => setStrName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Store Type</label>
              <select
                value={strType}
                onChange={(e) => setStrType(e.target.value)}
                className="form-input text-xs"
              >
                <option value="mechanical">Mechanical Store</option>
                <option value="spare_parts">Spare Parts Store</option>
                <option value="general">General Store</option>
                <option value="electrical">Electrical Store</option>
                <option value="site_store">Site Local Store</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Store Keeper / In-Charge</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Shinde"
                value={strKeeper}
                onChange={(e) => setStrKeeper(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsStoreModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingStore}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-container hover:bg-blue-600 rounded-lg shadow-md"
            >
              {savingStore ? "Saving..." : "Save Store"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: STOCK ADJUSTMENT */}
      <Modal isOpen={isAdjModalOpen} onClose={() => setIsAdjModalOpen(false)} title="Post Stock Adjustment">
        <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-2">
          {/* Cascading Project -> Site -> Store */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project *</label>
              <select
                required
                value={adjProject}
                onChange={(e) => { setAdjProject(e.target.value); setAdjSite(""); setAdjStore(""); }}
                className="form-input text-xs"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Site *</label>
              <select
                required
                disabled={!adjProject}
                value={adjSite}
                onChange={(e) => { setAdjSite(e.target.value); setAdjStore(""); }}
                className="form-input text-xs"
              >
                <option value="">-- Select Site --</option>
                {adjSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store *</label>
              <select
                required
                disabled={!adjSite}
                value={adjStore}
                onChange={(e) => setAdjStore(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">-- Select Store --</option>
                {adjStores.map((s) => <option key={s.id} value={s.id}>{s.storeName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason *</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="form-input text-xs"
              >
                <option value="Physical Count Difference">Physical Count Difference</option>
                <option value="Damage">Damage / Breakage</option>
                <option value="Loss">Loss / Theft</option>
                <option value="Found Material">Found Material (Excess)</option>
                <option value="Data Correction">Data Correction</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Approved By</label>
              <input
                type="text"
                placeholder="e.g. Plant Manager"
                value={adjApprovedBy}
                onChange={(e) => setAdjApprovedBy(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Items to Adjust</h4>
              <button
                type="button"
                onClick={() => setAdjItems([...adjItems, { itemId: "", adjustmentType: "increase", quantity: 1, uom: "Nos", remarks: "" }])}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Icon name="add" className="text-[16px]" /> Add Row
              </button>
            </div>

            {adjItems.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50/40 p-2.5 rounded-xl border border-gray-200">
                <div className="col-span-4">
                  <span className="text-[10px] text-gray-500 font-semibold block mb-1">Item *</span>
                  <select
                    required
                    value={row.itemId}
                    onChange={(e) => {
                      const sel = items.find((it) => it.id === e.target.value);
                      const copy = [...adjItems];
                      copy[idx].itemId = e.target.value;
                      if (sel) copy[idx].uom = sel.uom;
                      setAdjItems(copy);
                    }}
                    className="form-input text-xs text-xs py-1.5"
                  >
                    <option value="">-- Item --</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.itemName} ({it.itemCode})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <span className="text-[10px] text-gray-500 font-semibold block mb-1">Type</span>
                  <select
                    value={row.adjustmentType}
                    onChange={(e) => {
                      const copy = [...adjItems];
                      copy[idx].adjustmentType = e.target.value as "increase" | "decrease";
                      setAdjItems(copy);
                    }}
                    className={`form-input text-xs text-xs py-1.5 font-bold ${row.adjustmentType === "increase" ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    <option value="increase">+ Increase</option>
                    <option value="decrease">− Decrease</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-gray-500 font-semibold block mb-1">Qty *</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={row.quantity}
                    onChange={(e) => {
                      const copy = [...adjItems];
                      copy[idx].quantity = Number(e.target.value);
                      setAdjItems(copy);
                    }}
                    className="form-input text-xs text-xs py-1.5 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-gray-500 font-semibold block mb-1">UOM</span>
                  <input
                    type="text"
                    readOnly
                    value={row.uom}
                    className="form-input text-xs text-xs py-1.5 bg-gray-50 text-gray-500"
                  />
                </div>

                <div className="col-span-1 pt-4 text-center">
                  {adjItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAdjItems(adjItems.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Internal Remarks</label>
            <textarea
              rows={2}
              placeholder="Reason for adjustment, observations during stock-take..."
              value={adjRemarks}
              onChange={(e) => setAdjRemarks(e.target.value)}
              className="form-input text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAdjModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAdj}
              className="px-5 py-2 text-sm font-semibold text-gray-900 bg-amber-700 hover:bg-amber-600 rounded-lg shadow-md flex items-center gap-2"
            >
              {savingAdj ? "Posting..." : "Post Adjustment & Update Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: STOCK TRANSFER (Store-to-Store) */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Store-to-Store Stock Transfer Voucher">
        <form onSubmit={handleSaveTransfer} className="space-y-4 pt-2">
          {/* Source Store Group */}
          <div className="p-3.5 rounded-xl bg-gray-50/60 border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Icon name="upload" className="text-[16px]" /> Source Location (From)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">From Project *</label>
                  <button
                    type="button"
                    onClick={() => { setQcType("project"); setIsQcOpen(true); }}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  value={fromProject}
                  onChange={(e) => {
                    setFromProject(e.target.value);
                    setFromSite("");
                    setFromStore("");
                  }}
                  className="form-input text-xs"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">From Site *</label>
                  <button
                    type="button"
                    disabled={!fromProject}
                    onClick={() => { setQcType("site"); setIsQcOpen(true); }}
                    className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  disabled={!fromProject}
                  value={fromSite}
                  onChange={(e) => {
                    setFromSite(e.target.value);
                    setFromStore("");
                  }}
                  className="form-input text-xs"
                >
                  <option value="">-- Select Site --</option>
                  {trfFromSites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">From Store *</label>
                  <button
                    type="button"
                    disabled={!fromSite}
                    onClick={() => { setQcType("store"); setIsQcOpen(true); }}
                    className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  disabled={!fromSite}
                  value={fromStore}
                  onChange={(e) => setFromStore(e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">-- Select Store --</option>
                  {trfFromStores.map((s) => (
                    <option key={s.id} value={s.id}>{s.storeName} ({s.storeCode})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Destination Store Group */}
          <div className="p-3.5 rounded-xl bg-gray-50/60 border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Icon name="download" className="text-[16px]" /> Destination Location (To)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">To Project *</label>
                  <button
                    type="button"
                    onClick={() => { setQcType("project"); setIsQcOpen(true); }}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  value={toProject}
                  onChange={(e) => {
                    setToProject(e.target.value);
                    setToSite("");
                    setToStore("");
                  }}
                  className="form-input text-xs"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">To Site *</label>
                  <button
                    type="button"
                    disabled={!toProject}
                    onClick={() => { setQcType("site"); setIsQcOpen(true); }}
                    className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  disabled={!toProject}
                  value={toSite}
                  onChange={(e) => {
                    setToSite(e.target.value);
                    setToStore("");
                  }}
                  className="form-input text-xs"
                >
                  <option value="">-- Select Site --</option>
                  {trfToSites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">To Store *</label>
                  <button
                    type="button"
                    disabled={!toSite}
                    onClick={() => { setQcType("store"); setIsQcOpen(true); }}
                    className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  disabled={!toSite}
                  value={toStore}
                  onChange={(e) => setToStore(e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">-- Select Store --</option>
                  {trfToStores.map((s) => (
                    <option key={s.id} value={s.id}>{s.storeName} ({s.storeCode})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Logistics and Personnel */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transfer Date *</label>
              <input
                type="date"
                required
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status *</label>
              <select
                value={transferStatus}
                onChange={(e) => setTransferStatus(e.target.value as TransferStatus)}
                className="form-input text-xs font-semibold text-sky-400"
              >
                <option value="received">Confirmed / Received (Affects Stock)</option>
                <option value="in_transit">In Transit (Dispatched)</option>
                <option value="draft">Draft (No Stock Impact)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Issued By</label>
              <input
                type="text"
                placeholder="e.g. Ramesh (Storekeeper)"
                value={transferIssuedBy}
                onChange={(e) => setTransferIssuedBy(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Received By</label>
              <input
                type="text"
                placeholder="e.g. Sunil (Site In-charge)"
                value={transferReceivedBy}
                onChange={(e) => setTransferReceivedBy(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Items to Transfer</h4>
              <button
                type="button"
                onClick={() => setTransferItems([...transferItems, { itemId: "", quantity: 1, uom: "Nos", remarks: "" }])}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <Icon name="add" className="text-[16px]" /> Add Item Row
              </button>
            </div>

            {transferItems.map((row, idx) => {
              const avail = fromStore && row.itemId ? getStockFor(fromStore, row.itemId) : 0;
              const isOverStock = fromStore && row.itemId && Number(row.quantity) > avail;

              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50/40 p-2.5 rounded-xl border border-gray-200">
                  <div className="col-span-5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-gray-500 font-semibold">Item *</span>
                      <button
                        type="button"
                        onClick={() => { setQcType("item"); setIsQcOpen(true); }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        + New Item
                      </button>
                    </div>
                    <select
                      required
                      value={row.itemId}
                      onChange={(e) => {
                        const sel = items.find((it) => it.id === e.target.value);
                        const copy = [...transferItems];
                        copy[idx].itemId = e.target.value;
                        if (sel) copy[idx].uom = sel.uom;
                        setTransferItems(copy);
                      }}
                      className="form-input text-xs text-xs py-1.5"
                    >
                      <option value="">-- Choose Item --</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.itemName} ({it.itemCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-gray-500 font-semibold">Qty *</span>
                      {fromStore && row.itemId && (
                        <span className={`text-[10px] font-mono font-bold ${isOverStock ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                          Avail: {avail}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      required
                      value={row.quantity}
                      onChange={(e) => {
                        const copy = [...transferItems];
                        copy[idx].quantity = Number(e.target.value);
                        setTransferItems(copy);
                      }}
                      className={`form-input text-xs text-xs py-1.5 font-mono ${isOverStock ? "border-rose-500 text-rose-400 bg-rose-500/10" : ""}`}
                    />
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">UOM</span>
                    <input
                      type="text"
                      readOnly
                      value={row.uom}
                      className="form-input text-xs text-xs py-1.5 bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div className="col-span-2 pt-4 text-center">
                    {transferItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Reason for Transfer</label>
              <input
                type="text"
                placeholder="e.g. Urgent site breakdown demand, project reallocation"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Remarks / Dispatch Notes</label>
              <input
                type="text"
                placeholder="e.g. Vehicle no, driver name, delivery challan"
                value={transferRemarks}
                onChange={(e) => setTransferRemarks(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTransfer}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md flex items-center gap-2"
            >
              {savingTransfer ? "Processing..." : "Save Transfer & Update Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MATERIAL RETURN (Store & Vendor) */}
      <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Material Return Voucher">
        <form onSubmit={handleSaveReturn} className="space-y-4 pt-2">
          {/* Return Type Selector */}
          <div className="p-3 rounded-xl bg-gray-50/60 border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 block mb-2">Return Flow Type *</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReturnType("store_return")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  returnType === "store_return"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-md"
                    : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon name="assignment_return" className="text-[18px]" />
                Store Return (Site / Machinery → Store)
              </button>

              <button
                type="button"
                onClick={() => setReturnType("vendor_return")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  returnType === "vendor_return"
                    ? "bg-amber-600/20 border-amber-500 text-amber-300 shadow-md"
                    : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon name="local_shipping" className="text-[18px]" />
                Vendor Return (Store → Vendor)
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              {returnType === "store_return"
                ? "Increases store stock (+). Used for unused site materials, salvaged parts, or machine repair leftovers."
                : "Decreases store stock (−). Used for rejected materials, defective supplies, or warranty returns to vendor."}
            </p>
          </div>

          {/* Location Cascading */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Project *</label>
                <button
                  type="button"
                  onClick={() => { setQcType("project"); setIsQcOpen(true); }}
                  className="text-[11px] text-primary hover:underline font-bold"
                >
                  + New
                </button>
              </div>
              <select
                required
                value={retProject}
                onChange={(e) => {
                  setRetProject(e.target.value);
                  setRetSite("");
                  setRetStore("");
                }}
                className="form-input text-xs"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Site *</label>
                <button
                  type="button"
                  disabled={!retProject}
                  onClick={() => { setQcType("site"); setIsQcOpen(true); }}
                  className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                >
                  + New
                </button>
              </div>
              <select
                required
                disabled={!retProject}
                value={retSite}
                onChange={(e) => {
                  setRetSite(e.target.value);
                  setRetStore("");
                }}
                className="form-input text-xs"
              >
                <option value="">-- Select Site --</option>
                {retSites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Store *</label>
                <button
                  type="button"
                  disabled={!retSite}
                  onClick={() => { setQcType("store"); setIsQcOpen(true); }}
                  className="text-[11px] text-primary hover:underline font-bold disabled:text-slate-600"
                >
                  + New
                </button>
              </div>
              <select
                required
                disabled={!retSite}
                value={retStore}
                onChange={(e) => setRetStore(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">-- Select Store --</option>
                {retStores.map((s) => (
                  <option key={s.id} value={s.id}>{s.storeName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Vendor or Machinery Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {returnType === "vendor_return" ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-amber-300">Vendor *</label>
                  <button
                    type="button"
                    onClick={() => { setQcType("vendor"); setIsQcOpen(true); }}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  value={retVendor}
                  onChange={(e) => setRetVendor(e.target.value)}
                  className="form-input text-xs border-amber-500/50"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.vendorCode})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Machinery (Optional)</label>
                <select
                  value={retMachinery}
                  onChange={(e) => setRetMachinery(e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">-- General Site Return --</option>
                  {retMachines.map((m) => (
                    <option key={m.id} value={m.id}>{m.assetCode} - {m.make} {m.model}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Return Date *</label>
              <input
                type="date"
                required
                value={retDate}
                onChange={(e) => setRetDate(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Original Issue / GRN Ref</label>
              <input
                type="text"
                placeholder="e.g. ISS-20260920-001 or GRN-0092"
                value={retOriginalRef}
                onChange={(e) => setRetOriginalRef(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Return *</label>
              <select
                value={retReason}
                onChange={(e) => setRetReason(e.target.value)}
                className="form-input text-xs"
              >
                <option value="Excess Unused Material">Excess Unused Material</option>
                <option value="Defective / Damaged Supply">Defective / Damaged Supply</option>
                <option value="Wrong Specification">Wrong Specification</option>
                <option value="Machine Salvage / Overhaul">Machine Salvage / Overhaul</option>
                <option value="Project Demobilization">Project Demobilization</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Returned By</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar (Operator / Mech)"
                value={retReturnedBy}
                onChange={(e) => setRetReturnedBy(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Approved By</label>
              <input
                type="text"
                placeholder="e.g. Plant Head / Store Incharge"
                value={retApprovedBy}
                onChange={(e) => setRetApprovedBy(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Return Items</h4>
              <button
                type="button"
                onClick={() => setReturnItems([...returnItems, { itemId: "", quantity: 1, uom: "Nos", remarks: "" }])}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Icon name="add" className="text-[16px]" /> Add Item Row
              </button>
            </div>

            {returnItems.map((row, idx) => {
              const avail = retStore && row.itemId ? getStockFor(retStore, row.itemId) : 0;
              const isOverStock = returnType === "vendor_return" && retStore && row.itemId && Number(row.quantity) > avail;

              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50/40 p-2.5 rounded-xl border border-gray-200">
                  <div className="col-span-5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-gray-500 font-semibold">Item *</span>
                      <button
                        type="button"
                        onClick={() => { setQcType("item"); setIsQcOpen(true); }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        + New Item
                      </button>
                    </div>
                    <select
                      required
                      value={row.itemId}
                      onChange={(e) => {
                        const sel = items.find((it) => it.id === e.target.value);
                        const copy = [...returnItems];
                        copy[idx].itemId = e.target.value;
                        if (sel) copy[idx].uom = sel.uom;
                        setReturnItems(copy);
                      }}
                      className="form-input text-xs text-xs py-1.5"
                    >
                      <option value="">-- Choose Item --</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.itemName} ({it.itemCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-gray-500 font-semibold">Qty *</span>
                      {returnType === "vendor_return" && retStore && row.itemId && (
                        <span className={`text-[10px] font-mono font-bold ${isOverStock ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
                          Store: {avail}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      required
                      value={row.quantity}
                      onChange={(e) => {
                        const copy = [...returnItems];
                        copy[idx].quantity = Number(e.target.value);
                        setReturnItems(copy);
                      }}
                      className={`form-input text-xs text-xs py-1.5 font-mono ${isOverStock ? "border-rose-500 text-rose-400 bg-rose-500/10" : ""}`}
                    />
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1">UOM</span>
                    <input
                      type="text"
                      readOnly
                      value={row.uom}
                      className="form-input text-xs text-xs py-1.5 bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div className="col-span-2 pt-4 text-center">
                    {returnItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setReturnItems(returnItems.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Internal Remarks</label>
            <textarea
              rows={2}
              placeholder="Condition of returned material, inspection findings..."
              value={retRemarks}
              onChange={(e) => setRetRemarks(e.target.value)}
              className="form-input text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingReturn}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md flex items-center gap-2"
            >
              {savingReturn ? "Processing..." : "Save Return & Update Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* UNIVERSAL QUICK CREATE MODAL */}
      <QuickCreateModal
        isOpen={isQcOpen}
        onClose={() => setIsQcOpen(false)}
        entityType={qcType}
        defaultProjectId={grnProject || outProject || fromProject || retProject || strProject}
        defaultSiteId={grnSite || outSite || fromSite || retSite || strSite}
        onCreated={(rec) => {
          loadData();
          if (qcType === "project") {
            if (isInwardModalOpen) setGrnProject(rec.id);
            if (isOutwardModalOpen) setOutProject(rec.id);
            if (isTransferModalOpen) {
              if (!fromProject) setFromProject(rec.id);
              else setToProject(rec.id);
            }
            if (isReturnModalOpen) setRetProject(rec.id);
          } else if (qcType === "site") {
            if (isInwardModalOpen) setGrnSite(rec.id);
            if (isOutwardModalOpen) setOutSite(rec.id);
            if (isTransferModalOpen) {
              if (!fromSite) setFromSite(rec.id);
              else setToSite(rec.id);
            }
            if (isReturnModalOpen) setRetSite(rec.id);
          } else if (qcType === "vendor") {
            if (isInwardModalOpen) setGrnVendor(rec.id);
            if (isReturnModalOpen) setRetVendor(rec.id);
          } else if (qcType === "store") {
            if (isInwardModalOpen) setGrnStore(rec.id);
            if (isOutwardModalOpen) setOutStore(rec.id);
            if (isTransferModalOpen) {
              if (!fromStore) setFromStore(rec.id);
              else setToStore(rec.id);
            }
            if (isReturnModalOpen) setRetStore(rec.id);
          }
        }}
      />
    </PageTransition>
  );
}
