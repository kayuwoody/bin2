# Nested Products Database Services

This directory contains the nested products functionality migrated from the ren1 repository.

## Overview

The nested products system allows products to have complex hierarchical structures with:
- **XOR Groups (Selection Groups)**: Mutually exclusive choices (e.g., Hot vs Iced)
- **Optional Items**: Add-on products that can be selected
- **Nested Structures**: Products that contain other products, which can contain more products (up to 5 levels deep)
- **Recursive Flattening**: All choices from all nesting levels are flattened for display in a single modal

## Migrated Files

### Core Services
- `init.ts` - SQLite database initialization
- `productService.ts` - Product CRUD operations
- `materialService.ts` - Material/ingredient management
- `recipeService.ts` - Recipe/composition management
- `recursiveProductExpansion.ts` - **Core nested products logic** - flattens nested structures
- `bundleExpansionService.ts` - Expands bundles for pricing and display

### API Routes
- `/app/api/products/[productId]/recipe/route.ts` - Fetches flattened recipe for modal
- `/app/api/bundles/expand/route.ts` - Expands bundle selections into components

### Frontend Components
- `/components/ProductSelectionModal.tsx` - Enhanced modal with nested group support

### Supporting Files
- `/lib/api/error-handler.ts` - API error handling utilities
- `/lib/api/woocommerce-helpers.ts` - WooCommerce API helpers

## Setup Required

### 1. Database Initialization

The system uses SQLite via `better-sqlite3`. You need to:

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Ensure the database is initialized (run the app or call `initDatabase()` manually)

3. The database file will be created at: `./data/coffee-oasis.db`

### 2. Sync Products from WooCommerce

You'll need to sync products from WooCommerce to the local SQLite database. This can be done via an admin interface or migration script.

### 3. Create Product Recipes

Use the recipe management system to define:
- Which products/materials make up each product
- Selection groups (XOR choices)
- Optional add-ons
- Nesting relationships

## Key Concepts

### Flattened XOR Groups

The `flattenAllChoices()` function in `recursiveProductExpansion.ts` recursively traverses the product tree and collects ALL selection groups from ALL levels. Groups are identified with unique keys:

- Root level: `root:GroupName` (e.g., `root:Pastry`)
- Nested level: `ProductId:GroupName` (e.g., `Americano:Temperature`)

### Unified Selection Format

Selections are stored in this format:
```typescript
{
  selectedMandatory: {
    "root:Pastry": "blueberry-danish-id",
    "Americano:Temperature": "hot-id"
  },
  selectedOptional: ["extra-shot-id", "whipped-cream-id"]
}
```

### Product Expansion

When a user makes selections, the system can:
1. **Calculate price**: Sum prices of all selected components
2. **Calculate COGS**: Sum costs of all selected components
3. **Get components**: Return the actual leaf products selected (for order items)

## Usage Example

```typescript
import { flattenAllChoices, calculatePriceWithSelections, getSelectedComponents } from '@/lib/db/recursiveProductExpansion';

// 1. Get flattened choices for modal
const { xorGroups, optionalItems } = flattenAllChoices(productId);

// 2. User makes selections in modal
const selections = {
  selectedMandatory: { "root:Pastry": "danish-id", "Americano:Temperature": "hot-id" },
  selectedOptional: ["extra-shot-id"]
};

// 3. Calculate price
const totalPrice = calculatePriceWithSelections(productId, selections, quantity);

// 4. Get selected components for order
const components = getSelectedComponents(productId, selections, quantity);
```

## Integration Notes

- The system filters out products with `category: 'hidden'` or `category: 'private'` from customer-facing displays
- Combo products can have a `comboPriceOverride` field to set a fixed price regardless of selections
- All pricing uses `basePrice` (sales price), while COGS calculation uses `supplierCost` or `unitCost`

## Next Steps

1. Set up database initialization in your app startup
2. Create an admin interface for managing recipes
3. Implement WooCommerce sync to populate the local database
4. Test the products page with nested products
5. Consider adding cache invalidation when products/recipes change
