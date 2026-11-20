import React, { useEffect, useMemo, useState } from 'react';
import { Check, Database, Menu, Plus, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { InventoryView } from './components/InventoryView';
import { AddSkuModal, LogWasteModal, NewPOModal } from './components/Modals';
import { ParExpiryView } from './components/ParExpiryView';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { RecountDrawer } from './components/RecountDrawer';
import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { SuppliersView } from './components/SuppliersView';
import { WasteLogView } from './components/WasteLogView';
import { CustomerRAGView } from './components/CustomerRAGView';
import { ChatWidget } from './components/ChatWidget';
import {
  checkBackendHealth,
  fetchInventory,
  fetchPurchaseOrders,
  fetchSuppliers,
  fetchWasteLogs,
  createInventoryItem,
  updateThresholds,
  saveRecount,
  createPurchaseOrder,
  updatePOStatus,
  receivePO,
  logWaste,
  seedDatabase,
  BackendHealth,
} from './services/api';
import {
  INITIAL_INVENTORY,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_WASTE_LOGS,
  LOCATIONS,
  REFERENCE_TODAY,
  computeStockHealth,
} from './data/seedData';
import {
  InventoryItem,
  LocationId,
  NavScreen,
  POLineItem,
  POStatus,
  PurchaseOrder,
  StockHealth,
  Supplier,
  WasteEntry,
  WasteReason,
} from './types';

const STORAGE_KEY = 'artisan_commerce_state_v1';

interface PersistedState {
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  wasteLogs: WasteEntry[];
  selectedLocation: LocationId;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (
        Array.isArray(parsed.inventory) &&
        Array.isArray(parsed.purchaseOrders) &&
        Array.isArray(parsed.wasteLogs)
      ) {
        return parsed;
      }
    }
  } catch {
    // Fall back to default seed data
  }
  return {
    inventory: INITIAL_INVENTORY,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
    wasteLogs: INITIAL_WASTE_LOGS,
    selectedLocation: 'all',
  };
}

const SCREEN_META: Record<
  NavScreen,
  { title: string; subtitle: string }
> = {
  inventory: {
    title: 'Inventory Ledger',
    subtitle: 'Live stock counts, par thresholds, and batch valuation across storefronts.',
  },
  orders: {
    title: 'Purchase Orders',
    subtitle: 'Replenish depleted stock, track supplier transit, and receive shipments.',
  },
  'par-expiry': {
    title: 'Par Levels & Expiry',
    subtitle: 'Triage perishable lots and tune reorder thresholds by store velocity.',
  },
  waste: {
    title: 'Waste & Spoilage Log',
    subtitle: 'Track espresso calibration, expired dairy, and end-of-day pastry shrinkage.',
  },
  suppliers: {
    title: 'Suppliers & Roasters',
    subtitle: 'Active wholesale vendors, lead times, payment terms, and SKU assignments.',
  },
  'customer-rag': {
    title: 'Artisan Concierge — AI Chatbot',
    subtitle: 'Conversational assistant with multi-turn memory grounded in live store inventory, orders, and policies.',
  },
};

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [inventory, setInventory] = useState<InventoryItem[]>(initial.inventory);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(
    initial.purchaseOrders
  );
  const [wasteLogs, setWasteLogs] = useState<WasteEntry[]>(initial.wasteLogs);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshBackendData = async () => {
    setIsSyncing(true);
    const health = await checkBackendHealth();
    setBackendHealth(health);
    if (health.status !== 'error') {
      try {
        const [remoteInv, remotePOs, remoteWaste, remoteSuppliers] = await Promise.all([
          fetchInventory(),
          fetchPurchaseOrders(),
          fetchWasteLogs(),
          fetchSuppliers(),
        ]);
        if (remoteInv && remoteInv.length > 0) setInventory(remoteInv);
        if (remotePOs && remotePOs.length > 0) setPurchaseOrders(remotePOs);
        if (remoteWaste && remoteWaste.length > 0) setWasteLogs(remoteWaste);
        if (remoteSuppliers && remoteSuppliers.length > 0) setSuppliers(remoteSuppliers);
      } catch (e) {
        console.warn('Backend sync error:', e);
      }
    }
    setIsSyncing(false);
    return health;
  };

  useEffect(() => {
    refreshBackendData();
  }, []);

  const [activeScreen, setActiveScreen] = useState<NavScreen>('inventory');
  const [selectedLocation, setSelectedLocation] = useState<LocationId>(
    initial.selectedLocation
  );
  const [healthFilter, setHealthFilter] = useState<StockHealth | 'all'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive drawers & modals
  const [inspectingItemId, setInspectingItemId] = useState<string | null>(null);
  const [addSkuOpen, setAddSkuOpen] = useState(false);
  const [newPOConfig, setNewPOConfig] = useState<{
    open: boolean;
    prefillItems: InventoryItem[];
    prefillSupplierId?: string;
  }>({ open: false, prefillItems: [] });
  const [wasteModalConfig, setWasteModalConfig] = useState<{
    open: boolean;
    prefillItem: InventoryItem | null;
  }>({ open: false, prefillItem: null });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        inventory,
        purchaseOrders,
        wasteLogs,
        selectedLocation,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [inventory, purchaseOrders, wasteLogs, selectedLocation]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Location-scoped datasets
  const scopedInventory = useMemo(() => {
    if (selectedLocation === 'all') return inventory;
    return inventory.filter((item) => item.locationId === selectedLocation);
  }, [inventory, selectedLocation]);

  const scopedPOs = useMemo(() => {
    if (selectedLocation === 'all') return purchaseOrders;
    return purchaseOrders.filter((po) => po.locationId === selectedLocation);
  }, [purchaseOrders, selectedLocation]);

  const scopedWaste = useMemo(() => {
    if (selectedLocation === 'all') return wasteLogs;
    return wasteLogs.filter((w) => w.locationId === selectedLocation);
  }, [wasteLogs, selectedLocation]);

  const inspectingItem = useMemo(
    () => inventory.find((i) => i.id === inspectingItemId) ?? null,
    [inventory, inspectingItemId]
  );

  // Sidebar counts
  const lowAndCriticalCount = useMemo(
    () =>
      scopedInventory.filter((i) => {
        const h = computeStockHealth(i);
        return h === 'critical' || h === 'low';
      }).length,
    [scopedInventory]
  );

  const expiringCount = useMemo(
    () =>
      scopedInventory.filter((i) => computeStockHealth(i) === 'expiring').length,
    [scopedInventory]
  );

  const openPOCount = useMemo(
    () => scopedPOs.filter((po) => po.status !== 'Received').length,
    [scopedPOs]
  );

  // Mutations
  const handleSaveRecount = (
    itemId: string,
    newOnHand: number,
    newPar: number,
    newReorder: number,
    note: string
  ) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const delta = Number((newOnHand - item.onHand).toFixed(2));
        const movement = {
          id: `mv-${Date.now()}`,
          date: `${REFERENCE_TODAY} 08:15`,
          type: 'Recount' as const,
          delta,
          resultingQty: newOnHand,
          note,
          actor: 'Maya R.',
        };
        return {
          ...item,
          onHand: newOnHand,
          parLevel: newPar,
          reorderPoint: newReorder,
          lastCounted: 'Just now',
          movements: [movement, ...item.movements],
        };
      })
    );
    setInspectingItemId(null);
    showToast('Physical recount saved and stock health updated.');
    saveRecount(itemId, newOnHand, newPar, newReorder, note).catch(() => {});
  };

  const handleUpdateThresholds = (
    itemId: string,
    parLevel: number,
    reorderPoint: number
  ) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, parLevel, reorderPoint } : item
      )
    );
    updateThresholds(itemId, parLevel, reorderPoint).catch(() => {});
  };

  const handleAddSku = (
    newItem: Omit<InventoryItem, 'id' | 'lastCounted' | 'movements'>
  ) => {
    const created: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}`,
      lastCounted: 'Just now',
      movements: [
        {
          id: `mv-${Date.now()}`,
          date: `${REFERENCE_TODAY} 08:20`,
          type: 'Manual Adjustment',
          delta: newItem.onHand,
          resultingQty: newItem.onHand,
          note: 'Initial SKU registration',
          actor: 'Maya R.',
        },
      ],
    };
    setInventory((prev) => [created, ...prev]);
    setAddSkuOpen(false);
    showToast(`Added ${created.sku} (${created.name}) to ledger.`);
    createInventoryItem(newItem).catch(() => {});
  };

  const handleSavePO = (data: {
    supplierId: string;
    locationId: Exclude<LocationId, 'all'>;
    expectedDelivery: string;
    status: POStatus;
    notes: string;
    items: POLineItem[];
  }) => {
    const nextNum = 843 + purchaseOrders.length;
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-0${nextNum}`,
      supplierId: data.supplierId,
      locationId: data.locationId,
      status: data.status,
      createdAt: REFERENCE_TODAY,
      expectedDelivery: data.expectedDelivery,
      notes: data.notes || undefined,
      items: data.items,
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    setNewPOConfig({ open: false, prefillItems: [] });
    setActiveScreen('orders');
    showToast(
      `${newPO.poNumber} ${data.status === 'Draft' ? 'saved as draft' : 'submitted to supplier'}.`
    );
    createPurchaseOrder(data).catch(() => {});
  };

  const handleAdvancePOStatus = (poId: string, nextStatus: POStatus) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === poId ? { ...po, status: nextStatus } : po))
    );
    showToast(`Purchase order updated to ${nextStatus}.`);
    updatePOStatus(poId, nextStatus).catch(() => {});
  };

  const handleReceivePO = (poId: string) => {
    const targetPO = purchaseOrders.find((p) => p.id === poId);
    if (!targetPO || targetPO.status === 'Received') return;

    const qtyByItemId = new Map<string, number>();
    targetPO.items.forEach((line) => {
      qtyByItemId.set(
        line.itemId,
        (qtyByItemId.get(line.itemId) ?? 0) + line.orderedQty
      );
    });

    setInventory((prev) =>
      prev.map((item) => {
        const added = qtyByItemId.get(item.id);
        if (!added) return item;
        const nextQty = Number((item.onHand + added).toFixed(2));
        return {
          ...item,
          onHand: nextQty,
          lastCounted: 'Just now',
          movements: [
            {
              id: `mv-${Date.now()}-${item.id}`,
              date: `${REFERENCE_TODAY} 08:30`,
              type: 'Shipment Received',
              delta: added,
              resultingQty: nextQty,
              note: `${targetPO.poNumber} checked in`,
              actor: 'Maya R.',
            },
            ...item.movements,
          ],
        };
      })
    );

    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === poId
          ? { ...po, status: 'Received', receivedAt: REFERENCE_TODAY }
          : po
      )
    );
    showToast(
      `${targetPO.poNumber} received — on-hand inventory quantities updated.`
    );
    receivePO(poId).catch(() => {});
  };

  const handleSaveWaste = (data: {
    itemId: string;
    quantity: number;
    reason: WasteReason;
    note: string;
  }) => {
    const targetItem = inventory.find((i) => i.id === data.itemId);
    if (!targetItem) return;

    const actualDeducted = Math.min(targetItem.onHand, data.quantity);
    const costImpact = Number((actualDeducted * targetItem.unitCost).toFixed(2));
    const newEntry: WasteEntry = {
      id: `w-${Date.now()}`,
      itemId: targetItem.id,
      sku: targetItem.sku,
      itemName: targetItem.name,
      locationId: targetItem.locationId,
      quantity: actualDeducted,
      unit: targetItem.unit,
      costImpact,
      reason: data.reason,
      loggedAt: `${REFERENCE_TODAY} 08:35`,
      loggedBy: 'Maya R.',
      note: data.note || undefined,
    };

    setWasteLogs((prev) => [newEntry, ...prev]);
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== targetItem.id) return item;
        const nextQty = Number(Math.max(0, item.onHand - actualDeducted).toFixed(2));
        return {
          ...item,
          onHand: nextQty,
          lastCounted: 'Just now',
          movements: [
            {
              id: `mv-${Date.now()}`,
              date: `${REFERENCE_TODAY} 08:35`,
              type: 'Waste Logged',
              delta: -actualDeducted,
              resultingQty: nextQty,
              note: `${data.reason}${data.note ? `: ${data.note}` : ''}`,
              actor: 'Maya R.',
            },
            ...item.movements,
          ],
        };
      })
    );
    setWasteModalConfig({ open: false, prefillItem: null });
    setInspectingItemId(null);
    showToast(`Logged ${actualDeducted} ${targetItem.unit} waste (-$${costImpact.toFixed(2)}).`);
    logWaste(data).catch(() => {});
  };

  const handleExportCsv = (itemsToExport: InventoryItem[]) => {
    const header = [
      'SKU',
      'Name',
      'Category',
      'Location',
      'OnHand',
      'Unit',
      'ParLevel',
      'ReorderPoint',
      'UnitCost',
      'Valuation',
      'Status',
    ];
    const rows = itemsToExport.map((item) => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.locationId,
      item.onHand,
      item.unit,
      item.parLevel,
      item.reorderPoint,
      item.unitCost.toFixed(2),
      (item.onHand * item.unitCost).toFixed(2),
      computeStockHealth(item),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `artisan-inventory-${REFERENCE_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${itemsToExport.length} SKUs to CSV.`);
  };

  const handleResetDemoData = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setInventory(INITIAL_INVENTORY);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setWasteLogs(INITIAL_WASTE_LOGS);
    setSelectedLocation('all');
    setHealthFilter('all');
    await seedDatabase().catch(() => {});
    showToast('Workspace restored to initial sample records.');
  };

  const currentLocationLabel =
    LOCATIONS.find((l) => l.id === selectedLocation)?.label ?? 'All Locations';
  const meta = SCREEN_META[activeScreen];

  return (
    <div className="min-h-screen flex bg-[#F8FAF9] text-[#374151]">
      {/* Persistent 240px Desktop Sidebar / Mobile Drawer */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        lowAndCriticalCount={lowAndCriticalCount}
        expiringCount={expiringCount}
        openPOCount={openPOCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar with Breadcrumbs & Primary Action */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 xl:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="xl:hidden p-2 -ml-2 rounded text-[#374151] hover:bg-[#F8FAF9]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-[13px] min-w-0"
            >
              <span className="text-[#6B7280] hidden sm:inline whitespace-nowrap">
                {currentLocationLabel}
              </span>
              <span className="text-[#9CA3AF] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-[#111827] truncate">
                {meta.title}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Supabase & Backend Sync Status Indicator */}
            <button
              type="button"
              onClick={async () => {
                const h = await refreshBackendData();
                showToast(
                  h.message ||
                    (h.supabase === 'connected'
                      ? 'Connected to Supabase Cloud'
                      : 'Running in Local Backend mode')
                );
              }}
              title={
                backendHealth?.message ||
                'Database connection status (click to re-sync)'
              }
              className="h-9 px-3 inline-flex items-center gap-2 text-xs font-medium rounded border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#374151] transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth?.supabase === 'connected'
                    ? 'bg-[#2D6A4F]'
                    : backendHealth?.status === 'ok'
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
                } ${isSyncing ? 'animate-ping' : ''}`}
              />
              <Database className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="hidden sm:inline">
                {isSyncing
                  ? 'Syncing...'
                  : backendHealth?.supabase === 'connected'
                  ? 'Supabase Cloud'
                  : backendHealth?.status === 'ok'
                  ? 'Local Backend'
                  : 'Standalone'}
              </span>
              <RefreshCw
                className={`w-3 h-3 text-[#9CA3AF] ${
                  isSyncing ? 'animate-spin' : ''
                }`}
              />
            </button>

            {activeScreen === 'waste' ? (
              <button
                type="button"
                onClick={() =>
                  setWasteModalConfig({ open: true, prefillItem: null })
                }
                className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Log Waste
              </button>
            ) : activeScreen === 'orders' ? (
              <button
                type="button"
                onClick={() =>
                  setNewPOConfig({ open: true, prefillItems: [] })
                }
                className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] transition-colors whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                New Purchase Order
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAddSkuOpen(true)}
                className="h-9 px-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#1B4332] rounded hover:bg-[#164E37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74A892] focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Inventory SKU
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 xl:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Page Title Block */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="font-display text-[26px] sm:text-[30px] leading-[36px] font-bold tracking-[-0.02em] text-[#111827]">
                {meta.title}
              </h1>
              <p className="mt-1 text-[14px] text-[#414844]">{meta.subtitle}</p>
            </div>
            <p className="text-[12px] text-[#6B7280] font-code-num shrink-0">
              Shift Date: {REFERENCE_TODAY}
            </p>
          </div>

          {/* 4-Column Stock Health Summary Strip */}
          <SummaryCards
            items={scopedInventory}
            purchaseOrders={scopedPOs}
            wasteLogs={scopedWaste}
            onQuickFilterHealth={(health) => {
              setHealthFilter(health);
              setActiveScreen('inventory');
            }}
            onNavigateOrders={() => setActiveScreen('orders')}
            onNavigateWaste={() => setActiveScreen('waste')}
          />

          {/* Active Screen Content */}
          {activeScreen === 'inventory' && (
            <InventoryView
              items={scopedInventory}
              suppliers={suppliers}
              healthFilter={healthFilter}
              onChangeHealthFilter={setHealthFilter}
              onInspectItem={(item) => setInspectingItemId(item.id)}
              onCreatePOFromItems={(items) =>
                setNewPOConfig({ open: true, prefillItems: items })
              }
              onOpenAddModal={() => setAddSkuOpen(true)}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeScreen === 'orders' && (
            <PurchaseOrdersView
              purchaseOrders={scopedPOs}
              inventoryItems={scopedInventory}
              suppliers={suppliers}
              onAdvancePOStatus={handleAdvancePOStatus}
              onReceivePO={handleReceivePO}
              onOpenNewPOModal={(prefill = []) =>
                setNewPOConfig({ open: true, prefillItems: prefill })
              }
            />
          )}

          {activeScreen === 'par-expiry' && (
            <ParExpiryView
              items={scopedInventory}
              onUpdateThresholds={handleUpdateThresholds}
              onTriggerWaste={(item) =>
                setWasteModalConfig({ open: true, prefillItem: item })
              }
              onInspectItem={(item) => setInspectingItemId(item.id)}
            />
          )}

          {activeScreen === 'waste' && (
            <WasteLogView
              wasteLogs={scopedWaste}
              onOpenWasteModal={() =>
                setWasteModalConfig({ open: true, prefillItem: null })
              }
            />
          )}

          {activeScreen === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              inventoryItems={scopedInventory}
              onStartPOForSupplier={(supplierId, items) =>
                setNewPOConfig({
                  open: true,
                  prefillItems: items,
                  prefillSupplierId: supplierId,
                })
              }
            />
          )}

          {activeScreen === 'customer-rag' && (
            <CustomerRAGView
              inventory={scopedInventory}
              selectedLocation={selectedLocation}
              purchaseOrders={scopedPOs}
            />
          )}
        </main>
      </div>

      {/* Elevated Side Drawer: Rapid Physical Recount */}
      <RecountDrawer
        item={inspectingItem}
        suppliers={suppliers}
        onClose={() => setInspectingItemId(null)}
        onSaveRecount={handleSaveRecount}
        onTriggerReorder={(item) => {
          setInspectingItemId(null);
          setNewPOConfig({ open: true, prefillItems: [item] });
        }}
        onTriggerWaste={(item) => {
          setInspectingItemId(null);
          setWasteModalConfig({ open: true, prefillItem: item });
        }}
      />

      {/* Operational Modals */}
      <AddSkuModal
        open={addSkuOpen}
        suppliers={suppliers}
        defaultLocation={selectedLocation}
        onClose={() => setAddSkuOpen(false)}
        onSave={handleAddSku}
      />

      <NewPOModal
        open={newPOConfig.open}
        suppliers={suppliers}
        inventoryItems={inventory}
        prefillItems={newPOConfig.prefillItems}
        prefillSupplierId={newPOConfig.prefillSupplierId}
        defaultLocation={selectedLocation}
        onClose={() => setNewPOConfig({ open: false, prefillItems: [] })}
        onSavePO={handleSavePO}
      />

      <LogWasteModal
        open={wasteModalConfig.open}
        inventoryItems={scopedInventory}
        prefillItem={wasteModalConfig.prefillItem}
        onClose={() => setWasteModalConfig({ open: false, prefillItem: null })}
        onSaveWaste={handleSaveWaste}
      />

      {/* Global RAG-powered Customer Chatbot Widget */}
      <ChatWidget
        selectedLocation={selectedLocation}
        onOpenFullApp={() => setActiveScreen('customer-rag')}
      />

      {/* Non-intrusive Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-5 z-50 bg-[#1B4332] text-white px-4 py-2.5 rounded-lg shadow-[0_20px_25px_-5px_rgba(17,24,39,0.12)] flex items-center gap-2 text-[13px] font-medium"
        >
          <Check className="w-4 h-4 text-[#D8F3DC] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
