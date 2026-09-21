"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getItems, createItem, getVendors } from "@/lib/data/repository";
import type { Item, ItemType, Vendor } from "@/lib/types";

export default function ItemMasterPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Mechanical");
  const [subCategory, setSubCategory] = useState("");
  const [itemType, setItemType] = useState<ItemType>("spare_part");
  const [uom, setUom] = useState("Nos");
  const [hsnSac, setHsnSac] = useState("");
  const [gstRate, setGstRate] = useState<number>(18);
  const [minStock, setMinStock] = useState<number>(5);
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [maxStock, setMaxStock] = useState<number>(100);
  const [prefVendor, setPrefVendor] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itms, vnds] = await Promise.all([getItems(), getVendors()]);
      setItems(itms);
      setVendors(vnds);
    } catch (err: any) {
      showToast("Error", err.message || "Failed to load item master.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Validation Error", "Item name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const itmCode = code.trim() || `ITM-${Date.now().toString().slice(-4)}`;
      await createItem({
        itemCode: itmCode,
        itemName: name.trim(),
        category: category.trim(),
        subCategory: subCategory.trim() || undefined,
        itemType,
        uom,
        hsnSac: hsnSac.trim() || undefined,
        gstRatePercent: gstRate,
        minimumStock: minStock,
        reorderLevel,
        maximumStock: maxStock || undefined,
        preferredVendorId: prefVendor || undefined,
        description: desc.trim() || undefined,
        serialTracking: false,
        batchTracking: false,
        expiryTracking: false,
        isActive: true,
      });

      showToast("Success", "New material / spare part added to Item Master.", "success");
      setIsModalOpen(false);
      // Reset form
      setCode("");
      setName("");
      setDesc("");
      loadData();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to save item.", "error");
    } finally {
      setSaving(false);
    }
  }

  const filtered = items.filter((it) => {
    const matchesSearch =
      it.itemName.toLowerCase().includes(search.toLowerCase()) ||
      it.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || it.itemType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central Item Master"
        subtitle="Catalog of mechanical spares, lubricants, tyres, hydraulics, consumables, and construction materials."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="add" className="text-[18px]" /> Register Item
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Icon name="search" className="absolute left-3 top-2.5 text-gray-400 text-[18px]" />
          <input
            type="text"
            placeholder="Search items by code, name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-gray-500">Item Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select text-xs font-medium w-full md:w-48"
          >
            <option value="all">All Item Types ({items.length})</option>
            <option value="spare_part">Spare Parts</option>
            <option value="consumable">Consumables</option>
            <option value="lubricant">Lubricants</option>
            <option value="hydraulic">Hydraulics</option>
            <option value="tyre">Tyres</option>
            <option value="battery">Batteries</option>
            <option value="electrical">Electrical</option>
            <option value="engine_part">Engine Parts</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-head">
                <th className="px-5 py-3">Item Code</th>
                <th className="px-5 py-3">Item Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">UOM</th>
                <th className="px-5 py-3 text-right">Min Stock</th>
                <th className="px-5 py-3 text-right">Reorder Level</th>
                <th className="px-5 py-3 text-right">GST %</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 text-xs">
                    Loading Item Master from Supabase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 text-xs">
                    No items found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="px-5 py-3.5 font-mono font-semibold text-blue-600 text-xs">{item.itemCode}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 text-xs">
                      {item.itemName}
                      {item.subCategory && (
                        <span className="block text-[11px] text-gray-500 font-normal">
                          {item.subCategory}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{item.category}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-500 text-xs">{item.itemType.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-700 text-xs">{item.uom}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-700 text-xs">{item.minimumStock}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-amber-700 font-semibold text-xs">{item.reorderLevel}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-500 text-xs">{item.gstRatePercent}%</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Item */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Material / Spare Part in Master">
        <form onSubmit={handleSaveItem} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Item Code (Auto-generated if empty)
              </label>
              <input
                type="text"
                placeholder="e.g. ITM-0001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hydraulic Oil Filter 20 Micron"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Filters, Hydraulics"
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Item Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemType)}
                className="form-select text-xs font-medium"
              >
                <option value="spare_part">Spare Part</option>
                <option value="consumable">Consumable</option>
                <option value="lubricant">Lubricant / Oil</option>
                <option value="hydraulic">Hydraulic Component</option>
                <option value="tyre">Tyre</option>
                <option value="battery">Battery</option>
                <option value="electrical">Electrical</option>
                <option value="engine_part">Engine Part</option>
                <option value="mechanical_part">Mechanical Part</option>
                <option value="tool">Tool</option>
                <option value="welding">Welding Material</option>
                <option value="safety_item">Safety PPE</option>
                <option value="general_material">General Material</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">UOM *</label>
              <select value={uom} onChange={(e) => setUom(e.target.value)} className="form-select text-xs font-medium">
                <option value="Nos">Nos (Numbers)</option>
                <option value="Litre">Litre (L)</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Meter">Meter (M)</option>
                <option value="Set">Set</option>
                <option value="Box">Box</option>
                <option value="Pair">Pair</option>
                <option value="Drum">Drum (210L)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">HSN / SAC</label>
              <input
                type="text"
                placeholder="e.g. 8421"
                value={hsnSac}
                onChange={(e) => setHsnSac(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GST Rate %</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="form-select text-xs font-medium"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18% (Standard)</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Stock</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Vendor</label>
            <select
              value={prefVendor}
              onChange={(e) => setPrefVendor(e.target.value)}
              className="form-select text-xs"
            >
              <option value="">-- No Preferred Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.vendorCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Specifications, OEM part number, compatibility..."
              className="form-input text-xs resize-none"
            />
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
              disabled={saving}
              className="btn-primary text-xs flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="check" className="text-[18px]" />
                  Save Item
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
