"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { QuickCreateModal, QuickCreateType } from "@/components/ui/QuickCreateModal";
import {
  createMachinery,
  updateMachinery,
  getProjects,
  getSites,
  getVendors,
  getNextAssetCode,
  createEngine,
  updateEngine,
  getEngines,
} from "@/lib/data/repository";
import type {
  Machinery,
  Project,
  Site,
  Vendor,
  MeterType,
  MeterConfiguration,
  Ownership,
  RegistrationStatus,
  MachineryCategory,
  Engine,
} from "@/lib/types";
import { UNIVERSAL_CONSTRUCTION_TYPES } from "@/lib/types";

interface MachineryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  machineryToEdit?: Machinery | null;
}

const CATEGORIES = Object.keys(UNIVERSAL_CONSTRUCTION_TYPES) as MachineryCategory[];

export function MachineryModal({
  isOpen,
  onClose,
  onSuccess,
  machineryToEdit,
}: MachineryModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Form state
  const [assetCode, setAssetCode] = useState("");
  const [ownership, setOwnership] = useState<Ownership>("own");
  const [vendorId, setVendorId] = useState<string>("");
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>("registered");
  const [registrationNo, setRegistrationNo] = useState("");
  const [machineryName, setMachineryName] = useState("");
  const [category, setCategory] = useState<MachineryCategory>("Earthmoving");
  const [machineryType, setMachineryType] = useState<string>("Excavator");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState<string>("");
  const [capacity, setCapacity] = useState("");
  const [fuelType, setFuelType] = useState<string>("Diesel");
  const [meterConfiguration, setMeterConfiguration] = useState<MeterConfiguration>("single_hour");
  const [meterType, setMeterType] = useState<MeterType>("HOUR");
  const [engineConfig, setEngineConfig] = useState<"single" | "multi">("single");
  const [fuelTankCapacity, setFuelTankCapacity] = useState<string>("300");
  const [standardFuelEfficiency, setStandardFuelEfficiency] = useState<string>("18.0");
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [currentSiteId, setCurrentSiteId] = useState<string>("");
  const [openingReading, setOpeningReading] = useState<string>("0");
  const [currentReading, setCurrentReading] = useState<string>("0");
  const [purchaseDate, setPurchaseDate] = useState<string>("");

  // Multi-Engine 2-Entry state (Engine 1 & Engine 2 independent configuration)
  const [engine1Name, setEngine1Name] = useState("Engine 1 — Propulsion");
  const [engine1MeterType, setEngine1MeterType] = useState<MeterType>("KM");
  const [engine1Opening, setEngine1Opening] = useState("0");
  const [engine1Standard, setEngine1Standard] = useState("3.5");

  const [engine2Name, setEngine2Name] = useState("Engine 2 — Auxiliary");
  const [engine2MeterType, setEngine2MeterType] = useState<MeterType>("HOUR");
  const [engine2Opening, setEngine2Opening] = useState("0");
  const [engine2Standard, setEngine2Standard] = useState("4.0");

  const [existingEngines, setExistingEngines] = useState<Engine[]>([]);

  // Statutory Compliance Document Numbers & Expiry
  const [insuranceDocNo, setInsuranceDocNo] = useState<string>("");
  const [insuranceExpiry, setInsuranceExpiry] = useState<string>("");
  const [pucDocNo, setPucDocNo] = useState<string>("");
  const [pucExpiry, setPucExpiry] = useState<string>("");
  const [fitnessDocNo, setFitnessDocNo] = useState<string>("");
  const [fitnessExpiry, setFitnessExpiry] = useState<string>("");
  const [roadTaxDocNo, setRoadTaxDocNo] = useState<string>("");
  const [roadTaxExpiry, setRoadTaxExpiry] = useState<string>("");
  const [permitDocNo, setPermitDocNo] = useState<string>("");
  const [permitExpiry, setPermitExpiry] = useState<string>("");

  const [status, setStatus] = useState<Machinery["status"]>("active");
  const [remarks, setRemarks] = useState("");

  // Quick Create Modal state
  const [qcType, setQcType] = useState<QuickCreateType>("project");
  const [isQcOpen, setIsQcOpen] = useState(false);

  // Available types for selected category
  const availableTypes = UNIVERSAL_CONSTRUCTION_TYPES[category] || [
    "Tipper",
    "Excavator",
    "Roller",
    "Transit Mixer",
    "Crane",
    "Other",
  ];

  // Load projects, sites & vendors
  async function loadMasters() {
    try {
      const [prjs, vnds] = await Promise.all([getProjects(), getVendors()]);
      setProjects(prjs);
      setVendors(vnds);
    } catch (e) {
      console.error(e);
    }
  }

  // Load sites filtered by selected project
  async function loadFilteredSites() {
    if (!currentProjectId) {
      setSites([]);
      setCurrentSiteId("");
      return;
    }
    try {
      const s = await getSites(currentProjectId);
      setSites(s);
      if (s.length > 0 && !s.some((st) => st.id === currentSiteId)) {
        setCurrentSiteId(s[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (isOpen) loadMasters();
  }, [isOpen]);

  useEffect(() => {
    loadFilteredSites();
  }, [currentProjectId]);

  // Sync meter type & engine config with meter configuration
  function handleMeterConfigurationChange(config: MeterConfiguration) {
    setMeterConfiguration(config);
    if (config === "single_km") {
      setMeterType("KM");
      setEngineConfig("single");
      if (!standardFuelEfficiency || standardFuelEfficiency === "18.0") {
        setStandardFuelEfficiency("3.0");
      }
    } else if (config === "single_hour") {
      setMeterType("HOUR");
      setEngineConfig("single");
      if (!standardFuelEfficiency || standardFuelEfficiency === "3.0") {
        setStandardFuelEfficiency("18.0");
      }
    } else if (config === "dual") {
      setMeterType("KM");
      setEngineConfig("single");
    } else if (config === "multi_engine") {
      setMeterType("HOUR");
      setEngineConfig("multi");
    }
  }

  // When category changes, default to first available type
  function handleCategoryChange(newCat: MachineryCategory) {
    setCategory(newCat);
    const types = UNIVERSAL_CONSTRUCTION_TYPES[newCat];
    if (types && types.length > 0) {
      setMachineryType(types[0]);
    }
  }

  // Init form on open
  useEffect(() => {
    if (!isOpen) return;

    if (machineryToEdit) {
      setAssetCode(machineryToEdit.assetCode);
      setOwnership(machineryToEdit.ownership || "own");
      setVendorId(machineryToEdit.vendorId || "");
      const isReg = machineryToEdit.registrationStatus
        ? machineryToEdit.registrationStatus
        : machineryToEdit.registrationNo
        ? "registered"
        : "unregistered";
      setRegistrationStatus(isReg);
      setRegistrationNo(machineryToEdit.registrationNo || "");
      setMachineryName(machineryToEdit.machineryName);

      const cat = (CATEGORIES.includes(machineryToEdit.category as any)
        ? machineryToEdit.category
        : "Earthmoving") as MachineryCategory;
      setCategory(cat);
      setMachineryType(machineryToEdit.machineryType);
      setMake(machineryToEdit.make);
      setModel(machineryToEdit.model);
      setYearOfManufacture(
        machineryToEdit.yearOfManufacture ? machineryToEdit.yearOfManufacture.toString() : ""
      );
      setCapacity(machineryToEdit.capacity || "");
      setFuelType(machineryToEdit.fuelType);

      const mConfig =
        machineryToEdit.meterConfiguration ||
        (machineryToEdit.engineConfig === "multi"
          ? "multi_engine"
          : machineryToEdit.meterType === "KM"
          ? "single_km"
          : "single_hour");
      setMeterConfiguration(mConfig);
      setMeterType(machineryToEdit.meterType || (mConfig === "single_km" ? "KM" : "HOUR"));
      setEngineConfig(machineryToEdit.engineConfig || (mConfig === "multi_engine" ? "multi" : "single"));
      setFuelTankCapacity(
        machineryToEdit.fuelTankCapacity ? machineryToEdit.fuelTankCapacity.toString() : "300"
      );
      setStandardFuelEfficiency(
        machineryToEdit.standardFuelEfficiency != null
          ? machineryToEdit.standardFuelEfficiency.toString()
          : machineryToEdit.meterType === "HOUR"
          ? "18.0"
          : "3.0"
      );
      setCurrentProjectId(machineryToEdit.currentProjectId || machineryToEdit.projectId || "");
      setCurrentSiteId(machineryToEdit.currentSiteId || machineryToEdit.siteId || "");
      setOpeningReading(machineryToEdit.openingReading?.toString() || "0");
      setCurrentReading(machineryToEdit.currentReading?.toString() || "0");
      setPurchaseDate(machineryToEdit.purchaseDate || "");

      // Compliance
      setInsuranceDocNo(machineryToEdit.insuranceDocNo || "");
      setInsuranceExpiry(machineryToEdit.insuranceExpiry || "");
      setPucDocNo(machineryToEdit.pucDocNo || "");
      setPucExpiry(machineryToEdit.pucExpiry || "");
      setFitnessDocNo(machineryToEdit.fitnessDocNo || "");
      setFitnessExpiry(machineryToEdit.fitnessExpiry || "");
      setRoadTaxDocNo(machineryToEdit.roadTaxDocNo || "");
      setRoadTaxExpiry(machineryToEdit.roadTaxExpiry || "");
      setPermitDocNo(machineryToEdit.permitDocNo || "");
      setPermitExpiry(machineryToEdit.permitExpiry || "");

      setStatus(machineryToEdit.status);
      setRemarks(machineryToEdit.remarks || "");

      // Load existing multi-engine data if applicable
      if (machineryToEdit.engineConfig === "multi" || mConfig === "multi_engine") {
        getEngines(machineryToEdit.id).then((engs) => {
          setExistingEngines(engs);
          if (engs.length > 0) {
            setEngine1Name(engs[0].engineName || "Engine 1 — Propulsion");
            setEngine1MeterType(engs[0].meterType || "KM");
            setEngine1Opening(engs[0].openingReading != null ? engs[0].openingReading.toString() : "0");
            setEngine1Standard(engs[0].standardFuelEfficiency != null ? engs[0].standardFuelEfficiency.toString() : "3.5");
          }
          if (engs.length > 1) {
            setEngine2Name(engs[1].engineName || "Engine 2 — Auxiliary");
            setEngine2MeterType(engs[1].meterType || "HOUR");
            setEngine2Opening(engs[1].openingReading != null ? engs[1].openingReading.toString() : "0");
            setEngine2Standard(engs[1].standardFuelEfficiency != null ? engs[1].standardFuelEfficiency.toString() : "4.0");
          }
        });
      } else {
        setExistingEngines([]);
      }
    } else {
      // Create new defaults
      getNextAssetCode().then((code) => setAssetCode(code));
      setOwnership("own");
      setVendorId("");
      setRegistrationStatus("registered");
      setRegistrationNo("");
      setMachineryName("");
      setCategory("Earthmoving");
      setMachineryType("Excavator");
      setMake("");
      setModel("");
      setYearOfManufacture(new Date().getFullYear().toString());
      setCapacity("");
      setFuelType("Diesel");
      setMeterConfiguration("single_hour");
      setMeterType("HOUR");
      setEngineConfig("single");
      setFuelTankCapacity("300");
      setStandardFuelEfficiency("18.0");
      setCurrentProjectId("");
      setCurrentSiteId("");
      setOpeningReading("0");
      setCurrentReading("0");
      setPurchaseDate(new Date().toISOString().slice(0, 10));

      setExistingEngines([]);
      setEngine1Name("Engine 1 — Propulsion");
      setEngine1MeterType("KM");
      setEngine1Opening("0");
      setEngine1Standard("3.5");
      setEngine2Name("Engine 2 — Auxiliary");
      setEngine2MeterType("HOUR");
      setEngine2Opening("0");
      setEngine2Standard("4.0");

      setInsuranceDocNo("");
      setInsuranceExpiry("");
      setPucDocNo("");
      setPucExpiry("");
      setFitnessDocNo("");
      setFitnessExpiry("");
      setRoadTaxDocNo("");
      setRoadTaxExpiry("");
      setPermitDocNo("");
      setPermitExpiry("");

      setStatus("active");
      setRemarks("");
    }
  }, [isOpen, machineryToEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetCode.trim()) {
      showToast("Validation Error", "Asset Code is required.", "error");
      return;
    }
    if (!machineryName.trim()) {
      showToast("Validation Error", "Machinery Name is required.", "error");
      return;
    }
    if (registrationStatus === "registered" && !registrationNo.trim()) {
      showToast(
        "Validation Error",
        "Registration Number (Plate) is required for registered machinery.",
        "error"
      );
      return;
    }
    if (ownership === "rental" && !vendorId) {
      showToast(
        "Validation Error",
        "Please select a Vendor/Supplier for rental machinery.",
        "error"
      );
      return;
    }
    if (!make.trim() || !model.trim()) {
      showToast("Validation Error", "Make and Model are required.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        assetCode: assetCode.trim().toUpperCase(),
        ownership,
        vendorId: ownership === "rental" ? vendorId || null : null,
        registrationStatus,
        registrationNo:
          registrationStatus === "registered" && registrationNo.trim()
            ? registrationNo.trim().toUpperCase()
            : null,
        machineryName: machineryName.trim(),
        machineryType,
        category,
        make: make.trim(),
        model: model.trim(),
        yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture, 10) : null,
        capacity: capacity.trim() || null,
        fuelType,
        meterConfiguration,
        meterType,
        engineConfig,
        fuelTankCapacity: fuelTankCapacity ? parseFloat(fuelTankCapacity) : null,
        standardFuelEfficiency: standardFuelEfficiency ? parseFloat(standardFuelEfficiency) : null,
        currentProjectId: currentProjectId || null,
        currentSiteId: currentSiteId || null,
        department: "Plant & Machinery",
        openingReading: parseFloat(openingReading) || 0,
        currentReading: parseFloat(currentReading) || parseFloat(openingReading) || 0,
        purchaseDate: purchaseDate || null,

        insuranceDocNo: insuranceDocNo.trim() || null,
        insuranceExpiry: insuranceExpiry || null,
        pucDocNo: pucDocNo.trim() || null,
        pucExpiry: pucExpiry || null,
        fitnessDocNo: fitnessDocNo.trim() || null,
        fitnessExpiry: fitnessExpiry || null,
        roadTaxDocNo: roadTaxDocNo.trim() || null,
        roadTaxExpiry: roadTaxExpiry || null,
        permitDocNo: permitDocNo.trim() || null,
        permitExpiry: permitExpiry || null,

        status,
        remarks: remarks.trim() || null,
      };

      let targetMachineId = machineryToEdit?.id;
      if (machineryToEdit) {
        await updateMachinery(machineryToEdit.id, payload);
        showToast("Success", `Machinery '${payload.assetCode}' updated successfully.`);
      } else {
        const created = await createMachinery(payload);
        targetMachineId = created.id;
        showToast("Success", `New Machinery '${payload.assetCode}' registered.`);
      }

      // If multi-engine, create or update the 2 engines in engines table
      if (meterConfiguration === "multi_engine" && targetMachineId) {
        try {
          if (existingEngines.length >= 2) {
            await updateEngine(existingEngines[0].id, {
              engineName: engine1Name.trim() || "Engine 1 — Propulsion",
              meterType: engine1MeterType,
              openingReading: parseFloat(engine1Opening) || 0,
              standardFuelEfficiency: engine1Standard ? parseFloat(engine1Standard) : null,
            });
            await updateEngine(existingEngines[1].id, {
              engineName: engine2Name.trim() || "Engine 2 — Auxiliary",
              meterType: engine2MeterType,
              openingReading: parseFloat(engine2Opening) || 0,
              standardFuelEfficiency: engine2Standard ? parseFloat(engine2Standard) : null,
            });
          } else if (existingEngines.length === 1) {
            await updateEngine(existingEngines[0].id, {
              engineName: engine1Name.trim() || "Engine 1 — Propulsion",
              meterType: engine1MeterType,
              openingReading: parseFloat(engine1Opening) || 0,
              standardFuelEfficiency: engine1Standard ? parseFloat(engine1Standard) : null,
            });
            await createEngine({
              machineryId: targetMachineId,
              engineName: engine2Name.trim() || "Engine 2 — Auxiliary",
              meterType: engine2MeterType,
              openingReading: parseFloat(engine2Opening) || 0,
              currentReading: parseFloat(engine2Opening) || 0,
              standardFuelEfficiency: engine2Standard ? parseFloat(engine2Standard) : null,
              status: "active",
            });
          } else {
            await createEngine({
              machineryId: targetMachineId,
              engineName: engine1Name.trim() || "Engine 1 — Propulsion",
              meterType: engine1MeterType,
              openingReading: parseFloat(engine1Opening) || 0,
              currentReading: parseFloat(engine1Opening) || 0,
              standardFuelEfficiency: engine1Standard ? parseFloat(engine1Standard) : null,
              status: "active",
            });
            await createEngine({
              machineryId: targetMachineId,
              engineName: engine2Name.trim() || "Engine 2 — Auxiliary",
              meterType: engine2MeterType,
              openingReading: parseFloat(engine2Opening) || 0,
              currentReading: parseFloat(engine2Opening) || 0,
              standardFuelEfficiency: engine2Standard ? parseFloat(engine2Standard) : null,
              status: "active",
            });
          }
        } catch (engErr) {
          console.error("Failed to save multi-engine records:", engErr);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast("Operation Failed", err.message || "Could not save machinery record.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={machineryToEdit ? `Edit Machinery: ${machineryToEdit.assetCode}` : "Register New Machinery"}
      subtitle="Universal construction machinery master with ownership, meter types, standards, and statutory compliance."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Ownership & Identification */}
        <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              1. Ownership & Identity
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="ownership"
                  value="own"
                  checked={ownership === "own"}
                  onChange={() => {
                    setOwnership("own");
                    setVendorId("");
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Company Owned
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="ownership"
                  value="rental"
                  checked={ownership === "rental"}
                  onChange={() => setOwnership("rental")}
                  className="text-amber-600 focus:ring-amber-500"
                />
                Rental / Hired
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">
                Asset Code *
              </label>
              <input
                type="text"
                required
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="e.g. MCH-00001"
                className="form-input font-mono font-semibold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-medium text-gray-700">
                  Registration Status
                </label>
              </div>
              <select
                value={registrationStatus}
                onChange={(e) => {
                  const val = e.target.value as RegistrationStatus;
                  setRegistrationStatus(val);
                  if (val === "unregistered") setRegistrationNo("");
                }}
                className="form-select font-medium"
              >
                <option value="registered">Registered (RTO Number Plate)</option>
                <option value="unregistered">Unregistered (No RTO Plate)</option>
              </select>
            </div>

            {registrationStatus === "registered" ? (
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Registration No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registrationNo}
                  onChange={(e) => setRegistrationNo(e.target.value)}
                  placeholder="e.g. MH04AB1234"
                  className="form-input font-mono font-semibold"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Name of Machinery <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={machineryName}
                  onChange={(e) => setMachineryName(e.target.value)}
                  placeholder="e.g. Stationary Batching Plant"
                  className="form-input font-semibold text-blue-900"
                />
              </div>
            )}
          </div>

          {/* If rental, show vendor selector with Quick Create */}
          {ownership === "rental" && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-semibold text-amber-800">
                  Rental Vendor / Supplier *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setQcType("vendor");
                    setIsQcOpen(true);
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                >
                  <Icon name="add" className="text-xs" /> New Vendor
                </button>
              </div>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="form-select border-amber-300 focus:border-amber-500"
              >
                <option value="">-- Select Rental Vendor / Owner --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorCode || (v as any).code || "VND"} — {v.name} {v.city ? `(${v.city})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Section 2: Machinery Classification */}
        <div className={`grid grid-cols-1 ${registrationStatus === "registered" ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3.5`}>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as MachineryCategory)}
              className="form-select font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">
              Machinery Type *
            </label>
            <select
              value={machineryType}
              onChange={(e) => setMachineryType(e.target.value)}
              className="form-select"
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              {!availableTypes.includes(machineryType) && (
                <option value={machineryType}>{machineryType}</option>
              )}
            </select>
          </div>

          {registrationStatus === "registered" && (
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">
                Machinery Name *
              </label>
              <input
                type="text"
                required
                value={machineryName}
                onChange={(e) => setMachineryName(e.target.value)}
                placeholder="e.g. Kobelco SK210 Excavator"
                className="form-input"
              />
            </div>
          )}
        </div>

        {/* Section 3: Make, Model, Year, Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">
              Make / Manufacturer *
            </label>
            <input
              type="text"
              required
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Kobelco / Tata / CAT"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. SK210 Gen 10"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">
              Year of Mfg
            </label>
            <input
              type="number"
              min="1990"
              max="2050"
              value={yearOfManufacture}
              onChange={(e) => setYearOfManufacture(e.target.value)}
              placeholder="2022"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">
              Capacity / Rating
            </label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 0.92 CuM / 21 Ton"
              className="form-input"
            />
          </div>
        </div>

        {/* Section 4: Meter Configuration & Fuel Standards */}
        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              2. Metering & Fuel Efficiency Standards
            </span>
            {meterConfiguration !== "multi_engine" && (
              <span className="text-[11px] text-blue-700 font-medium">
                Evaluates: {meterType === "KM" ? "KM/L" : "L/Hour"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className={meterConfiguration === "multi_engine" ? "sm:col-span-3" : "sm:col-span-2"}>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Meter Configuration *
              </label>
              <select
                value={meterConfiguration}
                onChange={(e) => handleMeterConfigurationChange(e.target.value as MeterConfiguration)}
                className="form-select font-semibold text-xs"
              >
                <option value="single_km">Single KM (KM/L)</option>
                <option value="single_hour">Single Hour (L/Hour)</option>
                <option value="dual">Dual Meter (KM + Hour)</option>
                <option value="multi_engine">Multi-Engine (Primary + Auxiliary / 2 Engines)</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                {meterConfiguration === "single_km" && "Standard on-road tippers/trucks"}
                {meterConfiguration === "single_hour" && "Standard excavators/loaders/compactors"}
                {meterConfiguration === "dual" && "Transit mixers & mobile cranes"}
                {meterConfiguration === "multi_engine" && "Independent multi-engine configuration (e.g. Propulsion + Deck / Pump)"}
              </p>
            </div>

            <div className={meterConfiguration === "multi_engine" ? "sm:col-span-2" : ""}>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Fuel Tank (L)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={fuelTankCapacity}
                onChange={(e) => setFuelTankCapacity(e.target.value)}
                placeholder="300"
                className="form-input font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">Tank capacity</p>
            </div>

            {meterConfiguration !== "multi_engine" && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 mb-1">
                    Std Efficiency ({meterType === "KM" ? "KM/L" : "L/Hr"}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={standardFuelEfficiency}
                    onChange={(e) => setStandardFuelEfficiency(e.target.value)}
                    placeholder={meterType === "KM" ? "3.00" : "18.00"}
                    className="form-input font-mono font-semibold border-amber-300 focus:border-amber-500 text-amber-900 bg-amber-50/30"
                  />
                  <p className="text-[10px] text-amber-700 mt-1 font-medium">
                    {meterType === "KM" ? "Benchmark KM/L" : "Benchmark L/Hour"}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Opening ({meterType})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingReading}
                    onChange={(e) => setOpeningReading(e.target.value)}
                    className="form-input font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Initial base meter</p>
                </div>
              </>
            )}
          </div>

          {/* Multi-Engine Cards for Engine 1 and Engine 2 */}
          {meterConfiguration === "multi_engine" && (
            <div className="pt-2 border-t border-blue-200/70 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                <Icon name="settings" className="text-sm text-blue-600" />
                Configured Multi-Engines (Engine 1 & Engine 2 independent meters & standards)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Engine 1 Card */}
                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-900">Engine 1 (Primary / Propulsion)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {engine1MeterType} Meter
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Engine Name *</label>
                      <input
                        type="text"
                        required
                        value={engine1Name}
                        onChange={(e) => setEngine1Name(e.target.value)}
                        placeholder="e.g. Engine 1 — Propulsion"
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Meter Type *</label>
                      <select
                        value={engine1MeterType}
                        onChange={(e) => setEngine1MeterType(e.target.value as "KM" | "HOUR")}
                        className="form-select text-xs font-semibold"
                      >
                        <option value="KM">KM (Distance)</option>
                        <option value="HOUR">HOUR (Engine Hours)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Opening ({engine1MeterType})</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={engine1Opening}
                        onChange={(e) => setEngine1Opening(e.target.value)}
                        className="form-input text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-amber-800 mb-0.5">
                        Standard Efficiency ({engine1MeterType === "KM" ? "KM/L" : "L/Hour"}) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={engine1Standard}
                        onChange={(e) => setEngine1Standard(e.target.value)}
                        placeholder={engine1MeterType === "KM" ? "3.5" : "16.0"}
                        className="form-input text-xs font-mono font-bold text-amber-900 bg-amber-50/50 border-amber-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Engine 2 Card */}
                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-900">Engine 2 (Auxiliary / Deck / Pump)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {engine2MeterType} Meter
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Engine Name *</label>
                      <input
                        type="text"
                        required
                        value={engine2Name}
                        onChange={(e) => setEngine2Name(e.target.value)}
                        placeholder="e.g. Engine 2 — Deck / Auxiliary"
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Meter Type *</label>
                      <select
                        value={engine2MeterType}
                        onChange={(e) => setEngine2MeterType(e.target.value as "KM" | "HOUR")}
                        className="form-select text-xs font-semibold"
                      >
                        <option value="HOUR">HOUR (Engine Hours)</option>
                        <option value="KM">KM (Distance)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Opening ({engine2MeterType})</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={engine2Opening}
                        onChange={(e) => setEngine2Opening(e.target.value)}
                        className="form-input text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-amber-800 mb-0.5">
                        Standard Efficiency ({engine2MeterType === "KM" ? "KM/L" : "L/Hour"}) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={engine2Standard}
                        onChange={(e) => setEngine2Standard(e.target.value)}
                        placeholder={engine2MeterType === "KM" ? "3.5" : "4.0"}
                        className="form-input text-xs font-mono font-bold text-amber-900 bg-amber-50/50 border-amber-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Project & Site Cascade with Quick Create */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-medium text-gray-700">
                Assigned Project
              </label>
              <button
                type="button"
                onClick={() => {
                  setQcType("project");
                  setIsQcOpen(true);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
              >
                <Icon name="add" className="text-xs" /> New Project
              </button>
            </div>
            <select
              value={currentProjectId}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="form-select"
            >
              <option value="">-- Central Yard / Unassigned --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-medium text-gray-700">
                Assigned Site
              </label>
              {currentProjectId && (
                <button
                  type="button"
                  onClick={() => {
                    setQcType("site");
                    setIsQcOpen(true);
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                >
                  <Icon name="add" className="text-xs" /> New Site
                </button>
              )}
            </div>
            <select
              disabled={!currentProjectId}
              value={currentSiteId}
              onChange={(e) => setCurrentSiteId(e.target.value)}
              className="form-select disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Site --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 6: Statutory Compliance Documents & Expiry */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              3. Statutory Compliance (Document Numbers & Expiry Dates)
            </span>
            <span className="text-[11px] text-gray-400">Alerts trigger within 30 days of expiry</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Insurance</label>
              <input
                type="text"
                value={insuranceDocNo}
                onChange={(e) => setInsuranceDocNo(e.target.value)}
                placeholder="Policy / Doc No."
                className="form-input text-xs mb-1.5"
              />
              <input
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Fitness Cert</label>
              <input
                type="text"
                value={fitnessDocNo}
                onChange={(e) => setFitnessDocNo(e.target.value)}
                placeholder="Fitness Doc No."
                className="form-input text-xs mb-1.5"
              />
              <input
                type="date"
                value={fitnessExpiry}
                onChange={(e) => setFitnessExpiry(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">PUC Certificate</label>
              <input
                type="text"
                value={pucDocNo}
                onChange={(e) => setPucDocNo(e.target.value)}
                placeholder="PUC Certificate No."
                className="form-input text-xs mb-1.5"
              />
              <input
                type="date"
                value={pucExpiry}
                onChange={(e) => setPucExpiry(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Road Tax</label>
              <input
                type="text"
                value={roadTaxDocNo}
                onChange={(e) => setRoadTaxDocNo(e.target.value)}
                placeholder="Road Tax Challan / No."
                className="form-input text-xs mb-1.5"
              />
              <input
                type="date"
                value={roadTaxExpiry}
                onChange={(e) => setRoadTaxExpiry(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">National / State Permit</label>
              <input
                type="text"
                value={permitDocNo}
                onChange={(e) => setPermitDocNo(e.target.value)}
                placeholder="Permit Authorization No."
                className="form-input text-xs mb-1.5"
              />
              <input
                type="date"
                value={permitExpiry}
                onChange={(e) => setPermitExpiry(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">Status & Date</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Machinery["status"])}
                className="form-select text-xs mb-1.5 font-medium"
              >
                <option value="active">Active (Operational)</option>
                <option value="under_repair">Under Repair (Breakdown)</option>
                <option value="inactive">Inactive (Standby)</option>
                <option value="archived">Archived (Decommissioned)</option>
              </select>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                title="Purchase Date / Induction Date"
                className="form-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-[12px] font-medium text-gray-700 mb-1">
            Remarks / Special Notes
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Heavy rock bucket fitted; assigned to quarry stretch"
            className="form-input"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {machineryToEdit ? "Save Changes" : "Register Machinery"}
          </button>
        </div>
      </form>

      <QuickCreateModal
        isOpen={isQcOpen}
        onClose={() => setIsQcOpen(false)}
        entityType={qcType}
        defaultProjectId={currentProjectId}
        onCreated={(created: any) => {
          if (qcType === "project") {
            loadMasters().then(() => {
              setCurrentProjectId(created.id);
            });
          } else if (qcType === "site") {
            loadFilteredSites().then(() => {
              setCurrentSiteId(created.id);
            });
          } else if (qcType === "vendor") {
            loadMasters().then(() => {
              setVendorId(created.id);
            });
          }
        }}
      />
    </Modal>
  );
}
