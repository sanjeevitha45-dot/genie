-- ==============================================================================
-- ARTISAN COMMERCE - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- to create all required tables, indexes, Row Level Security (RLS) policies,
-- and seed data for the café & retail inventory management system.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES IF CLEAN SLATE NEEDED (OPTIONAL)
-- DROP TABLE IF EXISTS waste_logs CASCADE;
-- DROP TABLE IF EXISTS purchase_orders CASCADE;
-- DROP TABLE IF EXISTS inventory_items CASCADE;
-- DROP TABLE IF EXISTS suppliers CASCADE;

-- 3. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 1,
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY ITEMS TABLE
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location_id TEXT NOT NULL, -- 'roastery' | 'downtown' | 'westside'
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  unit TEXT NOT NULL, -- 'kg' | 'bags' | 'bottles' | 'L' | 'cases' | 'trays'
  on_hand NUMERIC(10, 2) NOT NULL DEFAULT 0,
  par_level NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reorder_point NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  expiry_date TEXT, -- YYYY-MM-DD
  last_counted TEXT DEFAULT 'Just now',
  storage_zone TEXT,
  movements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  location_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft' | 'Ordered' | 'In Transit' | 'Received'
  created_at TEXT NOT NULL,
  expected_delivery TEXT NOT NULL,
  received_at TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WASTE LOGS TABLE
CREATE TABLE IF NOT EXISTS waste_logs (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  sku TEXT NOT NULL,
  item_name TEXT NOT NULL,
  location_id TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  cost_impact NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  logged_by TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES FOR HIGH-VELOCITY QUERYING
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_orders_location ON purchase_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_waste_location ON waste_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_waste_item_id ON waste_logs(item_id);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for application operations (with anon / authenticated role)
CREATE POLICY "Allow all operations on suppliers"
  ON suppliers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on inventory_items"
  ON inventory_items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on purchase_orders"
  ON purchase_orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on waste_logs"
  ON waste_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. SEED DATA
-- Insert Suppliers
INSERT INTO suppliers (id, name, category, contact_name, email, phone, lead_time_days, min_order_value, payment_terms, city)
VALUES
  ('sup-hearth', 'Hearth & Origin Roasters', 'Single-Origin & Espresso Blends', 'Clara Vance', 'orders@hearthorigin.co', '(415) 890-3314', 2, 250.00, 'Net 15', 'Oakland, CA'),
  ('sup-meadow', 'Straus & Meadow Creamery', 'Organic Dairy & Barista Oat', 'Marcus Lindqvist', 'dispatch@meadowcreamery.com', '(707) 542-8190', 1, 120.00, 'Net 7', 'Petaluma, CA'),
  ('sup-tartine', 'Levain Artisan Bakehouse', 'Laminated Viennoiserie & Loaves', 'Elena Moreau', 'wholesale@levainbake.co', '(510) 612-4409', 1, 150.00, 'Net 7', 'Berkeley, CA'),
  ('sup-botanical', 'Komorebi Botanical Importers', 'Single-Estate Ceremonial Teas', 'Kenji Takahashi', 'import@komorebitea.jp', '(415) 309-8812', 4, 300.00, 'Net 30', 'San Francisco, CA'),
  ('sup-craftpack', 'EcoCraft Packaging Co.', 'Compostable Bags, Cups & Liners', 'David Chen', 'sales@ecocraftpack.com', '(510) 902-1144', 3, 200.00, 'Net 30', 'San Leandro, CA')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Inventory Items
INSERT INTO inventory_items (id, sku, name, category, location_id, supplier_id, unit, on_hand, par_level, reorder_point, unit_cost, expiry_date, last_counted, storage_zone, movements)
VALUES
  (
    'inv-101', 'COF-ETH-001', 'Ethiopia Guji Uraga Natural', 'Roasted Coffee', 'roastery', 'sup-hearth', 'kg',
    18.5, 40.0, 15.0, 24.50, '2026-12-15', '2026-11-18 07:30', 'Green & Roast Storage Bay A',
    '[{"id": "mv-101-1", "date": "2026-11-18 07:30", "type": "Recount", "delta": -1.5, "resultingQty": 18.5, "note": "Weekly physical balance recount", "actor": "Maya R."}, {"id": "mv-101-2", "date": "2026-11-16 11:20", "type": "Shipment Received", "delta": 10.0, "resultingQty": 20.0, "note": "PO-2026-0839 inbound fulfillment", "actor": "Liam K."}]'::jsonb
  ),
  (
    'inv-102', 'COF-COL-002', 'Colombia Huila Pink Bourbon', 'Roasted Coffee', 'downtown', 'sup-hearth', 'kg',
    4.0, 25.0, 8.0, 26.00, '2026-12-20', '2026-11-18 07:45', 'Retail Drawer & Hopper Station',
    '[{"id": "mv-102-1", "date": "2026-11-18 07:45", "type": "Recount", "delta": 0, "resultingQty": 4.0, "note": "Morning pre-open count", "actor": "Julian T."}]'::jsonb
  ),
  (
    'inv-103', 'MILK-BAR-001', 'Barista Edition Oat Milk (Case/12)', 'Dairy & Alt', 'downtown', 'sup-meadow', 'cases',
    3.0, 15.0, 6.0, 38.00, '2026-11-20', '2026-11-18 07:15', 'Under-Counter Chiller 2',
    '[{"id": "mv-103-1", "date": "2026-11-18 07:15", "type": "Recount", "delta": -1.0, "resultingQty": 3.0, "note": "Morning prep recount", "actor": "Julian T."}]'::jsonb
  ),
  (
    'inv-104', 'PAS-CRS-001', 'Artisan Butter Croissant (Tray/12)', 'Bakery & Pastry', 'downtown', 'sup-tartine', 'trays',
    1.0, 8.0, 3.0, 28.50, '2026-11-19', '2026-11-18 06:45', 'Front Display Case',
    '[{"id": "mv-104-1", "date": "2026-11-18 06:45", "type": "Shipment Received", "delta": 2.0, "resultingQty": 2.0, "note": "Daily fresh morning bake delivery", "actor": "Julian T."}]'::jsonb
  ),
  (
    'inv-105', 'TEA-MAT-001', 'Uji Ceremonial Grade Matcha', 'Tea & Botanicals', 'roastery', 'sup-botanical', 'bags',
    12.0, 16.0, 6.0, 48.00, '2027-04-10', '2026-11-17 14:00', 'Dry Goods Dry-Room 1',
    '[{"id": "mv-105-1", "date": "2026-11-17 14:00", "type": "Recount", "delta": 0, "resultingQty": 12.0, "note": "Bi-weekly dry pantry audit", "actor": "Maya R."}]'::jsonb
  ),
  (
    'inv-106', 'PCK-CUP-012', '12oz Compostable Hot Cups (Sleeve/50)', 'Packaging', 'westside', 'sup-craftpack', 'cases',
    8.0, 20.0, 8.0, 44.00, NULL, '2026-11-16 16:30', 'Backroom Mezzanine Shelf D',
    '[{"id": "mv-106-1", "date": "2026-11-16 16:30", "type": "Recount", "delta": 0, "resultingQty": 8.0, "note": "Standard inventory cycle count", "actor": "Liam K."}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Purchase Orders
INSERT INTO purchase_orders (id, po_number, supplier_id, location_id, status, created_at, expected_delivery, received_at, notes, items)
VALUES
  (
    'po-841', 'PO-2026-0841', 'sup-hearth', 'downtown', 'In Transit', '2026-11-17', '2026-11-19', NULL,
    'Weekly espresso bar stock replenishment before peak weekend rush.',
    '[{"itemId": "inv-102", "sku": "COF-COL-002", "itemName": "Colombia Huila Pink Bourbon", "unit": "kg", "orderedQty": 15, "unitCost": 26.00}]'::jsonb
  ),
  (
    'po-842', 'PO-2026-0842', 'sup-meadow', 'downtown', 'Ordered', '2026-11-18', '2026-11-19', NULL,
    'Urgent dairy replenishment for cold bar and latte station.',
    '[{"itemId": "inv-103", "sku": "MILK-BAR-001", "itemName": "Barista Edition Oat Milk (Case/12)", "unit": "cases", "orderedQty": 10, "unitCost": 38.00}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Waste Logs
INSERT INTO waste_logs (id, item_id, sku, item_name, location_id, quantity, unit, cost_impact, reason, logged_at, logged_by, note)
VALUES
  ('w-501', 'inv-102', 'COF-COL-002', 'Colombia Huila Pink Bourbon', 'downtown', 0.45, 'kg', 11.70, 'Dial-In / Calibration', '2026-11-18 07:10', 'Maya R.', 'Morning Mythos grinder burr seasoning after deep clean'),
  ('w-502', 'inv-104', 'PAS-CRS-001', 'Artisan Butter Croissant (Tray/12)', 'downtown', 1.0, 'trays', 28.50, 'Over-Prep / End of Day', '2026-11-17 19:15', 'Julian T.', 'Unsold display pastries collected for local community compost')
ON CONFLICT (id) DO NOTHING;
