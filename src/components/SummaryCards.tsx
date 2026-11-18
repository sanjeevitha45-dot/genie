import React from 'react';
import { computeStockHealth } from '../data/seedData';
import { InventoryItem, PurchaseOrder, StockHealth, WasteEntry } from '../types';
import { Sparkline } from './Sparkline';

interface SummaryCardsProps {
  items: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  wasteLogs: WasteEntry[];
  onQuickFilterHealth: (health: StockHealth | 'all') => void;
  onNavigateOrders: () => void;
  onNavigateWaste: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  items,
  purchaseOrders,
  wasteLogs,
  onQuickFilterHealth,
  onNavigateOrders,
  onNavigateWaste,
}) => {
  const totalValuation = items.reduce(
    (sum, item) => sum + item.onHand * item.unitCost,
    0
  );

  const criticalItems = items.filter((i) => computeStockHealth(i) === 'critical');
  const lowItems = items.filter((i) => computeStockHealth(i) === 'low');
  const expiringItems = items.filter((i) => computeStockHealth(i) === 'expiring');

  const activePOs = purchaseOrders.filter(
    (po) => po.status === 'Ordered' || po.status === 'In Transit'
  );
  const incomingValue = activePOs.reduce(
    (sum, po) =>
      sum + po.items.reduce((s, line) => s + line.orderedQty * line.unitCost, 0),
    0
  );

  const totalWasteCost = wasteLogs.reduce((sum, w) => sum + w.costImpact, 0);

  return (
    <section
      aria-label="Stock health summary"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
    >
      {/* Card 1: Inventory Valuation */}
      <button
        type="button"
        onClick={() => onQuickFilterHealth('all')}
        className="text-left bg-white border border-[#E5E7EB] rounded-lg p-5 transition-all duration-150 hover:border-[#D1D5DB] hover:shadow-[0_2px_4px_-1px_rgba(27,67,50,0.04),0_4px_6px_-2px_rgba(27,67,50,0.02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              On-Hand Valuation
            </p>
            <p className="mt-2 font-display text-[24px] leading-[32px] font-semibold tracking-[-0.01em] text-[#111827] tabular-nums">
              ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Sparkline
            values={[4120, 4290, 4180, 4410, 4560, 4490, Math.round(totalValuation)]}
            strokeColor="#1B4332"
            fillColor="rgba(216, 243, 220, 0.55)"
          />
        </div>
        <p className="mt-3 text-[13px] text-[#414844] tabular-nums">
          Across {items.length} tracked SKUs
        </p>
      </button>

      {/* Card 2: Depleted / Reorder Attention */}
      <button
        type="button"
        onClick={() =>
          onQuickFilterHealth(criticalItems.length > 0 ? 'critical' : 'low')
        }
        className="text-left bg-white border border-[#E5E7EB] rounded-lg p-5 transition-all duration-150 hover:border-[#D1D5DB] hover:shadow-[0_2px_4px_-1px_rgba(27,67,50,0.04),0_4px_6px_-2px_rgba(27,67,50,0.02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              Reorder Attention
            </p>
            <p className="mt-2 font-display text-[24px] leading-[32px] font-semibold tracking-[-0.01em] text-[#111827] tabular-nums">
              {criticalItems.length + lowItems.length} SKUs
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-semibold tracking-[0.03em] whitespace-nowrap shrink-0 ${
              criticalItems.length > 0
                ? 'bg-[#FEE2E2] text-[#991B1B]'
                : 'bg-[#D8F3DC] text-[#1B4332]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                criticalItems.length > 0 ? 'bg-[#DC2626]' : 'bg-[#1B4332]'
              }`}
              aria-hidden="true"
            />
            {criticalItems.length} Critical
          </span>
        </div>
        <p className="mt-3 text-[13px] text-[#414844] tabular-nums">
          {lowItems.length} low stock · {expiringItems.length} expiring soon
        </p>
      </button>

      {/* Card 3: Incoming Shipments */}
      <button
        type="button"
        onClick={onNavigateOrders}
        className="text-left bg-white border border-[#E5E7EB] rounded-lg p-5 transition-all duration-150 hover:border-[#D1D5DB] hover:shadow-[0_2px_4px_-1px_rgba(27,67,50,0.04),0_4px_6px_-2px_rgba(27,67,50,0.02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              Incoming Shipments
            </p>
            <p className="mt-2 font-display text-[24px] leading-[32px] font-semibold tracking-[-0.01em] text-[#111827] tabular-nums">
              ${incomingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Sparkline
            values={[620, 890, 740, 1120, 980, 1217.5]}
            strokeColor="#74A892"
            fillColor="rgba(116, 168, 146, 0.16)"
          />
        </div>
        <p className="mt-3 text-[13px] text-[#414844] tabular-nums">
          {activePOs.length} active purchase {activePOs.length === 1 ? 'order' : 'orders'}
        </p>
      </button>

      {/* Card 4: 7-Day Waste Impact */}
      <button
        type="button"
        onClick={onNavigateWaste}
        className="text-left bg-white border border-[#E5E7EB] rounded-lg p-5 transition-all duration-150 hover:border-[#D1D5DB] hover:shadow-[0_2px_4px_-1px_rgba(27,67,50,0.04),0_4px_6px_-2px_rgba(27,67,50,0.02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
              7-Day Waste Impact
            </p>
            <p className="mt-2 font-display text-[24px] leading-[32px] font-semibold tracking-[-0.01em] text-[#111827] tabular-nums">
              ${totalWasteCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Sparkline
            values={[44, 38, 52, 29, 34, 18, Math.round(totalWasteCost / 3)]}
            strokeColor="#92400E"
            fillColor="rgba(254, 243, 199, 0.65)"
          />
        </div>
        <p className="mt-3 text-[13px] text-[#414844] tabular-nums">
          {wasteLogs.length} logged events this week
        </p>
      </button>
    </section>
  );
};
