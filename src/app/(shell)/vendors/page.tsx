"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getVendors, createVendor, updateVendor } from "@/lib/data/repository";
import type { Vendor, VendorType } from "@/lib/types";

const VENDOR_TYPES: { label: string; value: string }[] = [
  { label: "Own", value: "Own" },
  { label: "Rent on Machinery", value: "Rent on Machinery" },
  { label: "Other", value: "Other" },
];

export default function VendorsPage() {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [vType, setVType] = useState<string>("Own");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendors();
      setVendors(data);
    } catch (e: any) {
      showToast("Error", e.message || "Failed to load vendors.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  function handleOpenModal(v?: Vendor) {
    if (v) {
      setEditingVendor(v);
      setCode(v.vendorCode);
      setName(v.name);
      setVType(v.vendorType || "Own");
      setContact(v.contactPerson || "");
      setPhone(v.phone || "");
      setEmail(v.email || "");
      setGstin(v.gstin || "");
      setAddress(v.address || "");
      setIsActive(v.isActive);
    } else {
      setEditingVendor(null);
      const nextCode = `VND-${String(vendors.length + 1).padStart(3, "0")}`;
      setCode(nextCode);
      setName("");
      setVType("Own");
      setContact("");
      setPhone("");
      setEmail("");
      setGstin("");
      setAddress("");
      setIsActive(true);
    }
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      showToast("Validation Error", "Vendor code and name are required.", "error");
      return;
    }

    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, {
          vendorCode: code.trim().toUpperCase(),
          name: name.trim(),
          vendorType: vType,
          contactPerson: contact.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          gstin: gstin.trim().toUpperCase() || undefined,
          address: address.trim() || undefined,
          isActive,
        });
        showToast("Success", `Vendor '${code}' updated.`);
      } else {
        await createVendor({
          vendorCode: code.trim().toUpperCase(),
          name: name.trim(),
          vendorType: vType,
          contactPerson: contact.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          gstin: gstin.trim().toUpperCase() || undefined,
          address: address.trim() || undefined,
          isActive,
        });
        showToast("Success", `New Vendor '${code}' added.`);
      }
      setIsModalOpen(false);
      loadVendors();
    } catch (err: any) {
      showToast("Error", err.message || "Failed to save vendor.", "error");
    }
  }

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      searchTerm === "" ||
      v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.gstin && v.gstin.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || v.vendorType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors & Service Providers"
        subtitle="Manage authorized OEM dealers, mechanical workshops, fuel agencies, and parts suppliers."
        action={
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Icon name="add" className="text-[18px]" /> Register Vendor
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] relative">
          <Icon name="search" className="absolute left-3.5 top-2.5 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by vendor code, business name, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="form-select text-xs font-medium w-auto"
        >
          <option value="all">All Vendor Categories</option>
          {VENDOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading vendors registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center max-w-lg mx-auto">
          <Icon name="storefront" className="text-blue-600 text-4xl mb-3 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No Vendors Found</h3>
          <p className="text-xs text-gray-500 mb-6">
            Register your authorized OEM service centers, spare parts suppliers, and fuel dealers to link maintenance records.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary text-xs"
          >
            <Icon name="add" className="text-sm mr-1.5" /> Add Vendor
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="px-5 py-3">Vendor Code</th>
                  <th className="px-5 py-3">Vendor Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Contact &amp; Phone</th>
                  <th className="px-5 py-3">GSTIN</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="table-row">
                    <td className="px-5 py-3.5 font-mono font-semibold text-blue-600 text-xs">
                      {v.vendorCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 text-xs leading-snug">{v.name}</p>
                      {v.address && <p className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">{v.address}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium capitalize border border-gray-200">
                        {v.vendorType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <p className="text-gray-900 font-medium">{v.contactPerson || "—"}</p>
                      <p className="text-[11px] text-gray-500">{v.phone || v.email || ""}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                      {v.gstin || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={v.isActive ? "green" : "slate"}>
                        {v.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenModal(v)}
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
        </div>
      )}

      {/* Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVendor ? `Edit Vendor: ${editingVendor.vendorCode}` : "Register Service Vendor"}
        subtitle="Manage workshops, OEM dealers, spare parts suppliers, and fuel providers."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vendor Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. VND-CAT-01"
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={vType}
                onChange={(e) => setVType(e.target.value)}
                className="form-select text-xs font-medium"
              >
                {VENDOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
                {editingVendor && !VENDOR_TYPES.some((t) => t.value.toLowerCase() === (editingVendor.vendorType || "").toLowerCase()) && (
                  <option value={editingVendor.vendorType}>
                    {editingVendor.vendorType.replace("_", " ")} (Historical)
                  </option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Business / Agency Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gmmco Ltd (Caterpillar Authorized)"
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. Anil Deshmukh"
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="service@vendor.example.com"
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="27AAACG1234A1Z5"
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Workshop / Depot Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Workshop address or delivery depot..."
              className="form-input text-xs resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-0"
              />
              Active Approved Vendor
            </label>
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
              className="btn-primary text-xs"
            >
              {editingVendor ? "Update Vendor" : "Register Vendor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
