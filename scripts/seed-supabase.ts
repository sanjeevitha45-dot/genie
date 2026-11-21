import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
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

  // 5. Seed Knowledge Base Embeddings (RAG System)
  console.log('\n🧠 Seeding Knowledge Base & Vector Embeddings...');
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let genAI: GoogleGenAI | null = null;
  if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
    try {
      genAI = new GoogleGenAI({ apiKey: geminiApiKey });
      console.log('  🔑 Gemini API key detected: Real vector embeddings will be generated via text-embedding-004.');
    } catch (e: any) {
      console.warn('  ⚠️ Could not initialize GoogleGenAI for embeddings:', e.message);
    }
  }

  const KNOWLEDGE_SEED_ITEMS = [
    {
      id: 'kb-loc-roastery',
      title: 'Flagship Roastery — Hours & Services',
      category: 'location',
      content: 'Address: 412 Origin Way, Oakland, CA. Phone: (510) 891-2040. Hours: Monday-Friday 6:30 AM – 6:00 PM, Saturday-Sunday 7:00 AM – 7:00 PM. Features: On-site Loring S35 roaster, public cupping flights every Thursday at 11 AM, full pour-over bar, retail whole bean bag counter with complimentary custom grinding. Wholesale will-call pickups at Bay 2.',
      metadata: { locationId: 'roastery', address: '412 Origin Way, Oakland, CA', screen: 'inventory' },
    },
    {
      id: 'kb-loc-downtown',
      title: 'Downtown Café — Financial District Location',
      category: 'location',
      content: 'Address: 88 Market Plaza, San Francisco, CA. Phone: (415) 304-9921. Hours: Monday-Friday 6:00 AM – 5:00 PM, Saturday 7:00 AM – 4:00 PM, Sunday Closed. Offerings: Dual Synesso MVP hydra espresso machines, draft nitro cold brew, daily fresh pastry delivery from Levain Bakehouse at 6:00 AM.',
      metadata: { locationId: 'downtown', address: '88 Market Plaza, San Francisco, CA', screen: 'inventory' },
    },
    {
      id: 'kb-loc-westside',
      title: 'Westside Bakery & Tasting Room',
      category: 'location',
      content: 'Address: 1420 4th Street, Berkeley, CA. Phone: (510) 612-8871. Hours: Wednesday-Sunday 7:00 AM – 3:00 PM, Monday-Tuesday Closed for production bake prep. Offerings: In-house laminated croissants, almond bostock, country sourdough, and seasonal drinks.',
      metadata: { locationId: 'westside', address: '1420 4th Street, Berkeley, CA', screen: 'inventory' },
    },
    {
      id: 'kb-diet-dairy',
      title: 'Milk Options & Allergen Safety',
      category: 'allergen',
      content: 'Dairy: Pasture-Raised Organic Whole Milk and Nonfat Milk from Straus & Meadow (Petaluma, CA). Plant Milks: 1) Barista Edition Oat Milk — 100% Certified Gluten-Free oats, nut-free, vegan. 2) Cold-Pressed Barista Almond Milk — Contains almonds, dairy-free. Baristas use dedicated steam wands and sanitizing pitchers upon allergy request.',
      metadata: { allergens: ['dairy', 'gluten-free', 'tree-nuts'], screen: 'inventory' },
    },
    {
      id: 'kb-pol-returns',
      title: 'Returns, Exchanges & Handcrafted Drink Guarantee',
      category: 'policy',
      content: 'Handcrafted Beverages: If any beverage does not taste perfect or meet your temperature preference, our baristas will gladly remake it immediately or offer an alternative free of charge. Retail Coffee Bags: Unopened whole bean bags may be exchanged or returned for store credit within 14 days of roast date.',
      metadata: { policyType: 'returns_and_remakes', screen: 'customer-rag' },
    },
    {
      id: 'kb-pol-wholesale',
      title: 'Wholesale Accounts & Bulk Pre-Orders',
      category: 'policy',
      content: 'Wholesale Ordering: Minimum opening order value is $250. Standard roasting schedule: Monday and Wednesday roasts, ships via local courier or FedEx ground within 24-48 hours. Terms: Net 15 or Net 30 upon approved credit application. Catering / Large Pastry Orders: Any pastry orders over 24 units require 48 hours advance notice.',
      metadata: { policyType: 'wholesale_terms', screen: 'suppliers' },
    },
    {
      id: 'kb-inv-ethiopia',
      title: 'Ethiopia Guji Uraga Natural (COF-ETH-001)',
      category: 'inventory',
      content: 'Product: Ethiopia Guji Uraga Natural | SKU: COF-ETH-001 | Category: Roasted Coffee | Location: ROASTERY | Stock: 18.5 kg available (Par: 40 kg, Reorder: 15 kg) | Unit Price: $24.50/kg | Tasting Notes: Bergamot, candied peach, jasmine tea. Roasted by Hearth & Origin in Oakland.',
      metadata: { sku: 'COF-ETH-001', itemId: 'inv-101', locationId: 'roastery', screen: 'inventory' },
    },
    {
      id: 'kb-inv-colombia',
      title: 'Colombia Huila Pink Bourbon (COF-COL-002)',
      category: 'inventory',
      content: 'Product: Colombia Huila Pink Bourbon | SKU: COF-COL-002 | Category: Roasted Coffee | Location: DOWNTOWN | Stock: 4.0 kg available (Par: 25 kg, Reorder: 8 kg) | Unit Price: $26.00/kg | Tasting Notes: Pink grapefruit, wildflower honey, sugarcane sweetness. Roasted by Hearth & Origin.',
      metadata: { sku: 'COF-COL-002', itemId: 'inv-102', locationId: 'downtown', screen: 'inventory' },
    },
    {
      id: 'kb-inv-oatmilk',
      title: 'Barista Edition Oat Milk (MILK-BAR-001)',
      category: 'inventory',
      content: 'Product: Barista Edition Oat Milk (Case/12) | SKU: MILK-BAR-001 | Category: Dairy & Alt | Location: DOWNTOWN | Stock: 3 cases available (Par: 15 cases) | Unit Price: $38.00/case | 100% Certified Gluten-Free, vegan, zero added sugar. Supplied by Straus & Meadow.',
      metadata: { sku: 'MILK-BAR-001', itemId: 'inv-103', locationId: 'downtown', screen: 'inventory' },
    },
    {
      id: 'kb-inv-croissant',
      title: 'Artisan Butter Croissant (PAS-CRS-001)',
      category: 'inventory',
      content: 'Product: Artisan Butter Croissant (Tray/12) | SKU: PAS-CRS-001 | Category: Bakery & Pastry | Location: DOWNTOWN | Stock: 1 tray available (Par: 8 trays) | Unit Price: $28.50/tray | Fresh morning bake by Tartine & Levain Bakehouse.',
      metadata: { sku: 'PAS-CRS-001', itemId: 'inv-104', locationId: 'downtown', screen: 'inventory' },
    },
    {
      id: 'kb-po-841',
      title: 'Purchase Order PO-2026-0841',
      category: 'order',
      content: 'Purchase Order: PO-2026-0841 | Supplier: Hearth & Origin Roasters | Destination: Downtown Café | Status: In Transit | Expected Delivery: 2026-11-19 | Items: 15 kg Colombia Huila Pink Bourbon ($26.00/kg).',
      metadata: { poNumber: 'PO-2026-0841', poId: 'po-841', locationId: 'downtown', screen: 'orders' },
    },
    {
      id: 'kb-po-842',
      title: 'Purchase Order PO-2026-0842',
      category: 'order',
      content: 'Purchase Order: PO-2026-0842 | Supplier: Straus & Meadow Creamery | Destination: Downtown Café | Status: Ordered | Expected Delivery: 2026-11-19 | Items: 10 cases Barista Edition Oat Milk ($38.00/case).',
      metadata: { poNumber: 'PO-2026-0842', poId: 'po-842', locationId: 'downtown', screen: 'orders' },
    },
  ];

  for (const item of KNOWLEDGE_SEED_ITEMS) {
    let embedding: number[] | null = null;
    if (genAI) {
      try {
        const textToEmbed = `${item.title}\n${item.content}`;
        const embRes: any = await genAI.models.embedContent({
          model: 'gemini-embedding-001',
          contents: textToEmbed,
          config: { outputDimensionality: 768 },
        });
        const values = embRes?.embedding?.values || embRes?.embeddings?.[0]?.values;
        if (Array.isArray(values)) {
          embedding = values;
        }
      } catch (embErr: any) {
        console.warn(`  ⚠️ Could not compute vector for ${item.id}:`, embErr.message);
      }
    }

    const payload: any = {
      id: item.id,
      title: item.title,
      category: item.category,
      content: item.content,
      metadata: item.metadata,
      updated_at: new Date().toISOString(),
    };
    if (embedding) {
      payload.embedding = embedding;
    }

    const { error } = await supabase.from('knowledge_embeddings').upsert(payload);
    if (error) {
      console.error(`  ❌ Failed to seed knowledge item ${item.id}:`, error.message);
    } else {
      console.log(`  ✅ Knowledge Item: ${item.title} [${item.category}]${embedding ? ' (Vectorized 768d)' : ''}`);
    }
  }

  console.log('\n✨ Database seeding complete!');
}

runSeed().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
