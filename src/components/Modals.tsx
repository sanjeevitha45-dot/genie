import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { CATEGORIES, LOCATIONS, REFERENCE_TODAY } from '../data/seedData';
import {
  InventoryItem,
  ItemCategory,
  LocationId,
  POLineItem,
  POStatus,
  Supplier,
  WasteReason,
} from '../types';

/* -------------------------------------------------------------------------- */
/* 1. Add Inventory SKU Modal                                                 */
/* -------------------------------------------------------------------------- */

interface AddSkuModalProps {
  open: boolean;
  suppliers: Supplier[];
  defaultLocation: LocationId;
  onClose: () => void;
  onSave: (
    item: Omit<InventoryItem, 'id' | 'lastCounted' | 'movements'>
  ) => void;
}

export const AddSkuModal: React.FC<AddSkuModalProps> = ({
  open,
  suppliers,
  defaultLocation,
  onClose,
  onSave,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Roasted Coffee');
  const [locationId, setLocationId] = useState<Exclude<LocationId, 'all'>>(
    defaultLocation === 'all' ? 'roastery' : defaultLocation
  );
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id ?? '');
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [onHand, setOnHand] = useState('15');
  const [parLevel, setParLevel] = useState('25');
  const [reorderPoint, setReorderPoint] = useState('10');
  const [unitCost, setUnitCost] = useState('22.50');
  const [storageZone, setStorageZone] = useState('Dry Rack A2');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSku('');
      setName('');
      setCategory('Roasted Coffee');
      setLocationId(defaultLocation === 'all' ? 'roastery' : defaultLocation);
      setSupplierId(suppliers[0]?.id ?? '');
      setUnit('kg');
      setOnHand('15');
      setParLevel('25');
      setReorderPoint('10');
      setUnitCost('22.50');
      setStorageZone('Dry Rack A2');
      setExpiryDate('');
      setError('');
    }
  }, [open, defaultLocation, suppliers]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      setError('Please enter both a SKU code and item name.');
      return;
    }
    onSave({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      locationId,
      supplierId,
      unit,
      onHand: Math.max(0, Number(onHand) || 0),
      parLevel: Math.max(1, Number(parLevel) || 1),
      reorderPoint: Math.max(0, Number(reorderPoint) || 0),
      unitCost: Math.max(0.01, Number(unitCost) || 0),
      storageZone: storageZone.trim() || 'Main Storage',
      expiryDate: expiryDate || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-sku-title"
    >
      <div
        className="fixed inset-0 bg-[#111827]/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white border border-[#E5E7EB] rounded-lg shadow-[0_20px_25px_-5px_rgba(17,24,39,0.08),0_8px_10px_-6px_rgba(17,24,39,0.04)] z-10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2
            id="add-sku-title"
            className="font-display text-[18px] font-semibold text-[#111827]"
          >
            Add Inventory SKU
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAF9]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <p className="text-[13px] text-[#991B1B] bg-[#FEE2E2] px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                SKU Code
              </label>
              <input
                type="text"
                placeholder="COF-KEN-03"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full h-9 px-3 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Item Name
              </label>
              <input
                type="text"
                placeholder="Kenya Nyeri AA — Filter Roast"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              >
                {CATEGORIES.filter((c) => c !== 'All Items').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) =>
                  setLocationId(e.target.value as Exclude<LocationId, 'all'>)
                }
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              >
                {LOCATIONS.filter((l) => l.id !== 'all').map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) =>
                  setUnit(e.target.value as InventoryItem['unit'])
                }
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              >
                <option value="kg">kg</option>
                <option value="bags">bags</option>
                <option value="bottles">bottles</option>
                <option value="L">L</option>
                <option value="cases">cases</option>
                <option value="trays">trays</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                On Hand
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={onHand}
                onChange={(e) => setOnHand(e.target.value)}
                className="w-full h-9 px-2.5 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Par Level
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={parLevel}
                onChange={(e) => setParLevel(e.target.value)}
                className="w-full h-9 px-2.5 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Reorder Pt
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                className="w-full h-9 px-2.5 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full h-9 px-2.5 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Storage Zone
              </label>
              <input
                type="text"
                value={storageZone}
                onChange={(e) => setStorageZone(e.target.value)}
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-9 px-3 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37]"
            >
              Add SKU
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. New Purchase Order Modal                                                */
/* -------------------------------------------------------------------------- */

interface NewPOModalProps {
  open: boolean;
  suppliers: Supplier[];
  inventoryItems: InventoryItem[];
  prefillItems: InventoryItem[];
  prefillSupplierId?: string;
  defaultLocation: LocationId;
  onClose: () => void;
  onSavePO: (data: {
    supplierId: string;
    locationId: Exclude<LocationId, 'all'>;
    expectedDelivery: string;
    status: POStatus;
    notes: string;
    items: POLineItem[];
  }) => void;
}

export const NewPOModal: React.FC<NewPOModalProps> = ({
  open,
  suppliers,
  inventoryItems,
  prefillItems,
  prefillSupplierId,
  defaultLocation,
  onClose,
  onSavePO,
}) => {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [locationId, setLocationId] = useState<Exclude<LocationId, 'all'>>(
    defaultLocation === 'all' ? 'downtown' : defaultLocation
  );
  const [expectedDelivery, setExpectedDelivery] = useState('2026-11-20');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<POLineItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const initialSupplier =
      prefillSupplierId ||
      prefillItems[0]?.supplierId ||
      suppliers[0]?.id ||
      '';
    setSupplierId(initialSupplier);
    setLocationId(
      prefillItems[0]?.locationId ??
        (defaultLocation === 'all' ? 'downtown' : defaultLocation)
    );
    setExpectedDelivery('2026-11-20');
    setNotes('');

    const sourceItems =
      prefillItems.length > 0
        ? prefillItems
        : inventoryItems.filter((i) => i.supplierId === initialSupplier).slice(0, 2);

    setLines(
      sourceItems.map((item) => ({
        itemId: item.id,
        sku: item.sku,
        itemName: item.name,
        unit: item.unit,
        orderedQty: Math.max(1, Math.ceil(item.parLevel - item.onHand)),
        unitCost: item.unitCost,
      }))
    );
  }, [open, prefillItems, prefillSupplierId, suppliers, inventoryItems, defaultLocation]);

  const availableAddItems = useMemo(() => {
    const existingIds = new Set(lines.map((l) => l.itemId));
    return inventoryItems.filter((i) => !existingIds.has(i.id));
  }, [inventoryItems, lines]);

  if (!open) return null;

  const totalCost = lines.reduce(
    (sum, line) => sum + line.orderedQty * line.unitCost,
    0
  );

  const handleQtyChange = (itemId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.itemId === itemId ? { ...l, orderedQty: Math.max(1, qty) } : l
      )
    );
  };

  const handleRemoveLine = (itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  const handleAddLine = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => [
      ...prev,
      {
        itemId: item.id,
        sku: item.sku,
        itemName: item.name,
        unit: item.unit,
        orderedQty: Math.max(1, Math.ceil(item.parLevel - item.onHand)),
        unitCost: item.unitCost,
      },
    ]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-po-title"
    >
      <div
        className="fixed inset-0 bg-[#111827]/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-lg shadow-[0_20px_25px_-5px_rgba(17,24,39,0.08),0_8px_10px_-6px_rgba(17,24,39,0.04)] z-10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2
            id="new-po-title"
            className="font-display text-[18px] font-semibold text-[#111827]"
          >
            Create Purchase Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAF9]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto artisan-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Receiving Store
              </label>
              <select
                value={locationId}
                onChange={(e) =>
                  setLocationId(e.target.value as Exclude<LocationId, 'all'>)
                }
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              >
                {LOCATIONS.filter((l) => l.id !== 'all').map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Expected Delivery
              </label>
              <input
                type="date"
                min={REFERENCE_TODAY}
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full h-9 px-3 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                Line Items ({lines.length})
              </p>
              {availableAddItems.length > 0 && (
                <select
                  aria-label="Add item to purchase order"
                  value=""
                  onChange={(e) => handleAddLine(e.target.value)}
                  className="h-8 px-2.5 text-[12px] text-[#374151] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
                >
                  <option value="" disabled>
                    + Add another SKU...
                  </option>
                  {availableAddItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.sku} — {i.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="border border-dashed border-[#D1D5DB] rounded p-6 text-center text-[13px] text-[#6B7280]">
                Select at least one SKU above to include in this purchase order.
              </div>
            ) : (
              <div className="border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB]">
                {lines.map((line) => (
                  <div
                    key={line.itemId}
                    className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#111827] truncate">
                        {line.itemName}
                      </p>
                      <p className="font-code-num text-[12px] text-[#6B7280]">
                        {line.sku} · ${line.unitCost.toFixed(2)}/{line.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.orderedQty}
                          onChange={(e) =>
                            handleQtyChange(line.itemId, Number(e.target.value) || 1)
                          }
                          className="w-24 h-8 pl-2.5 pr-11 text-right font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#6B7280] pointer-events-none">
                          {line.unit}
                        </span>
                      </div>

                      <span className="w-20 text-right font-code-num text-[13px] font-medium text-[#111827]">
                        ${(line.orderedQty * line.unitCost).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.itemId)}
                        aria-label={`Remove ${line.itemName}`}
                        className="p-1.5 text-[#6B7280] hover:text-[#991B1B] rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
              Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Drop before 7:30 AM opening shift"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F8FAF9] flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              PO Total
            </p>
            <p className="font-code-num text-[18px] font-semibold text-[#111827]">
              ${totalCost.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={lines.length === 0}
              onClick={() =>
                onSavePO({
                  supplierId,
                  locationId,
                  expectedDelivery,
                  status: 'Draft',
                  notes: notes.trim(),
                  items: lines,
                })
              }
              className="h-9 px-4 text-[13px] font-medium text-[#374151] bg-white border border-[#D1D5DB] rounded hover:bg-[#F3F4F6] disabled:opacity-40"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={lines.length === 0}
              onClick={() =>
                onSavePO({
                  supplierId,
                  locationId,
                  expectedDelivery,
                  status: 'Ordered',
                  notes: notes.trim(),
                  items: lines,
                })
              }
              className="h-9 px-4 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] disabled:opacity-40"
            >
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Log Waste Entry Modal                                                   */
/* -------------------------------------------------------------------------- */

interface LogWasteModalProps {
  open: boolean;
  inventoryItems: InventoryItem[];
  prefillItem: InventoryItem | null;
  onClose: () => void;
  onSaveWaste: (data: {
    itemId: string;
    quantity: number;
    reason: WasteReason;
    note: string;
  }) => void;
}

export const LogWasteModal: React.FC<LogWasteModalProps> = ({
  open,
  inventoryItems,
  prefillItem,
  onClose,
  onSaveWaste,
}) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<WasteReason>('Expired Batch');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedItemId(prefillItem?.id ?? inventoryItems[0]?.id ?? '');
    setQuantity('1');
    setReason('Expired Batch');
    setNote('');
  }, [open, prefillItem, inventoryItems]);

  if (!open) return null;

  const selectedItem = inventoryItems.find((i) => i.id === selectedItemId);
  const parsedQty = Math.max(0.1, Number(quantity) || 0);
  const estimatedLoss = selectedItem ? parsedQty * selectedItem.unitCost : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    onSaveWaste({
      itemId: selectedItem.id,
      quantity: parsedQty,
      reason,
      note: note.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-waste-title"
    >
      <div
        className="fixed inset-0 bg-[#111827]/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white border border-[#E5E7EB] rounded-lg shadow-[0_20px_25px_-5px_rgba(17,24,39,0.08),0_8px_10px_-6px_rgba(17,24,39,0.04)] z-10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2
            id="log-waste-title"
            className="font-display text-[18px] font-semibold text-[#111827]"
          >
            Log Waste & Spoilage
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAF9]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
              Inventory Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
            >
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name} ({item.onHand} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Quantity Lost
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-9 pl-3 pr-14 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6B7280] pointer-events-none">
                  {selectedItem?.unit ?? 'units'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
                Waste Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as WasteReason)}
                className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
              >
                <option value="Expired Batch">Expired Batch</option>
                <option value="Dial-In / Calibration">Dial-In / Calibration</option>
                <option value="Over-Prep / End of Day">Over-Prep / End of Day</option>
                <option value="Damaged Packaging">Damaged Packaging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Opened carton passed 48-hour shelf cutoff"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-9 px-3 text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
            />
          </div>

          <div className="bg-[#FEE2E2]/50 border border-[#FEE2E2] rounded px-3.5 py-2.5 flex items-center justify-between text-[13px]">
            <span className="text-[#991B1B] font-medium">
              Estimated COGS Impact
            </span>
            <span className="font-code-num font-semibold text-[#991B1B]">
              -${estimatedLoss.toFixed(2)}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-[13px] font-medium text-[#991B1B] bg-[#FEE2E2] rounded hover:bg-[#FECACA]"
            >
              Confirm Waste Deduction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
