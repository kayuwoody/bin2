import { wcApi } from './wooClient';
import type { WooProduct as WooCommerceProduct } from './types/woocommerce';

export interface WooProduct {
  id: number;
  name: string;
  price: string;
  sku: string;
  images: Array<{ src: string }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  stock_quantity: number;
}

/**
 * Get product by ID from WooCommerce
 */
export async function getProductById(id: string): Promise<WooProduct | null> {
  try {
    const { data } = await wcApi.get<WooCommerceProduct>(`products/${id}`) as { data: WooCommerceProduct };
    return data as WooProduct;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

/**
 * Get all products from WooCommerce
 */
export async function getAllProducts(): Promise<WooProduct[]> {
  try {
    const { data } = await wcApi.get<WooCommerceProduct[]>('products') as { data: WooCommerceProduct[] };
    return data as WooProduct[];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

/**
 * Get products by category from WooCommerce
 */
export async function getProductsByCategory(categoryId: number): Promise<WooProduct[]> {
  try {
    const { data } = await wcApi.get<WooCommerceProduct[]>('products', { category: categoryId }) as { data: WooCommerceProduct[] };
    return data as WooProduct[];
  } catch (error) {
    console.error(`Failed to fetch products for category ${categoryId}:`, error);
    return [];
  }
}
