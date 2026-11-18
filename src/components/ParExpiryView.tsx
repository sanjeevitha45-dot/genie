import React, { useMemo } from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';
import {
  LOCATIONS,
  computeStockHealth,
  daysUntilDate,
} from '../data/seedData';
import { InventoryItem } from '../types';
import { StockHealthBadge } from './StatusBadge';

interface ParExpiryViewProps {
  items: InventoryItem[];
  onUpdateThresholds: (
    itemId: string,
    parLevel: number,
    reorderPoint: number
  ) => void;
  onTriggerWaste: (item: InventoryItem) => void;
  onInspectItem: (item: InventoryItem) => void;
}

export const ParExpiryView: React.FC<ParExpiryViewProps> = ({
  items,
  onUpdateThresholds,
  onTriggerWaste,
  onInspectItem,
}) => {
  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    LOCATIONS.forEach((l) => map.set(l.id, l.label));
    return map;
  }, []);

  const expiringBatches = useMemo(() => {
    return items
      .filter((item) => item.expiryDate)
      .map((item) => ({
        item,
        daysLeft: daysUntilDate(item.expiryDate) ?? 999,
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [items]);

  const urgentExpiring = expiringBatches.filter((b) => b.daysLeft <= 7);

  return (
    <div className="space-y-6">
      {/* Expiry Watchlist Section */}
      <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-[16px] font-semibold text-[#111827]">
              Perishable Batch Expiry Triage
            </h2>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">
              Monitor dairy, pastry, and botanical lots approaching shelf-life cutoffs within 7 days.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5B21B6] tabular-nums shrink-0">
            <CalendarClock className="w-4 h-4" />
            {urgentExpiring.length} batches within 7d
          </span>
        </div>

        {expiringBatches.length === 0 ? (
          <div className="p-8 text-center text-[14px] text-[#6B7280]">
            No perishable expiration dates tracked for this location.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAF9]">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                    Item / SKU
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                    Location
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                    Expiry Date
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                    At-Risk Stock
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {expiringBatches.map(({ item, daysLeft }) => {
                  const isSoon = daysLeft <= 5;
                  return (
                    <tr
                      key={item.id}
                      className="h-12 hover:bg-[#F8FAF9] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="text-[14px] font-medium text-[#111827]">
                          {item.name}
                        </p>
                        <p className="font-code-num text-[12px] text-[#6B7280]">
                          {item.sku}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#374151] whitespace-nowrap">
                        {locationMap.get(item.locationId)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="font-code-num text-[13px] text-[#111827]">
                            {item.expiryDate}
                          </span>
                          {isSoon && (
                            <StockHealthBadge
                              health="expiring"
                              customLabel={
                                daysLeft <= 0
                                  ? 'Expired / Today'
                                  : `${daysLeft}d left`
                              }
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-code-num text-[13px] text-[#111827]">
                        {item.onHand} {item.unit} ($
                        {(item.onHand * item.unitCost).toFixed(2)})
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onTriggerWaste(item)}
                          className="h-8 px-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#991B1B] bg-[#FEE2E2]/65 rounded hover:bg-[#FEE2E2] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Log Spoilage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Par Level & Threshold Tuning Matrix */}
      <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-display text-[16px] font-semibold text-[#111827]">
            Par Levels & Reorder Thresholds
          </h2>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">
            Adjust target par quantities and reorder triggers directly. Stock health indicators recalculate immediately.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-[#E5E7EB] bg-[#F8FAF9]">
              <tr>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                  Item
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                  Status
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                  On Hand
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                  Par Level
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                  Reorder Point
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                  Fill Ratio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {items.map((item) => {
                const health = computeStockHealth(item);
                const fillPct = Math.min(
                  100,
                  Math.round((item.onHand / Math.max(1, item.parLevel)) * 100)
                );

                return (
                  <tr
                    key={item.id}
                    className="h-12 hover:bg-[#F8FAF9] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => onInspectItem(item)}
                        className="text-left hover:underline"
                      >
                        <p className="text-[14px] font-medium text-[#111827]">
                          {item.name}
                        </p>
                        <p className="font-code-num text-[12px] text-[#6B7280]">
                          {item.sku} · {locationMap.get(item.locationId)}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StockHealthBadge health={health} />
                    </td>
                    <td className="px-4 py-3 text-right font-code-num text-[13px] text-[#111827] whitespace-nowrap">
                      {item.onHand} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center relative">
                        <input
                          type="number"
                          min="1"
                          step="any"
                          aria-label={`Par level for ${item.name}`}
                          value={item.parLevel}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            onUpdateThresholds(item.id, val, item.reorderPoint);
                          }}
                          className="w-24 h-8 pl-2.5 pr-11 text-right font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
                        />
                        <span className="absolute right-2.5 text-[11px] text-[#6B7280] pointer-events-none">
                          {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center relative">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          aria-label={`Reorder point for ${item.name}`}
                          value={item.reorderPoint}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            onUpdateThresholds(item.id, item.parLevel, val);
                          }}
                          className="w-24 h-8 pl-2.5 pr-11 text-right font-code-num text-[13px] text-[#111827] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332]"
                        />
                        <span className="absolute right-2.5 text-[11px] text-[#6B7280] pointer-events-none">
                          {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <div className="w-20 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              health === 'critical'
                                ? 'bg-[#DC2626]'
                                : health === 'low'
                                ? 'bg-[#D97706]'
                                : 'bg-[#1B4332]'
                            }`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <span className="font-code-num text-[12px] text-[#374151] w-9 text-right">
                          {fillPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
