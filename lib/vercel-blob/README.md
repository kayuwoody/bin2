# Vercel Blob Storage Setup for bin2 (Customer Site)

This directory contains the Vercel Blob Storage integration for syncing product combo/recipe data from the POS system to the customer-facing site.

## Architecture

```
┌─────────────────────┐
│   POS (ren1)        │
│   SQLite Local DB   │
│   - Create combos   │
│   - Manage recipes  │
└──────────┬──────────┘
           │
           │ Export & Upload
           ▼
┌─────────────────────┐
│  Vercel Blob        │
│  combos.json        │
│  - Products         │
│  - Materials        │
│  - Product Recipes  │
└──────────┬──────────┘
           │
           │ Download & Parse
           ▼
┌─────────────────────┐
│  Customer Site      │
│  (bin2 on Vercel)   │
│  - Browse combos    │
│  - Order products   │
└─────────────────────┘
```

## How It Works

### Storage Format: JSON File

Instead of a traditional database, we use a single JSON file (`combos.json`) stored in Vercel Blob:

```json
{
  "version": "1.0",
  "lastSync": "2025-11-20T12:34:56Z",
  "products": {
    "product-id-1": { /* product data */ },
    "product-id-2": { /* product data */ }
  },
  "materials": {
    "material-id-1": { /* material data */ }
  },
  "recipes": {
    "product-id-1": [ /* array of recipe items */ ]
  }
}
```

### Why Blob + JSON?

- ✅ **Simple**: No database schema or migrations needed
- ✅ **Fast**: Cached in memory, served from CDN
- ✅ **Easy to Debug**: Download JSON and inspect
- ✅ **Perfect for Small Datasets**: Under 100 products is ideal
- ✅ **Already Set Up**: You created the Blob storage

### Vercel Blob Configuration

**Store Name**: `ren2-blob`
**Store ID**: `store_MaA1z6m8DSxwcup6`
**Base URL**: `https://maa1z6m8dsxwcup6.public.blob.vercel-storage.com`
**Token**: `bin2_READ_WRITE_TOKEN` (already in Vercel env)

## Setup Instructions

### ✅ Vercel Blob Storage (Already Done!)

You've already created the Blob storage and Vercel has automatically added the environment variable `bin2_READ_WRITE_TOKEN`.

### Next: Deploy bin2

Just push and deploy bin2:

```bash
git push
```

Vercel will automatically deploy with Blob storage connected.

### Later: Sync from POS (ren1)

In the ren1 (POS) repository, you'll need to:

1. **Export Script**: Read combos from SQLite and generate `combos.json`
2. **Upload to Blob**: Use `@vercel/blob` to upload the JSON file
3. **Admin Button**: Add "Sync Combos" button in POS admin

(This will be done in a separate ren1 chat)

## How bin2 Uses Blob Data

### On Vercel (Production)
1. API routes call `getProductByWcId()` or `getProductRecipe()`
2. Data loader detects Vercel environment
3. Blob client fetches `combos.json` from Blob storage
4. Data is cached in memory for 5 minutes
5. Lookups are performed against in-memory JSON

### Locally (Development)
1. API routes call same functions
2. Data loader detects local environment
3. Uses SQLite directly (no Blob needed)
4. Works offline with local database

### Caching Strategy

- **First request**: Downloads `combos.json` from Blob
- **Subsequent requests**: Uses in-memory cache (5 min TTL)
- **After 5 min**: Re-fetches from Blob to get updates
- **CDN**: Vercel CDN caches the JSON file globally

## File Structure

```
lib/vercel-blob/
├── README.md          # This file
└── client.ts          # Blob storage client

lib/data/
└── productDataLoader.ts   # Unified data loader (Blob or SQLite)
```

## Data Loader API

All API routes use the unified data loader:

```typescript
import { getProductByWcId, getProductRecipe } from '@/lib/data/productDataLoader';

// Works on both Vercel (Blob) and locally (SQLite)
const product = await getProductByWcId(123);
const recipe = await getProductRecipe('product-id');
```

## JSON Schema

The `combos.json` file follows this structure:

### Product
```typescript
{
  id: string;
  wcId?: number;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  supplierCost: number;
  unitCost: number;
  stockQuantity: number;
  manageStock: boolean;
  comboPriceOverride?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Material
```typescript
{
  id: string;
  name: string;
  category: string;
  purchaseUnit: string;
  purchaseQuantity: number;
  purchaseCost: number;
  costPerUnit: number;
  stockQuantity: number;
  lowStockThreshold: number;
  supplier?: string;
  lastPurchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### ProductRecipeItem
```typescript
{
  id: string;
  productId: string;
  itemType: 'material' | 'product';
  materialId?: string;
  linkedProductId?: string;
  materialName?: string;
  materialCategory?: string;
  linkedProductName?: string;
  linkedProductSku?: string;
  quantity: number;
  unit: string;
  calculatedCost: number;
  isOptional: boolean;
  selectionGroup?: string;
  priceAdjustment?: number;
  sortOrder: number;
  createdAt: string;
}
```

## Monitoring

Check last sync time:

```typescript
import { getLastSyncTime } from '@/lib/data/productDataLoader';

const lastSync = await getLastSyncTime();
console.log('Last synced:', lastSync);
```

## Troubleshooting

**Data not loading:**
- Check that `combos.json` exists in Blob storage
- Verify `bin2_READ_WRITE_TOKEN` is in Vercel environment variables
- Check Vercel function logs for fetch errors

**Stale data:**
- Wait 5 minutes for cache to expire, or
- Redeploy to clear in-memory cache, or
- Re-upload `combos.json` from POS

**Local development not working:**
- Ensure SQLite database exists at `prisma/dev.db`
- Run POS locally to populate local database

## Security

- ✅ Blob storage token managed by Vercel
- ✅ `combos.json` is publicly readable (no sensitive data)
- ✅ Only POS admin can upload (write token protected)
- ✅ Customer site has read-only access
