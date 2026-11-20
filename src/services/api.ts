import {
  InventoryItem,
  LocationId,
  POLineItem,
  POStatus,
  PurchaseOrder,
  Supplier,
  WasteEntry,
  WasteReason,
} from '../types';

const API_BASE = '/api';

export interface BackendHealth {
  status: 'ok' | 'warning' | 'error';
  supabase: 'connected' | 'unconfigured' | 'error';
  message?: string;
  error?: string;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      status: 'error',
      supabase: 'unconfigured',
      message: 'Backend server not reachable. Running in standalone local mode.',
      error: err.message,
    };
  }
}

export async function fetchSuppliers(): Promise<Supplier[] | null> {
  try {
    const res = await fetch(`${API_BASE}/suppliers`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchInventory(location?: LocationId): Promise<InventoryItem[] | null> {
  try {
    const url = location && location !== 'all' ? `${API_BASE}/inventory?location=${location}` : `${API_BASE}/inventory`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createInventoryItem(
  item: Omit<InventoryItem, 'id' | 'lastCounted' | 'movements'>
): Promise<InventoryItem | null> {
  try {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateThresholds(
  itemId: string,
  parLevel: number,
  reorderPoint: number
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/inventory/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parLevel, reorderPoint }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveRecount(
  itemId: string,
  onHand: number,
  parLevel: number,
  reorderPoint: number,
  note: string
): Promise<InventoryItem | null> {
  try {
    const res = await fetch(`${API_BASE}/inventory/${itemId}/recount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onHand, parLevel, reorderPoint, note, actor: 'Maya R.' }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPurchaseOrders(location?: LocationId): Promise<PurchaseOrder[] | null> {
  try {
    const url = location && location !== 'all' ? `${API_BASE}/orders?location=${location}` : `${API_BASE}/orders`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  locationId: Exclude<LocationId, 'all'>;
  expectedDelivery: string;
  status: POStatus;
  notes: string;
  items: POLineItem[];
}): Promise<PurchaseOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updatePOStatus(poId: string, status: POStatus): Promise<PurchaseOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${poId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function receivePO(poId: string): Promise<PurchaseOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${poId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchWasteLogs(location?: LocationId): Promise<WasteEntry[] | null> {
  try {
    const url = location && location !== 'all' ? `${API_BASE}/waste?location=${location}` : `${API_BASE}/waste`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function logWaste(data: {
  itemId: string;
  quantity: number;
  reason: WasteReason;
  note: string;
}): Promise<{ wasteEntry: WasteEntry; updatedOnHand: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/waste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, actor: 'Maya R.' }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function seedDatabase(): Promise<{ success: boolean; mode?: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/seed`, {
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
