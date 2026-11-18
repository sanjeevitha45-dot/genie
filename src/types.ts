export type NavScreen =
  | 'inventory'
  | 'orders'
  | 'par-expiry'
  | 'waste'
  | 'suppliers';

export type LocationId = 'all' | 'roastery' | 'downtown' | 'westside';

export type ItemCategory =
  | 'Roasted Coffee'
  | 'Dairy & Alt'
  | 'Bakery & Pastry'
  | 'Tea & Botanicals'
  | 'Packaging';

export type StockHealth = 'optimal' | 'low' | 'critical' | 'expiring';

export type POStatus = 'Draft' | 'Ordered' | 'In Transit' | 'Received';

export type WasteReason =
  | 'Expired Batch'
  | 'Dial-In / Calibration'
  | 'Damaged Packaging'
  | 'Over-Prep / End of Day';

export interface StockMovement {
  id: string;
  date: string;
  type: 'Recount' | 'Shipment Received' | 'Waste Logged' | 'Manual Adjustment';
  delta: number;
  resultingQty: number;
  note: string;
  actor: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: ItemCategory;
  locationId: Exclude<LocationId, 'all'>;
  supplierId: string;
  unit: 'kg' | 'bags' | 'bottles' | 'L' | 'cases' | 'trays';
  onHand: number;
  parLevel: number;
  reorderPoint: number;
  unitCost: number;
  expiryDate?: string; // ISO YYYY-MM-DD
  lastCounted: string; // ISO timestamp or YYYY-MM-DD HH:mm
  storageZone: string;
  movements: StockMovement[];
}

export interface POLineItem {
  itemId: string;
  sku: string;
  itemName: string;
  unit: InventoryItem['unit'];
  orderedQty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  locationId: Exclude<LocationId, 'all'>;
  status: POStatus;
  createdAt: string;
  expectedDelivery: string;
  receivedAt?: string;
  notes?: string;
  items: POLineItem[];
}

export interface WasteEntry {
  id: string;
  itemId: string;
  sku: string;
  itemName: string;
  locationId: Exclude<LocationId, 'all'>;
  quantity: number;
  unit: InventoryItem['unit'];
  costImpact: number;
  reason: WasteReason;
  loggedAt: string;
  loggedBy: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  minOrderValue: number;
  paymentTerms: string;
  city: string;
}
