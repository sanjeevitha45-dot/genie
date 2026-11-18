import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CATEGORIES,
  LOCATIONS,
  computeStockHealth,
  daysUntilDate,
} from '../data/seedData';
import {
  InventoryItem,
  StockHealth,
  Supplier,
} from '../types';
import { StockHealthBadge } from './StatusBadge';

interface InventoryViewProps {
  items: InventoryItem[];
  suppliers: Supplier[];
  healthFilter: StockHealth | 'all';
  onChangeHealthFilter: (filter: StockHealth | 'all') => void;
  onInspectItem: (item: InventoryItem) => void;
  onCreatePOFromItems: (items: InventoryItem[]) => void;
  onOpenAddModal: () => void;
  onExportCsv: (items: InventoryItem[]) => void;
}

type SortKey = 'name' | 'onHand' | 'valuation' | 'health';

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  suppliers,
  healthFilter,
  onChangeHealthFilter,
  onInspectItem,
  onCreatePOFromItems,
  onOpenAddModal,
  onExportCsv,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All Items');
  const [sortKey, setSortKey] = useState<SortKey>('health');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const supplierNameMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [suppliers]);

  const locationLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    LOCATIONS.forEach((l) => map.set(l.id, l.label));
    return map;
  }, []);

  const healthOrder: Record<StockHealth, number> = {
    critical: 0,
    expiring: 1,
    low: 2,
    optimal: 3,
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((item) => {
        if (activeCategory !== 'All Items' && item.category !== activeCategory) {
          return false;
        }
        const health = computeStockHealth(item);
        if (healthFilter !== 'all' && health !== healthFilter) {
          return false;
        }
        if (q) {
          const supName = supplierNameMap.get(item.supplierId)?.toLowerCase() ?? '';
          return (
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.storageZone.toLowerCase().includes(q) ||
            supName.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortKey === 'onHand') {
          cmp = a.onHand - b.onHand;
        } else if (sortKey === 'valuation') {
          cmp = a.onHand * a.unitCost - b.onHand * b.unitCost;
        } else {
          cmp =
            healthOrder[computeStockHealth(a)] -
            healthOrder[computeStockHealth(b)];
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [items, activeCategory, healthFilter, searchQuery, sortKey, sortAsc, supplierNameMap]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filteredItems.forEach((item) => next.delete(item.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredItems.forEach((item) => next.add(item.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  );

  return (
    <div className="space-y-4">
      {/* Category & Toolbar Row */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div
            role="tablist"
            aria-label="Filter inventory by category"
            className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0"
          >
            {CATEGORIES.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] ${
                    active
                      ? 'bg-[#1B4332] text-white'
                      : 'text-[#374151] hover:bg-[#F8FAF9] hover:text-[#111827]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onExportCsv(filteredItems)}
            className="h-9 px-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9] hover:border-[#D1D5DB] transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#6B7280]" />
            Export CSV
          </button>
        </div>

        {/* Search & Health Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, item name, supplier, or storage zone..."
              aria-label="Search inventory items"
              className="w-full h-9 pl-9 pr-3 text-[13px] text-[#111827] placeholder:text-[#6B7280] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative flex items-center">
              <SlidersHorizontal
                className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 pointer-events-none"
                aria-hidden="true"
              />
              <select
                aria-label="Filter by stock health"
                value={healthFilter}
                onChange={(e) =>
                  onChangeHealthFilter(e.target.value as StockHealth | 'all')
                }
                className="h-9 pl-8 pr-7 text-[13px] font-medium text-[#374151] bg-white border border-[#D1D5DB] rounded focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
              >
                <option value="all">All Health States</option>
                <option value="critical">Critical / Out</option>
                <option value="low">Low Stock</option>
                <option value="expiring">Expiring Soon</option>
                <option value="optimal">In Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center">
          <p className="font-display text-[18px] font-semibold text-[#111827]">
            No inventory items match these filters
          </p>
          <p className="mt-1.5 text-[14px] text-[#6B7280] max-w-md mx-auto">
            Clear your search or health filter to inspect all tracked stock, or add a new SKU to this location.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All Items');
                onChangeHealthFilter('all');
              }}
              className="h-9 px-4 text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9] hover:border-[#D1D5DB] transition-colors"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Inventory SKU
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="overflow-x-auto artisan-scroll">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB]">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all visible items"
                        className="w-4 h-4 rounded border-[#D1D5DB] accent-[#1B4332] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        className="inline-flex items-center gap-1 hover:text-[#111827]"
                      >
                        SKU / Item
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] whitespace-nowrap">
                      Location & Zone
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSort('health')}
                        className="inline-flex items-center gap-1 hover:text-[#111827]"
                      >
                        Stock Health
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSort('onHand')}
                        className="inline-flex items-center gap-1 ml-auto hover:text-[#111827]"
                      >
                        On Hand
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right whitespace-nowrap">
                      Par / Reorder
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSort('valuation')}
                        className="inline-flex items-center gap-1 ml-auto hover:text-[#111827]"
                      >
                        Valuation
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] whitespace-nowrap">
                      Last Counted
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280] text-right whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredItems.map((item) => {
                    const health = computeStockHealth(item);
                    const isSelected = selectedIds.has(item.id);
                    const valuation = item.onHand * item.unitCost;
                    const expDays = daysUntilDate(item.expiryDate);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onInspectItem(item)}
                        className={`h-12 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#D8F3DC]/30 hover:bg-[#D8F3DC]/40'
                            : 'hover:bg-[#F8FAF9]'
                        }`}
                      >
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.id)}
                            aria-label={`Select ${item.name}`}
                            className="w-4 h-4 rounded border-[#D1D5DB] accent-[#1B4332] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 pr-4 max-w-[280px]">
                          <div className="font-medium text-[14px] text-[#111827] truncate">
                            {item.name}
                          </div>
                          <div className="text-[12px] text-[#6B7280] flex items-center gap-1.5 truncate">
                            <span className="font-code-num">{item.sku}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">
                              {supplierNameMap.get(item.supplierId) ?? 'Direct'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-[13px] font-medium text-[#374151]">
                            {locationLabelMap.get(item.locationId)}
                          </div>
                          <div className="text-[12px] text-[#6B7280]">
                            {item.storageZone}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <StockHealthBadge health={health} />
                            {expDays !== null && expDays <= 5 && (
                              <span className="text-[11px] text-[#5B21B6] font-medium tabular-nums">
                                {expDays <= 0
                                  ? 'Expires today'
                                  : `Expires in ${expDays}d`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-code-num text-[14px] font-semibold text-[#111827]">
                            {item.onHand}
                          </span>{' '}
                          <span className="text-[12px] text-[#6B7280]">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-code-num text-[13px] text-[#414844]">
                          {item.parLevel} / {item.reorderPoint}{' '}
                          <span className="text-[12px] text-[#6B7280] font-sans">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-code-num text-[13px] text-[#111827]">
                          ${valuation.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[13px] text-[#6B7280]">
                          {item.lastCounted}
                        </td>
                        <td
                          className="px-4 py-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onInspectItem(item)}
                            className="h-8 px-3 text-[12px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded hover:bg-[#F8FAF9] hover:border-[#D1D5DB] transition-colors whitespace-nowrap"
                          >
                            Recount
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item) => {
              const health = computeStockHealth(item);
              const valuation = item.onHand * item.unitCost;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-[#111827] leading-snug">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#6B7280] font-code-num">
                        {item.sku} · {locationLabelMap.get(item.locationId)}
                      </p>
                    </div>
                    <StockHealthBadge health={health} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E7EB]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                        On Hand
                      </p>
                      <p className="mt-0.5 font-code-num text-[14px] font-semibold text-[#111827]">
                        {item.onHand} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                        Par Level
                      </p>
                      <p className="mt-0.5 font-code-num text-[14px] text-[#374151]">
                        {item.parLevel} {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                        Value
                      </p>
                      <p className="mt-0.5 font-code-num text-[14px] text-[#111827]">
                        ${valuation.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[12px] text-[#6B7280]">
                      Counted {item.lastCounted}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspectItem(item)}
                      className="h-9 px-3.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors"
                    >
                      Rapid Recount
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sticky Bulk Action Footer */}
      {selectedItems.length > 0 && (
        <div className="sticky bottom-4 z-20 bg-[#1B4332] text-white rounded-lg px-4 py-3 shadow-[0_20px_25px_-5px_rgba(17,24,39,0.12),0_8px_10px_-6px_rgba(17,24,39,0.06)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold tabular-nums">
              {selectedItems.length}{' '}
              {selectedItems.length === 1 ? 'SKU' : 'SKUs'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[12px] text-[#D8F3DC] hover:text-white underline underline-offset-2"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onExportCsv(selectedItems)}
              className="h-8 px-3 text-[12px] font-medium text-[#1B4332] bg-white rounded hover:bg-[#F8FAF9] transition-colors whitespace-nowrap"
            >
              Export Selected
            </button>
            <button
              type="button"
              onClick={() => {
                onCreatePOFromItems(selectedItems);
                setSelectedIds(new Set());
              }}
              className="h-8 px-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1B4332] bg-[#D8F3DC] rounded hover:bg-[#B5EBD3] transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Create Draft PO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
