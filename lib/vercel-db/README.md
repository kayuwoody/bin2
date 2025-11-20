# Vercel Postgres Setup for bin2 (Customer Site)

This directory contains the Vercel Postgres integration for syncing product combo/recipe data from the POS system to the customer-facing site.

## Architecture

```
┌─────────────────────┐
│   POS (ren1)        │
│   SQLite Local DB   │
│   - Create combos   │
│   - Manage recipes  │
└──────────┬──────────┘
           │
           │ Sync (manual/scheduled)
           ▼
┌─────────────────────┐
│  Vercel Postgres    │
│  - Products         │
│  - Materials        │
│  - Product Recipes  │
└──────────┬──────────┘
           │
           │ Read-only
           ▼
┌─────────────────────┐
│  Customer Site      │
│  (bin2 on Vercel)   │
│  - Browse combos    │
│  - Order products   │
└─────────────────────┘
```

## Setup Instructions

### 1. Create Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Select your `bin2` project
3. Navigate to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Name it `bin2-combos` (or your preferred name)
7. Choose region closest to your customers
8. Click **Create**

### 2. Connect to Your Project

After creating the database, Vercel will automatically:
- Add environment variables to your project
- Set up `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.

### 3. Initialize Database Schema

Run the schema initialization:

```bash
# Navigate to bin2 directory
cd bin2

# Run the migration script
node lib/vercel-db/migrate.js
```

Or manually run the SQL from `schema.sql` in the Vercel Postgres dashboard.

### 4. Verify Environment Variables

In your Vercel project settings, you should see these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

These are automatically added by Vercel when you create the database.

### 5. Deploy

Push your changes and deploy:

```bash
git add .
git commit -m "Add Vercel Postgres integration"
git push
```

Vercel will automatically deploy with the database connected.

## How It Works

### On Vercel (Production)
- Uses Vercel Postgres to read combo data
- Data is synced from POS via the sync API
- Serverless functions query Postgres

### Locally (Development)
- Uses SQLite for development
- You can test with local database
- Auto-detects environment and uses appropriate database

### Data Loader (`lib/data/productDataLoader.ts`)
- Automatically chooses correct data source
- Vercel → Postgres
- Local → SQLite
- Provides unified API for both

## Syncing Data from POS

The sync functionality will be implemented in the `ren1` (POS) repository:

1. POS admin creates/updates combos in SQLite
2. Click "Sync to Cloud" button (or scheduled task)
3. POS sends data to Vercel Postgres via API
4. Customer site immediately sees updates

## Tables

- **products**: Product catalog with pricing
- **materials**: Raw materials/ingredients
- **product_recipes**: Recipe items linking products to materials/other products
- **sync_metadata**: Tracks last sync time

## Security

- Vercel Postgres credentials are managed by Vercel
- Customer site has read-only access via queries
- POS will sync via authenticated API endpoint
- No direct database access from public

## Monitoring

Check sync status:
```typescript
import { getLastSyncTime } from '@/lib/data/productDataLoader';

const lastSync = await getLastSyncTime();
console.log('Last synced:', lastSync);
```

## Troubleshooting

**Database not connecting:**
- Verify environment variables in Vercel dashboard
- Check that database is in same region as functions
- Review Vercel logs for connection errors

**Stale data:**
- Run sync from POS
- Check `sync_metadata` table for last sync timestamp

**Local development not working:**
- Ensure SQLite database exists at `prisma/dev.db`
- Run POS locally to populate local database
