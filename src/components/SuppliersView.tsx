import React from 'react';
import { Mail, Phone, ShoppingBag } from 'lucide-react';
import { computeStockHealth } from '../data/seedData';
import { InventoryItem, Supplier } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  inventoryItems: InventoryItem[];
  onStartPOForSupplier: (supplierId: string, items: InventoryItem[]) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  inventoryItems,
  onStartPOForSupplier,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {suppliers.map((supplier) => {
        const assignedItems = inventoryItems.filter(
          (i) => i.supplierId === supplier.id
        );
        const needsReorder = assignedItems.filter((i) => {
          const h = computeStockHealth(i);
          return h === 'critical' || h === 'low';
        });

        return (
          <article
            key={supplier.id}
            className="bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col justify-between gap-4 hover:border-[#D1D5DB] transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-[17px] font-semibold text-[#111827]">
                    {supplier.name}
                  </h3>
                  <p className="text-[13px] text-[#6B7280]">
                    {supplier.category}
                  </p>
                </div>
                <span className="text-[12px] font-medium text-[#1B4332] bg-[#D8F3DC] px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 tabular-nums">
                  {supplier.leadTimeDays}d lead
                </span>
              </div>

              <div className="border-t border-[#E5E7EB] pt-3 space-y-1.5 text-[13px] text-[#374151]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Account Rep</span>
                  <span className="font-medium text-[#111827]">
                    {supplier.contactName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Min Order / Terms</span>
                  <span className="font-code-num text-[#111827]">
                    ${supplier.minOrderValue} · {supplier.paymentTerms}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Origin</span>
                  <span>{supplier.city}</span>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-3 flex items-center justify-between text-[12px] text-[#6B7280]">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{supplier.email}</span>
                </span>
                <span className="inline-flex items-center gap-1 shrink-0 font-code-num">
                  <Phone className="w-3.5 h-3.5" />
                  {supplier.phone}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
              <span className="text-[12px] text-[#414844] tabular-nums">
                {assignedItems.length} SKUs ·{' '}
                <strong className={needsReorder.length > 0 ? 'text-[#92400E]' : 'text-[#1B4332]'}>
                  {needsReorder.length} below reorder
                </strong>
              </span>

              <button
                type="button"
                onClick={() =>
                  onStartPOForSupplier(
                    supplier.id,
                    needsReorder.length > 0 ? needsReorder : assignedItems.slice(0, 2)
                  )
                }
                disabled={assignedItems.length === 0}
                className="h-8 px-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Draft PO
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};
