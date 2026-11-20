import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_INVENTORY,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_WASTE_LOGS,
} from '../src/data/seedData.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('🌱 Starting Supabase seed for Artisan Commerce...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);

  // 1. Seed suppliers
  console.log('\n📦 Seeding suppliers...');
  for (const s of INITIAL_SUPPLIERS) {
    const { error } = await supabase.from('suppliers').upsert({
      id: s.id,
      name: s.name,
      category: s.category,
      contact_name: s.contactName,
      email: s.email,
      phone: s.phone,
      lead_time_days: s.leadTimeDays,
      min_order_value: s.minOrderValue,
      payment_terms: s.paymentTerms,
      city: s.city,
    });
    if (error) {
      console.error(`  ❌ Failed to seed supplier ${s.id}:`, error.message);
    } else {
      console.log(`  ✅ Supplier: ${s.name}`);
    }
  }

  // 2. Seed inventory
  console.log('\n📦 Seeding inventory items...');
  for (const item of INITIAL_INVENTORY) {
    const { error } = await supabase.from('inventory_items').upsert({
      id: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      location_id: item.locationId,
      supplier_id: item.supplierId,
      unit: item.unit,
      on_hand: item.onHand,
      par_level: item.parLevel,
      reorder_point: item.reorderPoint,
      unit_cost: item.unitCost,
      expiry_date: item.expiryDate || null,
      last_counted: item.lastCounted,
      storage_zone: item.storageZone,
      movements: item.movements,
    });
    if (error) {
      console.error(`  ❌ Failed to seed item ${item.sku}:`, error.message);
    } else {
      console.log(`  ✅ SKU: ${item.sku} - ${item.name}`);
    }
  }

  // 3. Seed purchase orders
  console.log('\n📦 Seeding purchase orders...');
  for (const po of INITIAL_PURCHASE_ORDERS) {
    const { error } = await supabase.from('purchase_orders').upsert({
      id: po.id,
      po_number: po.poNumber,
      supplier_id: po.supplierId,
      location_id: po.locationId,
      status: po.status,
      created_at: po.createdAt,
      expected_delivery: po.expectedDelivery,
      received_at: po.receivedAt || null,
      notes: po.notes || null,
      items: po.items,
    });
    if (error) {
      console.error(`  ❌ Failed to seed order ${po.poNumber}:`, error.message);
    } else {
      console.log(`  ✅ Order: ${po.poNumber} (${po.status})`);
    }
  }

  // 4. Seed waste logs
  console.log('\n📦 Seeding waste logs...');
  for (const w of INITIAL_WASTE_LOGS) {
    const { error } = await supabase.from('waste_logs').upsert({
      id: w.id,
      item_id: w.itemId,
      sku: w.sku,
      item_name: w.itemName,
      location_id: w.locationId,
      quantity: w.quantity,
      unit: w.unit,
      cost_impact: w.costImpact,
      reason: w.reason,
      logged_at: w.loggedAt,
      logged_by: w.loggedBy,
      note: w.note || null,
    });
    if (error) {
      console.error(`  ❌ Failed to seed waste ${w.id}:`, error.message);
    } else {
      console.log(`  ✅ Waste Log: ${w.sku} - ${w.reason}`);
    }
  }

  console.log('\n✨ Database seeding complete!');
}

runSeed().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
