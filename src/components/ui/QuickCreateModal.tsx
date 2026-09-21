"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import {
  createProject,
  createSite,
  createVendor,
  createStore,
  createItem,
  createEngine,
  createAsset,
} from "@/lib/data/repository";
import type { Project, Site, Vendor, Store, Item, Engine, Asset } from "@/lib/types";

export type QuickCreateType =
  | "project"
  | "site"
  | "vendor"
  | "store"
  | "item"
  | "engine"
  | "asset";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: QuickCreateType;
  defaultProjectId?: string;
  defaultSiteId?: string;
  defaultMachineryId?: string;
  onCreated: (entity: any) => void;
}

export function QuickCreateModal({
  isOpen,
  onClose,
  entityType,
  defaultProjectId,
  defaultSiteId,
  defaultMachineryId,
  onCreated,
}: QuickCreateModalProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Common Form States
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [extra1, setExtra1] = useState("");
  const [extra2, setExtra2] = useState("");
  const [extra3, setExtra3] = useState("");
  const [extraNum, setExtraNum] = useState<number>(0);

  function resetForm() {
    setCode("");
    setName("");
    setExtra1("");
    setExtra2("");
    setExtra3("");
    setExtraNum(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Validation Error", "Name is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      let createdRecord: any = null;

      if (entityType === "project") {
        const prjCode = code.trim() || `PRJ-${Date.now().toString().slice(-4)}`;
        createdRecord = await createProject({
          code: prjCode,
          name: name.trim(),
          clientName: extra1.trim() || undefined,
          location: extra2.trim() || undefined,
          status: "active",
        });
      } else if (entityType === "site") {
        if (!defaultProjectId) {
          throw new Error("Project must be selected before creating a site.");
        }
        const siteCode = code.trim() || `SITE-${Date.now().toString().slice(-4)}`;
        createdRecord = await createSite({
          projectId: defaultProjectId,
          code: siteCode,
          name: name.trim(),
          chainageLocation: extra1.trim() || undefined,
          inChargePerson: extra2.trim() || undefined,
          isActive: true,
        });
      } else if (entityType === "vendor") {
        const vndCode = code.trim() || `VND-${Date.now().toString().slice(-4)}`;
        createdRecord = await createVendor({
          vendorCode: vndCode,
          name: name.trim(),
          vendorType: (extra1 as any) || "Own",
          contactPerson: extra2.trim() || undefined,
          mobile: extra3.trim() || undefined,
          isActive: true,
        });
      } else if (entityType === "store") {
        if (!defaultProjectId || !defaultSiteId) {
          throw new Error("Project and Site must be selected before creating a store.");
        }
        const strCode = code.trim() || `STR-${Date.now().toString().slice(-4)}`;
        createdRecord = await createStore({
          projectId: defaultProjectId,
          siteId: defaultSiteId,
          storeCode: strCode,
          storeName: name.trim(),
          storeType: (extra1 as any) || "mechanical",
          inChargePerson: extra2.trim() || undefined,
          isActive: true,
        });
      } else if (entityType === "item") {
        const itmCode = code.trim() || `ITM-${Date.now().toString().slice(-4)}`;
        createdRecord = await createItem({
          itemCode: itmCode,
          itemName: name.trim(),
          category: extra1.trim() || "Mechanical",
          itemType: (extra2 as any) || "spare_part",
          uom: extra3.trim() || "Nos",
          minimumStock: extraNum || 0,
          reorderLevel: extraNum ? extraNum * 1.5 : 0,
          gstRatePercent: 18,
          serialTracking: false,
          batchTracking: false,
          expiryTracking: false,
          isActive: true,
        });
      } else if (entityType === "engine") {
        if (!defaultMachineryId) {
          throw new Error("Machinery must be selected before creating an engine.");
        }
        const engCode = code.trim() || `ENG-${Date.now().toString().slice(-3)}`;
        createdRecord = await createEngine({
          machineryId: defaultMachineryId,
          engineCode: engCode,
          engineName: name.trim(),
          engineType: (extra1 as any) || "main",
          meterType: (extra2 as any) || "HOUR",
          fuelType: "Diesel",
          openingReading: extraNum || 0,
          currentReading: extraNum || 0,
          status: "active",
        });
      } else if (entityType === "asset") {
        if (!defaultProjectId || !defaultSiteId) {
          throw new Error("Project and Site must be selected before creating an asset.");
        }
        const astCode = code.trim() || `AST-${Date.now().toString().slice(-4)}`;
        createdRecord = await createAsset({
          projectId: defaultProjectId,
          siteId: defaultSiteId,
          assetCode: astCode,
          assetName: name.trim(),
          category: extra1.trim() || "Power Generator",
          make: extra2.trim() || undefined,
          currentCondition: "Good",
          status: "active",
        });
      }

      showToast("Success", `New ${entityType} created and selected automatically.`, "success");
      onCreated(createdRecord);
      resetForm();
      onClose();
    } catch (err: any) {
      showToast("Creation Error", err.message || "Failed to create record.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const titles: Record<QuickCreateType, string> = {
    project: "Quick Add Project",
    site: "Quick Add Site",
    vendor: "Quick Add Vendor",
    store: "Quick Add Store",
    item: "Quick Add Material / Spare Part",
    engine: "Quick Add Engine to Machinery",
    asset: "Quick Add Fixed Asset",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[entityType] || "Quick Create"}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">
              Code (Auto-generated if blank)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AUTO"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1">
              Name / Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${entityType} name`}
              className="form-input"
            />
          </div>
        </div>

        {/* Entity-specific extra fields */}
        {entityType === "project" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Client Name</label>
              <input
                type="text"
                value={extra1}
                onChange={(e) => setExtra1(e.target.value)}
                placeholder="e.g. NHAI / MSRDC"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Location</label>
              <input
                type="text"
                value={extra2}
                onChange={(e) => setExtra2(e.target.value)}
                placeholder="e.g. Nagpur-Mumbai Expressway"
                className="form-input"
              />
            </div>
          </div>
        )}

        {entityType === "site" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Chainage / Stretch</label>
              <input
                type="text"
                value={extra1}
                onChange={(e) => setExtra1(e.target.value)}
                placeholder="e.g. CH 15+000 to 30+000"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">In-Charge Person</label>
              <input
                type="text"
                value={extra2}
                onChange={(e) => setExtra2(e.target.value)}
                placeholder="e.g. Site Engineer Name"
                className="form-input"
              />
            </div>
          </div>
        )}

        {entityType === "vendor" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Vendor Category</label>
              <select
                value={extra1 || "Own"}
                onChange={(e) => setExtra1(e.target.value)}
                className="form-select"
              >
                <option value="Own">Own</option>
                <option value="Rent on Machinery">Rent on Machinery</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Contact Person</label>
              <input
                type="text"
                value={extra2}
                onChange={(e) => setExtra2(e.target.value)}
                placeholder="e.g. Ramesh Patil"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Mobile No</label>
              <input
                type="text"
                value={extra3}
                onChange={(e) => setExtra3(e.target.value)}
                placeholder="e.g. 9876543210"
                className="form-input"
              />
            </div>
          </div>
        )}

        {entityType === "store" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Store Type</label>
              <select
                value={extra1 || "mechanical"}
                onChange={(e) => setExtra1(e.target.value)}
                className="form-select"
              >
                <option value="mechanical">Mechanical Store</option>
                <option value="civil">Civil Materials Store</option>
                <option value="electrical">Electrical &amp; Spares Store</option>
                <option value="central">Central Depot</option>
                <option value="site">Sub-Site Store</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Store In-Charge</label>
              <input
                type="text"
                value={extra2}
                onChange={(e) => setExtra2(e.target.value)}
                placeholder="e.g. Store Keeper Name"
                className="form-input"
              />
            </div>
          </div>
        )}

        {entityType === "item" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  value={extra1}
                  onChange={(e) => setExtra1(e.target.value)}
                  placeholder="e.g. Hydraulic Filters"
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">Item Type</label>
                <select
                  value={extra2 || "spare_part"}
                  onChange={(e) => setExtra2(e.target.value)}
                  className="form-select"
                >
                  <option value="spare_part">Spare Part</option>
                  <option value="consumable">Consumable / Oil</option>
                  <option value="tool">Tool / Tackles</option>
                  <option value="raw_material">Raw Material</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">UOM</label>
                <select
                  value={extra3 || "Nos"}
                  onChange={(e) => setExtra3(e.target.value)}
                  className="form-select"
                >
                  <option value="Nos">Nos (Units)</option>
                  <option value="Ltr">Ltr (Litres)</option>
                  <option value="Kg">Kg (Kilograms)</option>
                  <option value="Mtr">Mtr (Meters)</option>
                  <option value="Set">Set</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Minimum Stock Level</label>
              <input
                type="number"
                min="0"
                value={extraNum || ""}
                onChange={(e) => setExtraNum(Number(e.target.value))}
                placeholder="e.g. 5"
                className="form-input"
              />
            </div>
          </>
        )}

        {entityType === "engine" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Engine Purpose</label>
              <select
                value={extra1 || "main"}
                onChange={(e) => setExtra1(e.target.value)}
                className="form-select"
              >
                <option value="main">Main Propulsion Engine</option>
                <option value="auxiliary">Auxiliary Engine</option>
                <option value="drum">Drum Engine</option>
                <option value="pump">Pump Engine</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Meter Type</label>
              <select
                value={extra2 || "HOUR"}
                onChange={(e) => setExtra2(e.target.value)}
                className="form-select"
              >
                <option value="HOUR">Hour Meter (Hours)</option>
                <option value="KM">Odometer (Kilometers)</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Opening Reading</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={extraNum || ""}
                onChange={(e) => setExtraNum(Number(e.target.value))}
                placeholder="0.00"
                className="form-input"
              />
            </div>
          </div>
        )}

        {entityType === "asset" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Category</label>
              <select
                value={extra1 || "Power Generator"}
                onChange={(e) => setExtra1(e.target.value)}
                className="form-select"
              >
                <option value="Power Generator">Diesel Generator (DG Set)</option>
                <option value="Lighting Tower">Lighting Tower</option>
                <option value="Welding Machine">Welding Rectifier</option>
                <option value="Air Compressor">Air Compressor</option>
                <option value="Prefab Structure">Prefab Camp / Structure</option>
                <option value="Other">Other Fixed Asset</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Make / Brand</label>
              <input
                type="text"
                value={extra2}
                onChange={(e) => setExtra2(e.target.value)}
                placeholder="e.g. Kirloskar / Cummins / Schwing"
                className="form-input"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="check" className="text-[16px]" />
                Save &amp; Select
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

