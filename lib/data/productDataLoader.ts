/**
 * Unified data loader for products and recipes
 *
 * Strategy:
 * - On Vercel (production): Use Vercel Blob Storage (JSON file)
 * - Locally (development): Use SQLite
 *
 * This allows the customer site to work on Vercel while
 * maintaining local development with SQLite
 */

import type { Product, ProductRecipeItem } from '../vercel-blob/client';

// Detect environment
const isVercel = process.env.VERCEL === '1' || process.env.bin2_READ_WRITE_TOKEN !== undefined;

/**
 * Get product by WooCommerce ID
 */
export async function getProductByWcId(wcId: number): Promise<Product | null> {
  if (isVercel) {
    // Use Vercel Blob Storage
    const { getProductByWcId: getFromBlob } = await import('../vercel-blob/client');
    return getFromBlob(wcId);
  } else {
    // Use SQLite (local development)
    const { getProductByWcId: getFromSQLite } = await import('../db/productService');
    const product = getFromSQLite(wcId);
    return product || null;
  }
}

/**
 * Get product by internal ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (isVercel) {
    const { getProductById: getFromBlob } = await import('../vercel-blob/client');
    return getFromBlob(id);
  } else {
    const { getProduct: getFromSQLite } = await import('../db/productService');
    const product = getFromSQLite(id);
    return product || null;
  }
}

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  if (isVercel) {
    const { getAllProducts: getFromBlob } = await import('../vercel-blob/client');
    return getFromBlob();
  } else {
    const { getAllProducts: getFromSQLite } = await import('../db/productService');
    return getFromSQLite();
  }
}

/**
 * Get recipe for a product
 */
export async function getProductRecipe(productId: string): Promise<ProductRecipeItem[]> {
  if (isVercel) {
    const { getProductRecipe: getFromBlob } = await import('../vercel-blob/client');
    return getFromBlob(productId);
  } else {
    const { getProductRecipe: getFromSQLite } = await import('../db/recipeService');
    return getFromSQLite(productId);
  }
}

/**
 * Get last sync time (only available on Vercel)
 */
export async function getLastSyncTime(): Promise<Date | null> {
  if (isVercel) {
    const { getLastSyncTime } = await import('../vercel-blob/client');
    return getLastSyncTime();
  }
  return null; // No sync tracking for local SQLite
}
