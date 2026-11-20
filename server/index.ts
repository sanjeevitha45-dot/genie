import express, { Request, Response } from 'express';
import cors from 'cors';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { executeCustomerRAG, KNOWLEDGE_CORPUS } from './rag.js';
import {
  INITIAL_INVENTORY,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_WASTE_LOGS,
  REFERENCE_TODAY,
} from '../src/data/seedData.js';
import { InventoryItem, PurchaseOrder, Supplier, WasteEntry } from '../src/types.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory fallback state in case Supabase is not yet connected
let memoryInventory: InventoryItem[] = [...INITIAL_INVENTORY];
let memoryOrders: PurchaseOrder[] = [...INITIAL_PURCHASE_ORDERS];
let memoryWaste: WasteEntry[] = [...INITIAL_WASTE_LOGS];
let memorySuppliers: Supplier[] = [...INITIAL_SUPPLIERS];

// Helper: Database Snake_Case to Client CamelCase for InventoryItem
function mapDbToItem(row: any): InventoryItem {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    locationId: row.location_id,
    supplierId: row.supplier_id,
    unit: row.unit,
    onHand: Number(row.on_hand),
    parLevel: Number(row.par_level),
    reorderPoint: Number(row.reorder_point),
    unitCost: Number(row.unit_cost),
    expiryDate: row.expiry_date || undefined,
    lastCounted: row.last_counted || 'Just now',
    storageZone: row.storage_zone || '',
    movements: Array.isArray(row.movements) ? row.movements : [],
  };
}

// Helper: Client CamelCase to Database Snake_Case for InventoryItem
function mapItemToDb(item: Partial<InventoryItem>): any {
  const row: any = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.sku !== undefined) row.sku = item.sku;
  if (item.name !== undefined) row.name = item.name;
  if (item.category !== undefined) row.category = item.category;
  if (item.locationId !== undefined) row.location_id = item.locationId;
  if (item.supplierId !== undefined) row.supplier_id = item.supplierId;
  if (item.unit !== undefined) row.unit = item.unit;
  if (item.onHand !== undefined) row.on_hand = item.onHand;
  if (item.parLevel !== undefined) row.par_level = item.parLevel;
  if (item.reorderPoint !== undefined) row.reorder_point = item.reorderPoint;
  if (item.unitCost !== undefined) row.unit_cost = item.unitCost;
  if (item.expiryDate !== undefined) row.expiry_date = item.expiryDate;
  if (item.lastCounted !== undefined) row.last_counted = item.lastCounted;
  if (item.storageZone !== undefined) row.storage_zone = item.storageZone;
  if (item.movements !== undefined) row.movements = item.movements;
  return row;
}

// Helper: Database Snake_Case to Client CamelCase for PurchaseOrder
function mapDbToOrder(row: any): PurchaseOrder {
  return {
    id: row.id,
    poNumber: row.po_number,
    supplierId: row.supplier_id,
    locationId: row.location_id,
    status: row.status,
    createdAt: row.created_at,
    expectedDelivery: row.expected_delivery,
    receivedAt: row.received_at || undefined,
    notes: row.notes || undefined,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

// Helper: Client CamelCase to Database Snake_Case for PurchaseOrder
function mapOrderToDb(po: Partial<PurchaseOrder>): any {
  const row: any = {};
  if (po.id !== undefined) row.id = po.id;
  if (po.poNumber !== undefined) row.po_number = po.poNumber;
  if (po.supplierId !== undefined) row.supplier_id = po.supplierId;
  if (po.locationId !== undefined) row.location_id = po.locationId;
  if (po.status !== undefined) row.status = po.status;
  if (po.createdAt !== undefined) row.created_at = po.createdAt;
  if (po.expectedDelivery !== undefined) row.expected_delivery = po.expectedDelivery;
  if (po.receivedAt !== undefined) row.received_at = po.receivedAt;
  if (po.notes !== undefined) row.notes = po.notes;
  if (po.items !== undefined) row.items = po.items;
  return row;
}

// Helper: Database Snake_Case to Client CamelCase for WasteEntry
function mapDbToWaste(row: any): WasteEntry {
  return {
    id: row.id,
    itemId: row.item_id,
    sku: row.sku,
    itemName: row.item_name,
    locationId: row.location_id,
    quantity: Number(row.quantity),
    unit: row.unit,
    costImpact: Number(row.cost_impact),
    reason: row.reason,
    loggedAt: row.logged_at,
    loggedBy: row.logged_by,
    note: row.note || undefined,
  };
}

// Helper: Client CamelCase to Database Snake_Case for WasteEntry
function mapWasteToDb(entry: Partial<WasteEntry>): any {
  const row: any = {};
  if (entry.id !== undefined) row.id = entry.id;
  if (entry.itemId !== undefined) row.item_id = entry.itemId;
  if (entry.sku !== undefined) row.sku = entry.sku;
  if (entry.itemName !== undefined) row.item_name = entry.itemName;
  if (entry.locationId !== undefined) row.location_id = entry.locationId;
  if (entry.quantity !== undefined) row.quantity = entry.quantity;
  if (entry.unit !== undefined) row.unit = entry.unit;
  if (entry.costImpact !== undefined) row.cost_impact = entry.costImpact;
  if (entry.reason !== undefined) row.reason = entry.reason;
  if (entry.loggedAt !== undefined) row.logged_at = entry.loggedAt;
  if (entry.loggedBy !== undefined) row.logged_by = entry.loggedBy;
  if (entry.note !== undefined) row.note = entry.note;
  return row;
}

// Helper: Database Snake_Case to Client CamelCase for Supplier
function mapDbToSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    leadTimeDays: Number(row.lead_time_days),
    minOrderValue: Number(row.min_order_value),
    paymentTerms: row.payment_terms,
    city: row.city,
  };
}

// -------------------------------------------------------------
// HEALTH & STATUS ENDPOINT
// -------------------------------------------------------------
app.get('/api/health', async (_req: Request, res: Response) => {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return res.json({
      status: 'ok',
      supabase: 'unconfigured',
      message: 'Supabase credentials not configured. Using local backend mode.',
    });
  }

  try {
    const { error } = await supabase.from('suppliers').select('id').limit(1);
    if (error) {
      return res.json({
        status: 'warning',
        supabase: 'error',
        error: error.message,
        message: 'Supabase connected but tables may not be created yet. Run supabase/schema.sql in the Supabase SQL editor.',
      });
    }
    return res.json({
      status: 'ok',
      supabase: 'connected',
      message: 'Successfully connected to Supabase database.',
    });
  } catch (err: any) {
    return res.json({
      status: 'warning',
      supabase: 'error',
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// SUPPLIERS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/suppliers', async (_req: Request, res: Response) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (!error && data && data.length > 0) {
        return res.json(data.map(mapDbToSupplier));
      }
    } catch {
      // Fall through to memory
    }
  }
  return res.json(memorySuppliers);
});

// -------------------------------------------------------------
// INVENTORY ENDPOINTS
// -------------------------------------------------------------
app.get('/api/inventory', async (req: Request, res: Response) => {
  const location = req.query.location as string | undefined;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('inventory_items').select('*').order('created_at', { ascending: false });
      if (location && location !== 'all') {
        query = query.eq('location_id', location);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json(data.map(mapDbToItem));
      }
    } catch {
      // Fall through to memory
    }
  }

  if (location && location !== 'all') {
    return res.json(memoryInventory.filter((i) => i.locationId === location));
  }
  return res.json(memoryInventory);
});

app.post('/api/inventory', async (req: Request, res: Response) => {
  const body = req.body;
  const newItem: InventoryItem = {
    ...body,
    id: body.id || `inv-${Date.now()}`,
    lastCounted: 'Just now',
    movements: body.movements || [
      {
        id: `mv-${Date.now()}`,
        date: `${REFERENCE_TODAY} 08:20`,
        type: 'Manual Adjustment',
        delta: body.onHand,
        resultingQty: body.onHand,
        note: 'Initial SKU registration',
        actor: 'Admin',
      },
    ],
  };

  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapItemToDb(newItem);
      const { data, error } = await supabase.from('inventory_items').insert(dbRow).select().single();
      if (!error && data) {
        return res.status(201).json(mapDbToItem(data));
      }
      console.warn('Supabase insert inventory warning:', error?.message);
    } catch (err: any) {
      console.warn('Supabase insert error, falling back to memory:', err.message);
    }
  }

  memoryInventory = [newItem, ...memoryInventory];
  return res.status(201).json(newItem);
});

app.patch('/api/inventory/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapItemToDb(updates);
      delete dbRow.id;
      dbRow.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('inventory_items')
        .update(dbRow)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json(mapDbToItem(data));
      }
    } catch (err: any) {
      console.warn('Supabase update error:', err.message);
    }
  }

  memoryInventory = memoryInventory.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  const updated = memoryInventory.find((i) => i.id === id);
  return res.json(updated);
});

app.post('/api/inventory/:id/recount', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { onHand, parLevel, reorderPoint, note, actor = 'Maya R.' } = req.body;

  let currentItem = memoryInventory.find((i) => i.id === id);

  if (isSupabaseConfigured()) {
    try {
      const { data: dbItem } = await supabase.from('inventory_items').select('*').eq('id', id).single();
      if (dbItem) {
        currentItem = mapDbToItem(dbItem);
      }
    } catch {
      // Continue with currentItem
    }
  }

  if (!currentItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const delta = Number((onHand - currentItem.onHand).toFixed(2));
  const newMovement = {
    id: `mv-${Date.now()}`,
    date: `${REFERENCE_TODAY} 08:15`,
    type: 'Recount' as const,
    delta,
    resultingQty: onHand,
    note: note || 'Physical recount',
    actor,
  };

  const updatedMovements = [newMovement, ...(currentItem.movements || [])];
  const updatedItem: InventoryItem = {
    ...currentItem,
    onHand,
    parLevel: parLevel !== undefined ? parLevel : currentItem.parLevel,
    reorderPoint: reorderPoint !== undefined ? reorderPoint : currentItem.reorderPoint,
    lastCounted: 'Just now',
    movements: updatedMovements,
  };

  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapItemToDb(updatedItem);
      const { data, error } = await supabase
        .from('inventory_items')
        .update(dbRow)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return res.json(mapDbToItem(data));
      }
    } catch (err: any) {
      console.warn('Supabase recount update error:', err.message);
    }
  }

  memoryInventory = memoryInventory.map((i) => (i.id === id ? updatedItem : i));
  return res.json(updatedItem);
});

// -------------------------------------------------------------
// PURCHASE ORDERS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/orders', async (req: Request, res: Response) => {
  const location = req.query.location as string | undefined;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
      if (location && location !== 'all') {
        query = query.eq('location_id', location);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json(data.map(mapDbToOrder));
      }
    } catch {
      // Fall through to memory
    }
  }

  if (location && location !== 'all') {
    return res.json(memoryOrders.filter((o) => o.locationId === location));
  }
  return res.json(memoryOrders);
});

app.post('/api/orders', async (req: Request, res: Response) => {
  const body = req.body;
  const nextNum = 843 + memoryOrders.length;
  const newPO: PurchaseOrder = {
    id: body.id || `po-${Date.now()}`,
    poNumber: body.poNumber || `PO-2026-0${nextNum}`,
    supplierId: body.supplierId,
    locationId: body.locationId,
    status: body.status || 'Draft',
    createdAt: body.createdAt || REFERENCE_TODAY,
    expectedDelivery: body.expectedDelivery,
    notes: body.notes || undefined,
    items: body.items || [],
  };

  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapOrderToDb(newPO);
      const { data, error } = await supabase.from('purchase_orders').insert(dbRow).select().single();
      if (!error && data) {
        return res.status(201).json(mapDbToOrder(data));
      }
    } catch (err: any) {
      console.warn('Supabase create order error:', err.message);
    }
  }

  memoryOrders = [newPO, ...memoryOrders];
  return res.status(201).json(newPO);
});

app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return res.json(mapDbToOrder(data));
      }
    } catch (err: any) {
      console.warn('Supabase update status error:', err.message);
    }
  }

  memoryOrders = memoryOrders.map((po) => (po.id === id ? { ...po, status } : po));
  const updated = memoryOrders.find((po) => po.id === id);
  return res.json(updated);
});

app.post('/api/orders/:id/receive', async (req: Request, res: Response) => {
  const { id } = req.params;
  let targetPO = memoryOrders.find((p) => p.id === id);

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('purchase_orders').select('*').eq('id', id).single();
      if (data) {
        targetPO = mapDbToOrder(data);
      }
    } catch {
      // Continue
    }
  }

  if (!targetPO || targetPO.status === 'Received') {
    return res.status(400).json({ error: 'Order not found or already received' });
  }

  // Map received quantities
  const qtyByItemId = new Map<string, number>();
  targetPO.items.forEach((line) => {
    qtyByItemId.set(line.itemId, (qtyByItemId.get(line.itemId) ?? 0) + line.orderedQty);
  });

  // Update inventory items
  for (const [itemId, addedQty] of qtyByItemId.entries()) {
    let item = memoryInventory.find((i) => i.id === itemId);

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('inventory_items').select('*').eq('id', itemId).single();
        if (data) item = mapDbToItem(data);
      } catch {
        // Fall back
      }
    }

    if (item) {
      const nextQty = Number((item.onHand + addedQty).toFixed(2));
      const movement = {
        id: `mv-${Date.now()}-${item.id}`,
        date: `${REFERENCE_TODAY} 08:30`,
        type: 'Shipment Received' as const,
        delta: addedQty,
        resultingQty: nextQty,
        note: `${targetPO.poNumber} checked in`,
        actor: 'Maya R.',
      };
      const updatedMovements = [movement, ...(item.movements || [])];

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('inventory_items')
            .update({
              on_hand: nextQty,
              last_counted: 'Just now',
              movements: updatedMovements,
              updated_at: new Date().toISOString(),
            })
            .eq('id', itemId);
        } catch (err: any) {
          console.warn('Supabase stock update error:', err.message);
        }
      }

      memoryInventory = memoryInventory.map((i) =>
        i.id === itemId ? { ...i, onHand: nextQty, movements: updatedMovements } : i
      );
    }
  }

  // Update PO status to Received
  const updatedPO: PurchaseOrder = {
    ...targetPO,
    status: 'Received',
    receivedAt: REFERENCE_TODAY,
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('purchase_orders')
        .update({
          status: 'Received',
          received_at: REFERENCE_TODAY,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (err: any) {
      console.warn('Supabase order receive error:', err.message);
    }
  }

  memoryOrders = memoryOrders.map((po) => (po.id === id ? updatedPO : po));
  return res.json(updatedPO);
});

// -------------------------------------------------------------
// WASTE LOGS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/waste', async (req: Request, res: Response) => {
  const location = req.query.location as string | undefined;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('waste_logs').select('*').order('created_at', { ascending: false });
      if (location && location !== 'all') {
        query = query.eq('location_id', location);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json(data.map(mapDbToWaste));
      }
    } catch {
      // Fall through to memory
    }
  }

  if (location && location !== 'all') {
    return res.json(memoryWaste.filter((w) => w.locationId === location));
  }
  return res.json(memoryWaste);
});

app.post('/api/waste', async (req: Request, res: Response) => {
  const { itemId, quantity, reason, note, actor = 'Maya R.' } = req.body;

  let targetItem = memoryInventory.find((i) => i.id === itemId);
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('inventory_items').select('*').eq('id', itemId).single();
      if (data) targetItem = mapDbToItem(data);
    } catch {
      // Fall back
    }
  }

  if (!targetItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const actualDeducted = Math.min(targetItem.onHand, Number(quantity));
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
    reason,
    loggedAt: `${REFERENCE_TODAY} 08:35`,
    loggedBy: actor,
    note: note || undefined,
  };

  const nextQty = Number(Math.max(0, targetItem.onHand - actualDeducted).toFixed(2));
  const movement = {
    id: `mv-${Date.now()}`,
    date: `${REFERENCE_TODAY} 08:35`,
    type: 'Waste Logged' as const,
    delta: -actualDeducted,
    resultingQty: nextQty,
    note: `${reason}${note ? `: ${note}` : ''}`,
    actor,
  };
  const updatedMovements = [movement, ...(targetItem.movements || [])];

  if (isSupabaseConfigured()) {
    try {
      // Insert waste log
      await supabase.from('waste_logs').insert(mapWasteToDb(newEntry));
      // Update inventory onHand
      await supabase
        .from('inventory_items')
        .update({
          on_hand: nextQty,
          last_counted: 'Just now',
          movements: updatedMovements,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetItem.id);
    } catch (err: any) {
      console.warn('Supabase waste log insert error:', err.message);
    }
  }

  memoryWaste = [newEntry, ...memoryWaste];
  memoryInventory = memoryInventory.map((i) =>
    i.id === targetItem.id ? { ...i, onHand: nextQty, movements: updatedMovements } : i
  );

  return res.status(201).json({ wasteEntry: newEntry, updatedOnHand: nextQty });
});

// -------------------------------------------------------------
// SEED DATABASE ENDPOINT
// -------------------------------------------------------------
app.post('/api/seed', async (_req: Request, res: Response) => {
  if (!isSupabaseConfigured()) {
    memoryInventory = [...INITIAL_INVENTORY];
    memoryOrders = [...INITIAL_PURCHASE_ORDERS];
    memoryWaste = [...INITIAL_WASTE_LOGS];
    memorySuppliers = [...INITIAL_SUPPLIERS];
    return res.json({
      success: true,
      mode: 'memory',
      message: 'Memory state reset to initial seed data.',
    });
  }

  try {
    // 1. Seed suppliers
    for (const sup of INITIAL_SUPPLIERS) {
      await supabase.from('suppliers').upsert({
        id: sup.id,
        name: sup.name,
        category: sup.category,
        contact_name: sup.contactName,
        email: sup.email,
        phone: sup.phone,
        lead_time_days: sup.leadTimeDays,
        min_order_value: sup.minOrderValue,
        payment_terms: sup.paymentTerms,
        city: sup.city,
      });
    }

    // 2. Seed inventory
    for (const item of INITIAL_INVENTORY) {
      await supabase.from('inventory_items').upsert(mapItemToDb(item));
    }

    // 3. Seed orders
    for (const po of INITIAL_PURCHASE_ORDERS) {
      await supabase.from('purchase_orders').upsert(mapOrderToDb(po));
    }

    // 4. Seed waste
    for (const w of INITIAL_WASTE_LOGS) {
      await supabase.from('waste_logs').upsert(mapWasteToDb(w));
    }

    return res.json({
      success: true,
      mode: 'supabase',
      message: 'Successfully seeded Supabase database with initial Artisan Commerce data!',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// CUSTOMER RAG (RETRIEVAL-AUGMENTED GENERATION) ENDPOINTS
// -------------------------------------------------------------
app.post('/api/rag/query', async (req: Request, res: Response) => {
  const { query, location, history } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  // Get current inventory, suppliers, and purchase orders
  let currentInventory = memoryInventory;
  let currentSuppliers = memorySuppliers;
  let currentOrders = memoryOrders;

  if (isSupabaseConfigured()) {
    try {
      const { data: invData } = await supabase.from('inventory_items').select('*');
      if (invData && invData.length > 0) currentInventory = invData.map(mapDbToItem);
      const { data: supData } = await supabase.from('suppliers').select('*');
      if (supData && supData.length > 0) currentSuppliers = supData.map(mapDbToSupplier);
      const { data: orderData } = await supabase.from('purchase_orders').select('*');
      if (orderData && orderData.length > 0) currentOrders = orderData.map(mapDbToOrder);
    } catch {
      // Keep memory fallback
    }
  }

  try {
    const ragResult = await executeCustomerRAG(
      query,
      currentInventory,
      currentSuppliers,
      currentOrders,
      location,
      history
    );
    return res.json(ragResult);
  } catch (err: any) {
    return res.status(500).json({ error: 'RAG generation failed', details: err.message });
  }
});

app.get('/api/rag/knowledge', (_req: Request, res: Response) => {
  return res.json({
    corpus: KNOWLEDGE_CORPUS,
    totalDocuments: KNOWLEDGE_CORPUS.length,
    indexedInventoryCount: memoryInventory.length,
    indexedSuppliersCount: memorySuppliers.length,
  });
});

// Export Express app for Vercel Serverless / tests
export default app;

// Start Express server if not in Vercel Serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Artisan Commerce Backend Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(
      `⚡ Supabase Status: ${
        isSupabaseConfigured() ? '✅ Configured' : '⚠️ Not configured (Using Fallback Mode)'
      }`
    );
    console.log(`===============================================`);
  });
}
