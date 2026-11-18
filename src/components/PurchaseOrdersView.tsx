import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Send, Truck } from 'lucide-react';
import { LOCATIONS, computeStockHealth } from '../data/seedData';
import { InventoryItem, POStatus, PurchaseOrder, Supplier } from '../types';
import { POStatusBadge } from './StatusBadge';

interface PurchaseOrdersViewProps {
  purchaseOrders: PurchaseOrder[];
  inventoryItems: InventoryItem[];
  suppliers: Supplier[];
  onAdvancePOStatus: (poId: string, nextStatus: POStatus) => void;
  onReceivePO: (poId: string) => void;
  onOpenNewPOModal: (prefillItems?: InventoryItem[]) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  purchaseOrders,
  inventoryItems,
  suppliers,
  onAdvancePOStatus,
  onReceivePO,
  onOpenNewPOModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<POStatus | 'All'>('All');

  const supplierMap = useMemo(() => {
    const map = new Map<string, Supplier>();
    suppliers.forEach((s) => map.set(s.id, s));
    return map;
  }, [suppliers]);

  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    LOCATIONS.forEach((l) => map.set(l.id, l.label));
    return map;
  }, []);

  // Items below reorder threshold that are not already covered by an open PO
  const openOrderedItemIds = useMemo(() => {
    const ids = new Set<string>();
    purchaseOrders
      .filter((po) => po.status !== 'Received')
      .forEach((po) => po.items.forEach((line) => ids.add(line.itemId)));
    return ids;
  }, [purchaseOrders]);

  const suggestedReorders = useMemo(() => {
    return inventoryItems.filter((item) => {
      const health = computeStockHealth(item);
      return (
        (health === 'critical' || health === 'low') &&
        !openOrderedItemIds.has(item.id)
      );
    });
  }, [inventoryItems, openOrderedItemIds]);

  const filteredPOs = useMemo(() => {
    if (statusFilter === 'All') return purchaseOrders;
    return purchaseOrders.filter((po) => po.status === statusFilter);
  }, [purchaseOrders, statusFilter]);

  const poTabs: (POStatus | 'All')[] = [
    'All',
    'Draft',
    'Ordered',
    'In Transit',
    'Received',
  ];

  return (
    <div className="space-y-6">
      {/* Suggested Reorders Strip */}
      {suggestedReorders.length > 0 && (
        <section className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-[#111827]">
                Reorder Suggestions Below Threshold
              </h2>
              <p className="mt-0.5 text-[13px] text-[#6B7280]">
                {suggestedReorders.length}{' '}
                {suggestedReorders.length === 1 ? 'SKU is' : 'SKUs are'} currently below reorder point without an incoming purchase order.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenNewPOModal(suggestedReorders)}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Draft PO for All ({suggestedReorders.length})
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestedReorders.slice(0, 6).map((item) => {
              const deficit = Math.max(1, Math.ceil(item.parLevel - item.onHand));
              return (
                <div
                  key={item.id}
                  className="bg-[#F8FAF9] border border-[#E5E7EB] rounded p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#111827] truncate">
                      {item.name}
                    </p>
                    <p className="text-[12px] text-[#6B7280] tabular-nums">
                      On hand: {item.onHand} {item.unit} · Suggested: +{deficit} {item.unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenNewPOModal([item])}
                    className="h-8 px-2.5 text-[12px] font-medium text-[#1B4332] bg-white border border-[#E5E7EB] rounded hover:border-[#1B4332] transition-colors whitespace-nowrap shrink-0"
                  >
                    Order
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter purchase orders by status"
          className="flex items-center gap-1 overflow-x-auto"
        >
          {poTabs.map((tab) => {
            const active = statusFilter === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1B4332] text-white'
                    : 'text-[#374151] hover:bg-[#F8FAF9] hover:text-[#111827]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onOpenNewPOModal()}
          className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      {/* Purchase Orders List */}
      {filteredPOs.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center">
          <p className="font-display text-[18px] font-semibold text-[#111827]">
            No purchase orders in {statusFilter}
          </p>
          <p className="mt-1.5 text-[14px] text-[#6B7280]">
            Create a draft purchase order from low-stock items or start a custom order.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPOs.map((po) => {
            const supplier = supplierMap.get(po.supplierId);
            const totalCost = po.items.reduce(
              (sum, line) => sum + line.orderedQty * line.unitCost,
              0
            );

            return (
              <article
                key={po.id}
                className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-code-num text-[14px] font-semibold text-[#111827]">
                        {po.poNumber}
                      </span>
                      <POStatusBadge status={po.status} />
                      <span className="text-[13px] text-[#6B7280]">
                        {locationMap.get(po.locationId)}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-[#374151]">
                      {supplier?.name ?? 'Direct Vendor'} ·{' '}
                      <span className="font-normal text-[#6B7280]">
                        Created {po.createdAt} · Expected {po.expectedDelivery}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-left lg:text-right mr-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                        Order Total
                      </p>
                      <p className="font-code-num text-[16px] font-semibold text-[#111827]">
                        ${totalCost.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {po.status === 'Draft' && (
                      <button
                        type="button"
                        onClick={() => onAdvancePOStatus(po.id, 'Ordered')}
                        className="h-9 px-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit Order
                      </button>
                    )}

                    {po.status === 'Ordered' && (
                      <button
                        type="button"
                        onClick={() => onAdvancePOStatus(po.id, 'In Transit')}
                        className="h-9 px-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9] hover:border-[#D1D5DB] transition-colors whitespace-nowrap"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#6B7280]" />
                        Mark In Transit
                      </button>
                    )}

                    {(po.status === 'Ordered' || po.status === 'In Transit') && (
                      <button
                        type="button"
                        onClick={() => onReceivePO(po.id)}
                        className="h-9 px-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Receive Shipment
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F8FAF9]">
                        <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                          SKU
                        </th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                          Item Description
                        </th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                          Ordered Qty
                        </th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                          Unit Cost
                        </th>
                        <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {po.items.map((line) => (
                        <tr key={line.itemId} className="h-11">
                          <td className="px-5 py-2.5 font-code-num text-[12px] text-[#6B7280] whitespace-nowrap">
                            {line.sku}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] font-medium text-[#111827]">
                            {line.itemName}
                          </td>
                          <td className="px-4 py-2.5 text-right font-code-num text-[13px] text-[#111827] whitespace-nowrap">
                            {line.orderedQty} {line.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right font-code-num text-[13px] text-[#414844] whitespace-nowrap">
                            ${line.unitCost.toFixed(2)}
                          </td>
                          <td className="px-5 py-2.5 text-right font-code-num text-[13px] font-medium text-[#111827] whitespace-nowrap">
                            ${(line.orderedQty * line.unitCost).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {po.notes && (
                  <div className="px-5 py-2.5 bg-[#F8FAF9] border-t border-[#E5E7EB] text-[12px] text-[#6B7280]">
                    Note: {po.notes}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
