import React, { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { LOCATIONS, computeStockHealth } from '../data/seedData';
import { InventoryItem, Supplier } from '../types';
import { StockHealthBadge } from './StatusBadge';

interface RecountDrawerProps {
  item: InventoryItem | null;
  suppliers: Supplier[];
  onClose: () => void;
  onSaveRecount: (
    itemId: string,
    newOnHand: number,
    newPar: number,
    newReorder: number,
    note: string
  ) => void;
  onTriggerReorder: (item: InventoryItem) => void;
  onTriggerWaste: (item: InventoryItem) => void;
}

export const RecountDrawer: React.FC<RecountDrawerProps> = ({
  item,
  suppliers,
  onClose,
  onSaveRecount,
  onTriggerReorder,
  onTriggerWaste,
}) => {
  const [onHandInput, setOnHandInput] = useState<string>('0');
  const [parInput, setParInput] = useState<string>('0');
  const [reorderInput, setReorderInput] = useState<string>('0');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (item) {
      setOnHandInput(String(item.onHand));
      setParInput(String(item.parLevel));
      setReorderInput(String(item.reorderPoint));
      setNote('');
    }
  }, [item]);

  if (!item) return null;

  const supplier = suppliers.find((s) => s.id === item.supplierId);
  const locationLabel =
    LOCATIONS.find((l) => l.id === item.locationId)?.label ?? item.locationId;
  const parsedOnHand = Math.max(0, Number(onHandInput) || 0);
  const parsedPar = Math.max(1, Number(parInput) || item.parLevel);
  const parsedReorder = Math.max(0, Number(reorderInput) || 0);

  const previewHealth = computeStockHealth({
    ...item,
    onHand: parsedOnHand,
    parLevel: parsedPar,
    reorderPoint: parsedReorder,
  });

  const delta = Number((parsedOnHand - item.onHand).toFixed(2));
  const stepAmount = item.unit === 'kg' || item.unit === 'L' ? 0.5 : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRecount(
      item.id,
      parsedOnHand,
      parsedPar,
      parsedReorder,
      note.trim() || 'Physical shelf recount'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recount-drawer-title"
    >
      <div
        className="fixed inset-0 bg-[#111827]/25"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative w-full max-w-[460px] h-full bg-white border-l border-[#E5E7EB] shadow-[0_20px_25px_-5px_rgba(17,24,39,0.08),0_8px_10px_-6px_rgba(17,24,39,0.04)] flex flex-col z-10">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-code-num text-[12px] text-[#6B7280]">
                {item.sku}
              </span>
              <StockHealthBadge health={previewHealth} />
            </div>
            <h2
              id="recount-drawer-title"
              className="mt-1.5 font-display text-[20px] leading-[28px] font-semibold text-[#111827]"
            >
              {item.name}
            </h2>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">
              {locationLabel} · {item.storageZone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recount drawer"
            className="p-1.5 rounded text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAF9]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto artisan-scroll px-6 py-5 space-y-6"
        >
          {/* Physical Count Control */}
          <div className="bg-[#F8FAF9] border border-[#E5E7EB] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="recount-on-hand"
                className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]"
              >
                Physical On-Hand Count
              </label>
              <span className="text-[12px] text-[#414844] tabular-nums">
                Previous: {item.onHand} {item.unit}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setOnHandInput(
                    String(Math.max(0, Number((parsedOnHand - stepAmount).toFixed(2))))
                  )
                }
                aria-label="Decrease count"
                className="w-9 h-9 flex items-center justify-center bg-white border border-[#D1D5DB] rounded text-[#374151] hover:bg-[#F3F4F6] transition-colors shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <input
                  id="recount-on-hand"
                  type="number"
                  step="any"
                  min="0"
                  value={onHandInput}
                  onChange={(e) => setOnHandInput(e.target.value)}
                  className="w-full h-9 pl-3 pr-14 font-code-num text-[15px] font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6B7280] pointer-events-none">
                  {item.unit}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOnHandInput(
                    String(Number((parsedOnHand + stepAmount).toFixed(2)))
                  )
                }
                aria-label="Increase count"
                className="w-9 h-9 flex items-center justify-center bg-white border border-[#D1D5DB] rounded text-[#374151] hover:bg-[#F3F4F6] transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {delta !== 0 && (
              <p className="text-[12px] font-medium text-[#1B4332] tabular-nums">
                Variance: {delta > 0 ? `+${delta}` : delta} {item.unit} (
                {delta > 0 ? '+' : '-'}$
                {Math.abs(delta * item.unitCost).toFixed(2)})
              </p>
            )}
          </div>

          {/* Threshold Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="recount-par"
                className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5"
              >
                Par Level
              </label>
              <div className="relative">
                <input
                  id="recount-par"
                  type="number"
                  step="any"
                  min="1"
                  value={parInput}
                  onChange={(e) => setParInput(e.target.value)}
                  className="w-full h-9 pl-3 pr-14 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6B7280]">
                  {item.unit}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="recount-threshold"
                className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5"
              >
                Reorder Point
              </label>
              <div className="relative">
                <input
                  id="recount-threshold"
                  type="number"
                  step="any"
                  min="0"
                  value={reorderInput}
                  onChange={(e) => setReorderInput(e.target.value)}
                  className="w-full h-9 pl-3 pr-14 font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6B7280]">
                  {item.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Note */}
          <div>
            <label
              htmlFor="recount-note"
              className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-1.5"
            >
              Recount Note (Optional)
            </label>
            <input
              id="recount-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Morning shelf check before delivery"
              className="w-full h-9 px-3 text-[13px] text-[#111827] placeholder:text-[#6B7280] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
            />
          </div>

          {/* Supplier & Cost Metadata */}
          <div className="border-t border-[#E5E7EB] pt-4 space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Primary Supplier</span>
              <span className="font-medium text-[#111827]">
                {supplier?.name ?? 'Direct'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Unit Cost</span>
              <span className="font-code-num text-[#111827]">
                ${item.unitCost.toFixed(2)} / {item.unit}
              </span>
            </div>
            {item.expiryDate && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Batch Expiration</span>
                <span className="font-code-num text-[#111827]">
                  {item.expiryDate}
                </span>
              </div>
            )}
          </div>

          {/* Quick Secondary Workflows */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onTriggerReorder(item)}
              className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9] hover:border-[#D1D5DB] transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#1B4332]" />
              Reorder to Par
            </button>
            <button
              type="button"
              onClick={() => onTriggerWaste(item)}
              className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#991B1B] bg-[#FEE2E2]/65 rounded hover:bg-[#FEE2E2] transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Log Waste
            </button>
          </div>

          {/* Movement History */}
          <div className="border-t border-[#E5E7EB] pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] mb-3">
              Recent Stock Movements
            </h3>
            {item.movements.length === 0 ? (
              <p className="text-[13px] text-[#6B7280]">No recorded movements yet.</p>
            ) : (
              <ul className="space-y-3">
                {item.movements.slice(0, 6).map((mv) => (
                  <li
                    key={mv.id}
                    className="flex items-start justify-between gap-3 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#111827]">
                        {mv.type} · <span className="text-[#6B7280] font-normal">{mv.actor}</span>
                      </p>
                      <p className="text-[12px] text-[#6B7280] truncate">
                        {mv.note}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF] font-code-num mt-0.5">
                        {mv.date}
                      </p>
                    </div>
                    <div className="text-right shrink-0 font-code-num">
                      <span
                        className={
                          mv.delta >= 0 ? 'text-[#1B4332]' : 'text-[#991B1B]'
                        }
                      >
                        {mv.delta >= 0 ? `+${mv.delta}` : mv.delta} {item.unit}
                      </span>
                      <p className="text-[11px] text-[#6B7280]">
                        Bal: {mv.resultingQty}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9] hover:border-[#D1D5DB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSaveRecount(
                item.id,
                parsedOnHand,
                parsedPar,
                parsedReorder,
                note.trim() || 'Physical shelf recount'
              )
            }
            className="h-9 px-4 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] focus-visible:ring-offset-2 transition-colors"
          >
            Save Recount
          </button>
        </div>
      </aside>
    </div>
  );
};
