/**
 * Vercel Blob Storage Client for Product Combos
 *
 * Fetches combo/recipe data from a JSON file stored in Vercel Blob Storage.
 * The JSON is uploaded from the POS system and cached for fast access.
 */

import { list } from '@vercel/blob';

export interface Product {
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

export interface Material {
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

export interface ProductRecipeItem {
  id: string;
  productId: string;
  itemType: 'material' | 'product';
  materialId?: string;
  linkedProductId?: string;
  materialName?: string;
  materialCategory?: string;
  linkedProductName?: string;
  linkedProductSku?: string;
  purchaseUnit?: string;
  costPerUnit?: number;
  quantity: number;
  unit: string;
  calculatedCost: number;
  isOptional: boolean;
  selectionGroup?: string;
  priceAdjustment?: number;
  sortOrder: number;
  createdAt: string;
}

export interface ComboData {
  products: Record<string, Product>;
  materials: Record<string, Material>;
  recipes: Record<string, ProductRecipeItem[]>;
  lastSync: string;
  version: string;
}

// In-memory cache
let cachedData: ComboData | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch combo data from Vercel Blob Storage
 */
async function fetchComboData(): Promise<ComboData | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedData && now < cacheExpiry) {
      console.log('✅ Using cached combo data');
      return cachedData;
    }

    console.log('🔄 Fetching combo data from Blob storage...');

    // List blobs to find combos file (may have hash in filename)
    const { blobs } = await list({
      token: process.env.bin2_READ_WRITE_TOKEN,
      prefix: 'combos', // Find any file starting with "combos"
    });

    if (blobs.length === 0) {
      console.warn('⚠️ No combos file found in Blob storage');
      return null;
    }

    // Get the most recently uploaded combos file
    const comboBlob = blobs.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];

    console.log(`📥 Found blob: ${comboBlob.pathname} (uploaded: ${comboBlob.uploadedAt})`);

    // Fetch the JSON file
    const response = await fetch(comboBlob.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch combos.json: ${response.statusText}`);
    }

    const data: ComboData = await response.json();

    // Validate data structure
    if (!data.products || !data.recipes) {
      console.error('❌ Invalid combo data structure:', {
        hasProducts: !!data.products,
        hasRecipes: !!data.recipes,
        hasMaterials: !!data.materials,
        keys: Object.keys(data)
      });
      return null;
    }

    // Update cache
    cachedData = data;
    cacheExpiry = now + CACHE_DURATION;

    console.log(`✅ Loaded combo data (version: ${data.version}, last sync: ${data.lastSync})`);
    console.log(`   Products: ${Object.keys(data.products).length}`);
    console.log(`   Materials: ${Object.keys(data.materials || {}).length}`);
    console.log(`   Recipes: ${Object.keys(data.recipes).length}`);

    return data;
  } catch (error) {
    console.error('❌ Error fetching combo data from Blob:', error);
    return null;
  }
}

/**
 * Get product by WooCommerce ID
 */
export async function getProductByWcId(wcId: number): Promise<Product | null> {
  const data = await fetchComboData();
  if (!data) {
    console.warn(`⚠️ No combo data available when looking for WC ID ${wcId}`);
    return null;
  }

  // Find product by wcId
  const product = Object.values(data.products).find(p => p.wcId === wcId);

  if (!product) {
    console.warn(`⚠️ Product not found for WC ID ${wcId}. Available WC IDs:`,
      Object.values(data.products).map(p => p.wcId).filter(id => id !== undefined)
    );
  } else {
    console.log(`✅ Found product: ${product.name} (WC ID: ${wcId})`);
  }

  return product || null;
}

/**
 * Get product by internal ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const data = await fetchComboData();
  if (!data) return null;

  return data.products[id] || null;
}

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  const data = await fetchComboData();
  if (!data) return [];

  return Object.values(data.products);
}

/**
 * Get recipe for a product
 */
export async function getProductRecipe(productId: string): Promise<ProductRecipeItem[]> {
  const data = await fetchComboData();
  if (!data) {
    console.warn(`⚠️ No combo data available when looking for recipe for product ${productId}`);
    return [];
  }

  const recipe = data.recipes[productId] || [];

  if (recipe.length === 0) {
    console.warn(`⚠️ No recipe found for product ${productId}. Available recipe product IDs:`,
      Object.keys(data.recipes)
    );
  } else {
    console.log(`✅ Found recipe for product ${productId}: ${recipe.length} items`);
  }

  return recipe;
}

/**
 * Get material by ID
 */
export async function getMaterialById(id: string): Promise<Material | null> {
  const data = await fetchComboData();
  if (!data) return null;

  return data.materials[id] || null;
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<Date | null> {
  const data = await fetchComboData();
  if (!data || !data.lastSync) return null;

  return new Date(data.lastSync);
}

/**
 * Clear cache (useful for testing or forcing refresh)
 */
export function clearCache(): void {
  cachedData = null;
  cacheExpiry = 0;
}
