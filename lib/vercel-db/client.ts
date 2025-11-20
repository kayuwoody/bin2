import { sql } from '@vercel/postgres';

/**
 * Vercel Postgres client for reading combo/recipe data
 * This is used on the customer-facing site (Vercel deployment)
 * Data is synced from the POS SQLite database
 */

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

// Helper to convert snake_case DB columns to camelCase
function toCamelCase(obj: any): any {
  if (!obj) return obj;
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

/**
 * Get product by WooCommerce ID
 */
export async function getProductByWcId(wcId: number): Promise<Product | null> {
  try {
    const { rows } = await sql`
      SELECT * FROM products WHERE wc_id = ${wcId} LIMIT 1
    `;
    return rows.length > 0 ? toCamelCase(rows[0]) : null;
  } catch (error) {
    console.error('Error fetching product by WC ID:', error);
    return null;
  }
}

/**
 * Get product by internal ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { rows } = await sql`
      SELECT * FROM products WHERE id = ${id} LIMIT 1
    `;
    return rows.length > 0 ? toCamelCase(rows[0]) : null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const { rows } = await sql`
      SELECT * FROM products ORDER BY name
    `;
    return rows.map(toCamelCase);
  } catch (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
}

/**
 * Get recipe for a product (with material and linked product details joined)
 */
export async function getProductRecipe(productId: string): Promise<ProductRecipeItem[]> {
  try {
    const { rows } = await sql`
      SELECT
        pr.*,
        m.name as material_name,
        m.category as material_category,
        m.purchase_unit,
        m.cost_per_unit,
        p.name as linked_product_name,
        p.sku as linked_product_sku
      FROM product_recipes pr
      LEFT JOIN materials m ON pr.material_id = m.id
      LEFT JOIN products p ON pr.linked_product_id = p.id
      WHERE pr.product_id = ${productId}
      ORDER BY pr.sort_order, pr.created_at
    `;
    return rows.map(toCamelCase);
  } catch (error) {
    console.error('Error fetching product recipe:', error);
    return [];
  }
}

/**
 * Get material by ID
 */
export async function getMaterialById(id: string): Promise<Material | null> {
  try {
    const { rows } = await sql`
      SELECT * FROM materials WHERE id = ${id} LIMIT 1
    `;
    return rows.length > 0 ? toCamelCase(rows[0]) : null;
  } catch (error) {
    console.error('Error fetching material by ID:', error);
    return null;
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const { rows } = await sql`
      SELECT value, updated_at FROM sync_metadata WHERE key = 'last_sync'
    `;
    return rows.length > 0 ? new Date(rows[0].updated_at) : null;
  } catch (error) {
    console.error('Error fetching last sync time:', error);
    return null;
  }
}

/**
 * Check if database has been initialized
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'products'
      ) as exists
    `;
    return rows[0]?.exists || false;
  } catch (error) {
    console.error('Error checking database initialization:', error);
    return false;
  }
}
