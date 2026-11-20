import { GoogleGenAI } from '@google/genai';
import { InventoryItem, KnowledgeDoc, RAGContextChunk, RAGQueryResponse, Supplier } from '../src/types.js';

// Base Knowledge Base Documents (Locations, Policies, Dietary, Wholesale)
export const KNOWLEDGE_CORPUS: KnowledgeDoc[] = [
  {
    id: 'kb-loc-roastery',
    title: 'Flagship Roastery — Hours & Services',
    category: 'Locations & Hours',
    summary: 'Central roasting lab, espresso bar, and wholesale distribution hub in Oakland.',
    body: 'Address: 412 Origin Way, Oakland, CA. Phone: (510) 891-2040. Hours: Monday-Friday 6:30 AM – 6:00 PM, Saturday-Sunday 7:00 AM – 7:00 PM. Features: On-site Loring S35 roaster, public cupping flights every Thursday at 11 AM, full pour-over bar, retail whole bean bag counter with complimentary custom grinding to espresso, AeroPress, drip, or cold brew. Wholesale will-call pickups available at Bay 2.',
    lastUpdated: '2026-11-18',
  },
  {
    id: 'kb-loc-downtown',
    title: 'Downtown Café — Financial District Location',
    category: 'Locations & Hours',
    summary: 'High-volume coffee bar serving commuters and specialty coffee lovers in SF.',
    body: 'Address: 88 Market Plaza, San Francisco, CA. Phone: (415) 304-9921. Hours: Monday-Friday 6:00 AM – 5:00 PM, Saturday 7:00 AM – 4:00 PM, Sunday Closed. Offerings: Dual Synesso MVP hydra espresso machines, draft nitro cold brew, daily fresh viennoiserie from Levain Artisan Bakehouse delivered at 6:00 AM. Fast mobile pickup counter available.',
    lastUpdated: '2026-11-18',
  },
  {
    id: 'kb-loc-westside',
    title: 'Westside Bakery & Tasting Room',
    category: 'Locations & Hours',
    summary: 'Artisan sourdough bakery and specialty café in Berkeley.',
    body: 'Address: 1420 4th Street, Berkeley, CA. Phone: (510) 612-8871. Hours: Wednesday-Sunday 7:00 AM – 3:00 PM, Monday-Tuesday Closed for production bake prep. Offerings: In-house laminated sourdough croissants, twice-baked almond bostock, morning buns, sourdough country loaves, and full seasonal drink menu. Outdoor heated patio seating.',
    lastUpdated: '2026-11-18',
  },
  {
    id: 'kb-diet-dairy',
    title: 'Milk Options & Allergen Safety',
    category: 'Dietary & Allergens',
    summary: 'Comprehensive dairy and plant-based milk standards, allergens, and dietary certifications.',
    body: 'Dairy: Pasture-Raised Organic Whole Milk and Nonfat Milk from Straus & Meadow Creamery (Petaluma, CA). Pasteurized, non-homogenized, kosher certified, contains lactose. Plant Milks: 1) Barista Edition Oat Milk by Straus & Meadow — Certified 100% Gluten-Free oats, zero added sugar, nut-free, vegan. 2) Cold-Pressed Barista Almond Milk — Contains almonds, dairy-free, vegan, no carrageenan. Cross-contamination protocol: Steam wands are purged and wiped with dedicated sanitizing cloths between dairy and plant milks; dedicated pitchers used for gluten-free oat milk upon customer request.',
    lastUpdated: '2026-11-18',
  },
  {
    id: 'kb-diet-pastry',
    title: 'Bakery Ingredients & Allergen Information',
    category: 'Dietary & Allergens',
    summary: 'Allergen warnings, flour origins, and vegan options across our bakery selection.',
    body: 'All viennoiserie items (Cultured Butter Croissant, Pain au Chocolat, Kouign-Amann) contain dairy (European cultured butter 84% fat) and wheat gluten (unbleached organic King Arthur flour). The Almond Bostock contains tree nuts (sliced almonds, almond frangipane). Vegan & Dairy-Free Daily Option: Roasted Pecan Morning Scone (made with organic coconut oil and oat milk). All items are baked in a shared bakery facility handling eggs, dairy, wheat, tree nuts, and sesame.',
    lastUpdated: '2026-11-18',
  },
  {
    id: 'kb-pol-returns',
    title: 'Returns, Exchanges & Handcrafted Drink Guarantee',
    category: 'Policies',
    summary: 'Customer satisfaction policies for retail coffee bags, merchandise, and prepared beverages.',
    body: 'Handcrafted Beverages: If any beverage does not taste perfect or meet your temperature preference, our baristas will gladly remake it immediately or offer an alternative free of charge. Retail Coffee Bags: Unopened whole bean bags may be exchanged or returned for store credit within 14 days of roast date with proof of purchase. Merchandise & Brew Gear: 30-day return policy for unused gear in original packaging. Gift Cards: Never expire and have zero maintenance fees.',
    lastUpdated: '2026-11-18',
  },
  {
    id: 'kb-pol-wholesale',
    title: 'Wholesale Accounts & Bulk Pre-Orders',
    category: 'Wholesale',
    summary: 'Guidelines for wholesale accounts, office coffee subscriptions, and large event catering.',
    body: 'Wholesale Ordering: Minimum opening order value is $250. Standard roasting schedule: Monday and Wednesday roasts, ships via local courier or FedEx ground within 24-48 hours. Terms: Net 15 or Net 30 upon approved credit application. Catering / Large Pastry Orders: Any pastry orders over 24 units require 48 hours advance notice submitted to orders@artisancommerce.internal or via the website pre-order form. 5-gallon Cold Brew Keg rentals require a refundable $50 shell deposit.',
    lastUpdated: '2026-11-18',
  },
  {
    id: 'kb-origin-hearth',
    title: 'Hearth & Origin Roasters — Coffee Sourcing & Ethical Standards',
    category: 'Products',
    summary: 'Single-origin green coffee sourcing philosophy and relationship roasters.',
    body: 'All coffees roasted by Hearth & Origin in Oakland are 100% ethically sourced through direct trade and transparent origin contracts paying at least 60% above Fair Trade minimums. Flagship Offerings: 1) Ethiopia Guji Uraga: Natural process, heirloom varieties grown at 2,050m. Notes of bergamot, candied peach, and jasmine tea. 2) Colombia Huila Pink Bourbon: Fully washed with 36-hour extended dry fermentation. Notes of pink grapefruit, wildflower honey, and sugarcane. 3) Velvet Canopy Blend: Brazil Cerrado + Colombia Huila, medium roast with milk chocolate, hazelnut, and brown sugar notes.',
    lastUpdated: '2026-11-18',
  },
];

// Helper: Normalize query string for keyword search
function cleanTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// -------------------------------------------------------------
// RETRIEVAL ENGINE: Finds matching knowledge chunks & live inventory
// -------------------------------------------------------------
export function retrieveContextChunks(
  query: string,
  inventory: InventoryItem[],
  suppliers: Supplier[],
  filterLocation?: string
): RAGContextChunk[] {
  const queryTerms = cleanTerms(query);
  const qLower = query.toLowerCase();
  const chunks: RAGContextChunk[] = [];

  // 1. Search Static Knowledge Base (Policies, Locations, Dietary)
  for (const doc of KNOWLEDGE_CORPUS) {
    let score = 0;
    const docTerms = cleanTerms(`${doc.title} ${doc.summary} ${doc.body}`);

    for (const term of queryTerms) {
      if (doc.title.toLowerCase().includes(term)) score += 35;
      else if (doc.summary.toLowerCase().includes(term)) score += 20;
      else if (docTerms.includes(term)) score += 10;
    }

    // Boost based on specific customer intent
    if ((qLower.includes('hour') || qLower.includes('open') || qLower.includes('close')) && doc.category === 'Locations & Hours') {
      score += 30;
    }
    if ((qLower.includes('gluten') || qLower.includes('oat') || qLower.includes('dairy') || qLower.includes('vegan') || qLower.includes('allergy')) && doc.category === 'Dietary & Allergens') {
      score += 40;
    }
    if ((qLower.includes('return') || qLower.includes('refund') || qLower.includes('remake') || qLower.includes('exchange')) && doc.category === 'Policies') {
      score += 40;
    }

    if (score > 15) {
      chunks.push({
        id: doc.id,
        category: doc.category.toLowerCase().includes('location')
          ? 'location'
          : doc.category.toLowerCase().includes('policy')
          ? 'policy'
          : doc.category.toLowerCase().includes('allergen')
          ? 'allergen'
          : 'policy',
        title: doc.title,
        content: doc.body,
        relevanceScore: Math.min(99, Math.round(score)),
        metadata: { category: doc.category, summary: doc.summary },
      });
    }
  }

  // 2. Search Live Inventory Ledger
  for (const item of inventory) {
    if (filterLocation && filterLocation !== 'all' && item.locationId !== filterLocation) {
      continue;
    }

    let score = 0;
    const nameLower = item.name.toLowerCase();
    const skuLower = item.sku.toLowerCase();

    // Exact SKU match
    if (qLower.includes(skuLower)) {
      score += 85;
    }

    for (const term of queryTerms) {
      if (nameLower.includes(term)) score += 25;
      if (item.category.toLowerCase().includes(term)) score += 15;
      if (item.locationId.includes(term)) score += 20;
    }

    // Specific item inquiries (e.g. coffee, milk, croissant, matcha)
    if (qLower.includes('stock') || qLower.includes('available') || qLower.includes('have') || qLower.includes('left') || qLower.includes('price') || qLower.includes('cost')) {
      if (score > 10) score += 20;
    }

    if (score > 20) {
      const stockStatus = item.onHand <= 0 ? 'Out of stock' : item.onHand <= item.reorderPoint ? `Low stock (${item.onHand} ${item.unit} remaining)` : `In stock (${item.onHand} ${item.unit} available)`;
      const sup = suppliers.find((s) => s.id === item.supplierId);

      chunks.push({
        id: `chunk-inv-${item.id}`,
        category: 'inventory',
        title: `${item.name} (${item.sku})`,
        content: `Product: ${item.name} | SKU: ${item.sku} | Category: ${item.category} | Store Location: ${item.locationId.toUpperCase()} | Stock Level: ${stockStatus} (onHand: ${item.onHand} ${item.unit}, Par: ${item.parLevel}) | Unit Price/Cost: $${item.unitCost.toFixed(2)} per ${item.unit}${item.expiryDate ? ` | Expiry Date: ${item.expiryDate}` : ''} | Storage Zone: ${item.storageZone}${sup ? ` | Roaster/Supplier: ${sup.name}` : ''}`,
        relevanceScore: Math.min(99, Math.round(score)),
        metadata: {
          sku: item.sku,
          onHand: item.onHand,
          unit: item.unit,
          locationId: item.locationId,
          unitCost: item.unitCost,
        },
      });
    }
  }

  // 3. Search Suppliers
  for (const s of suppliers) {
    let score = 0;
    const sNameLower = s.name.toLowerCase();
    for (const term of queryTerms) {
      if (sNameLower.includes(term)) score += 30;
      if (s.category.toLowerCase().includes(term)) score += 15;
    }
    if (score > 20) {
      chunks.push({
        id: `chunk-sup-${s.id}`,
        category: 'supplier',
        title: `Supplier: ${s.name}`,
        content: `Supplier: ${s.name} | Specialty: ${s.category} | Contact: ${s.contactName} (${s.email}, ${s.phone}) | City: ${s.city} | Lead Time: ${s.leadTimeDays} days | Min Order: $${s.minOrderValue} | Terms: ${s.paymentTerms}`,
        relevanceScore: Math.min(95, Math.round(score)),
        metadata: { leadTimeDays: s.leadTimeDays, minOrderValue: s.minOrderValue },
      });
    }
  }

  // Sort descending by relevance score
  chunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return top 6 most relevant context chunks
  return chunks.slice(0, 6);
}

// -------------------------------------------------------------
// LOCAL FALLBACK SYNTHESIZER: Produces grounded response when GEMINI_API_KEY is unset
// -------------------------------------------------------------
function synthesizeLocalGroundedResponse(query: string, chunks: RAGContextChunk[]): string {
  if (chunks.length === 0) {
    return `Thank you for reaching out to Artisan Commerce! I couldn't find specific live records matching "${query}" in our inventory ledger or policy directory.\n\nCould you specify which store location (Flagship Roastery, Downtown Café, or Westside Bakery) or item you are inquiring about? Our team will be delighted to assist!`;
  }

  const primaryChunk = chunks[0];
  const qLower = query.toLowerCase();

  // Stock Inquiry Response
  if (primaryChunk.category === 'inventory') {
    const meta = primaryChunk.metadata || {};
    const itemName = primaryChunk.title;
    const onHand = meta.onHand ?? 0;
    const unit = meta.unit || 'units';
    const loc = meta.locationId ? meta.locationId.toUpperCase() : 'our stores';

    if (onHand > 0) {
      return `Hello! We've checked our live ledger for you:\n\n**${itemName}** is currently **in stock** at our **${loc}** location with **${onHand} ${unit}** available (priced at $${meta.unitCost?.toFixed(2) ?? '0.00'} per ${unit}).\n\nIf you'd like us to hold this or prepare a custom grind or bulk order, feel free to drop by or contact the bar directly!`;
    } else {
      return `Hello! Regarding **${itemName}**:\n\nIt is currently **temporarily out of stock** at **${loc}**. Our next inbound roasting fulfillment is scheduled, and you can also check our other locations or sign up for a restock notification!`;
    }
  }

  // Allergen & Dietary Response
  if (primaryChunk.category === 'allergen' || qLower.includes('gluten') || qLower.includes('oat') || qLower.includes('dairy') || qLower.includes('vegan')) {
    return `Hello! Thank you for checking regarding dietary options and ingredients.\n\nAccording to our beverage & bakery standards:\n• **Oat Milk**: Our Barista Edition Oat Milk (by Straus & Meadow) is **100% Certified Gluten-Free**, vegan, nut-free, and contains zero added sugars.\n• **Dairy**: We serve organic, pasture-raised non-homogenized whole milk.\n• **Cross-Contamination**: Our baristas use designated sanitizing procedures and dedicated steaming pitchers upon request.\n\nPlease let your barista know when ordering so we can accommodate you with extra care!`;
  }

  // Hours & Location Response
  if (primaryChunk.category === 'location' || qLower.includes('hour') || qLower.includes('open') || qLower.includes('where')) {
    return `Hello! Here are the details for **${primaryChunk.title}**:\n\n${primaryChunk.content}\n\nWe look forward to welcoming you in! Let us know if you need parking directions or mobile pickup information.`;
  }

  // Policy & Return Response
  if (primaryChunk.category === 'policy') {
    return `Hello! Here is our policy regarding your inquiry:\n\n${primaryChunk.content}\n\nOur top priority is ensuring you enjoy every cup and roast. Please feel free to bring in your receipt or reach out to our management if you need further assistance!`;
  }

  // General grounded synthesis
  const facts = chunks.slice(0, 3).map((c) => `• **${c.title}**: ${c.content}`).join('\n\n');
  return `Hello! Based on our live store operations knowledge base:\n\n${facts}\n\nPlease let us know if you have any further questions or if you'd like us to assist with an order!`;
}

// -------------------------------------------------------------
// GENERATION ENGINE: Coordinates Retrieval + Neural/Local Synthesis
// -------------------------------------------------------------
export async function executeCustomerRAG(
  query: string,
  inventory: InventoryItem[],
  suppliers: Supplier[],
  filterLocation?: string
): Promise<RAGQueryResponse> {
  const chunks = retrieveContextChunks(query, inventory, suppliers, filterLocation);
  const apiKey = process.env.GEMINI_API_KEY;

  const suggestedFollowUps: string[] = [
    'Check availability at another location',
    'What non-dairy milk options are gluten-free?',
    'What are the weekend operating hours?',
    'What is your return policy on retail whole beans?',
  ];

  // If Gemini API Key is provided, use Google GenAI
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const contextText = chunks.length > 0
        ? chunks.map((c, i) => `[Source ${i + 1}: ${c.title} (${c.category})]\n${c.content}`).join('\n\n')
        : 'No specific store records found for this query.';

      const systemPrompt = `You are the polite, knowledgeable, and warm customer service concierge for "Artisan Commerce" (a specialty café, micro-roastery, and artisan bakery group with locations: Flagship Roastery in Oakland, Downtown Café in San Francisco, and Westside Bakery in Berkeley).

Your duty is to answer customer questions accurately by strictly grounding your responses in the retrieved store knowledge base provided below.
- If the customer asks about stock or price, cite the exact quantities, locations, and prices found in the context.
- If asking about dietary or allergens, be precise about gluten-free, dairy, or nut warnings.
- Keep the tone hospitable, professional, and concise. Format with bullet points where helpful.
- If the information is not in the context, politely let the customer know and offer store contact info.

=== RETRIEVED STORE CONTEXT ===
${contextText}
===============================`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nCustomer Inquiry: "${query}"\n\nConcierge Response:` }] },
        ],
      });

      const replyText = response.text || synthesizeLocalGroundedResponse(query, chunks);

      return {
        query,
        response: replyText,
        modelUsed: 'gemini-2.5-flash',
        retrievedChunks: chunks,
        suggestedFollowUps,
        tone: 'concierge',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local synthesis:', err.message);
    }
  }

  // Local Grounded Synthesizer
  const localReply = synthesizeLocalGroundedResponse(query, chunks);
  return {
    query,
    response: localReply,
    modelUsed: 'local-retrieval-synthesizer',
    retrievedChunks: chunks,
    suggestedFollowUps,
    tone: 'concierge',
    timestamp: new Date().toISOString(),
  };
}
