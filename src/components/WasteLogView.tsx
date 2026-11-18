import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { LOCATIONS } from '../data/seedData';
import { WasteEntry, WasteReason } from '../types';

interface WasteLogViewProps {
  wasteLogs: WasteEntry[];
  onOpenWasteModal: () => void;
}

const REASONS: (WasteReason | 'All')[] = [
  'All',
  'Expired Batch',
  'Dial-In / Calibration',
  'Over-Prep / End of Day',
  'Damaged Packaging',
];

export const WasteLogView: React.FC<WasteLogViewProps> = ({
  wasteLogs,
  onOpenWasteModal,
}) => {
  const [reasonFilter, setReasonFilter] = useState<WasteReason | 'All'>('All');

  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    LOCATIONS.forEach((l) => map.set(l.id, l.label));
    return map;
  }, []);

  const filteredLogs = useMemo(() => {
    if (reasonFilter === 'All') return wasteLogs;
    return wasteLogs.filter((w) => w.reason === reasonFilter);
  }, [wasteLogs, reasonFilter]);

  const totalCost = filteredLogs.reduce((sum, w) => sum + w.costImpact, 0);

  const reasonSummary = useMemo(() => {
    const totals = new Map<WasteReason, number>();
    wasteLogs.forEach((entry) => {
      totals.set(entry.reason, (totals.get(entry.reason) ?? 0) + entry.costImpact);
    });
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [wasteLogs]);

  return (
    <div className="space-y-6">
      {/* Top Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
            Logged Shrinkage Cost
          </p>
          <p className="mt-2 font-display text-[24px] font-semibold text-[#111827] tabular-nums">
            ${totalCost.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-2 text-[13px] text-[#6B7280] tabular-nums">
            {filteredLogs.length} recorded spoilage & calibration entries
          </p>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              Cost by Waste Cause
            </p>
            <button
              type="button"
              onClick={onOpenWasteModal}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Log Waste Entry
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {reasonSummary.map(([reason, cost]) => (
              <div
                key={reason}
                className="bg-[#F8FAF9] border border-[#E5E7EB] rounded p-3"
              >
                <p className="text-[12px] font-medium text-[#374151] truncate">
                  {reason}
                </p>
                <p className="mt-1 font-code-num text-[15px] font-semibold text-[#111827]">
                  ${cost.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Filter waste logs by reason"
            className="flex items-center gap-1 overflow-x-auto"
          >
            {REASONS.map((reason) => {
              const active = reasonFilter === reason;
              return (
                <button
                  key={reason}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setReasonFilter(reason)}
                  className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#1B4332] text-white'
                      : 'text-[#374151] hover:bg-[#F8FAF9] hover:text-[#111827]'
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-display text-[16px] font-semibold text-[#111827]">
              No waste entries recorded for this filter
            </p>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              Log dial-in coffee, damaged packaging, or expired batches to track true COGS.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-[#E5E7EB] bg-[#F8FAF9]">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                    Item / SKU
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                    Location
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                    Reason & Note
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                    Quantity
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                    Cost Impact
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredLogs.map((entry) => (
                  <tr
                    key={entry.id}
                    className="h-12 hover:bg-[#F8FAF9] transition-colors"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="font-code-num text-[12px] text-[#111827]">
                        {entry.loggedAt}
                      </p>
                      <p className="text-[12px] text-[#6B7280]">
                        {entry.loggedBy}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[14px] font-medium text-[#111827]">
                        {entry.itemName}
                      </p>
                      <p className="font-code-num text-[12px] text-[#6B7280]">
                        {entry.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#374151] whitespace-nowrap">
                      {locationMap.get(entry.locationId)}
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-[13px] font-medium text-[#111827]">
                        {entry.reason}
                      </p>
                      {entry.note && (
                        <p className="text-[12px] text-[#6B7280] truncate">
                          {entry.note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-code-num text-[13px] text-[#991B1B] whitespace-nowrap">
                      -{entry.quantity} {entry.unit}
                    </td>
                    <td className="px-5 py-3 text-right font-code-num text-[13px] font-semibold text-[#111827] whitespace-nowrap">
                      ${entry.costImpact.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
