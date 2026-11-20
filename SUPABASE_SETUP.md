# Supabase Configuration & Backend Integration Guide

This project includes a complete backend server and Supabase database integration for the Artisan Commerce inventory management platform.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create a Supabase Project
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, choose an organization, name your project (e.g., `artisan-commerce`), set a database password, and select your region.

---

### Step 2: Apply the Database Schema & Policies
1. In your Supabase Dashboard, go to **SQL Editor** (left navigation).
2. Click **New Query**.
3. Open the file [`supabase/schema.sql`](./supabase/schema.sql) in this repository and paste its entire content into the editor.
4. Click **Run**.
   - This creates all 4 tables: `suppliers`, `inventory_items`, `purchase_orders`, and `waste_logs`.
   - Enables Row Level Security (RLS) with permissive read/write policies.
   - Creates performance indexes on SKUs, locations, and status fields.
   - Seeds initial sample data.

---

### Step 3: Configure Environment Variables
1. Go to **Project Settings** -> **API** in the Supabase Dashboard.
2. Copy your **Project URL**, **anon / public key**, and **service_role key** (keep secret).
3. Open `.env` (or copy `.env.example` to `.env`) in the project directory and fill in the values:

```env
# Backend server port
PORT=5000

# Supabase Server-Side Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Frontend Client Vite Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

---

## 🏃‍♂️ Running the Backend & Frontend

### 1. Start the Express Backend Server
```bash
npm run server
```
Or with live reload:
```bash
npm run server:dev
```
The server will start on `http://localhost:5000` and automatically verify the Supabase connection.

### 2. Start the Frontend (Vite)
In another terminal:
```bash
npm run dev
```
The frontend is hosted at `http://localhost:3000`. Vite automatically proxies `/api` calls to the backend running on port 5000.

---

## 📦 Database Seeding (CLI)

If you ever need to populate or reset Supabase from the CLI:
```bash
npm run seed
```
This script (`scripts/seed-supabase.ts`) will connect directly to your Supabase instance using your `.env` credentials and populate the tables with sample suppliers, inventory SKUs, purchase orders, and waste logs.

---

## 🛠️ Architecture Overview

| Component | Path | Description |
|-----------|------|-------------|
| **SQL Schema** | `supabase/schema.sql` | PostgreSQL schema, RLS policies, indexes, and initial data |
| **Backend Supabase Client** | `server/supabase.ts` | Supabase JS client with service role / anon key resolution |
| **Express REST API** | `server/index.ts` | Complete CRUD endpoints for inventory, orders, waste, and suppliers with fallback |
| **Frontend Supabase Client** | `src/lib/supabase.ts` | Client-side Supabase client for Vite |
| **Frontend API Layer** | `src/services/api.ts` | Typed client communicating with backend endpoints |
| **CLI Seed Script** | `scripts/seed-supabase.ts` | Automated population script |
| **Status Indicator** | `src/App.tsx` | Header badge showing live Supabase cloud connection / local status |
