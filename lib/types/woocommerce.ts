/**
 * WooCommerce TypeScript Type Definitions
 *
 * Comprehensive type definitions for WooCommerce REST API v3
 * Based on: https://woocommerce.github.io/woocommerce-rest-api-docs/
 */

// ============================================================================
// Meta Data
// ============================================================================

export interface WooMeta {
  id?: number;
  key: string;
  value: string | number | boolean | object;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface WooBilling {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface WooShipping {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface WooCustomer {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: WooBilling;
  shipping: WooShipping;
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: WooMeta[];
}

// ============================================================================
// Product Types
// ============================================================================

export interface WooProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  categories: WooProductCategory[];
  tags: Array<{ id: number; name: string; slug: string }>;
  images: WooProductImage[];
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: WooMeta[];
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
}

// ============================================================================
// Order Types
// ============================================================================

export interface WooLineItem {
  id?: number;
  name?: string;
  product_id: number;
  variation_id?: number;
  quantity: number;
  tax_class?: string;
  subtotal?: string;
  subtotal_tax?: string;
  total?: string;
  total_tax?: string;
  taxes?: Array<{
    id: number;
    total: string;
    subtotal: string;
  }>;
  meta_data?: WooMeta[];
  sku?: string;
  price?: number;
}

export interface WooTaxLine {
  id: number;
  rate_code: string;
  rate_id: number;
  label: string;
  compound: boolean;
  tax_total: string;
  shipping_tax_total: string;
  meta_data: WooMeta[];
}

export interface WooShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  total: string;
  total_tax: string;
  taxes: Array<{
    id: number;
    total: string;
  }>;
  meta_data: WooMeta[];
}

export interface WooFeeLine {
  id: number;
  name: string;
  tax_class: string;
  tax_status: 'taxable' | 'none';
  total: string;
  total_tax: string;
  taxes: Array<{
    id: number;
    total: string;
    subtotal: string;
  }>;
  meta_data: WooMeta[];
}

export interface WooCouponLine {
  id: number;
  code: string;
  discount: string;
  discount_tax: string;
  meta_data: WooMeta[];
}

export interface WooRefund {
  id: number;
  reason: string;
  total: string;
}

export type WooOrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'trash'
  | 'ready-to-pickup'; // Custom status

export interface WooOrder {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: WooOrderStatus;
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: WooBilling;
  shipping: WooShipping;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_paid_gmt: string | null;
  date_completed: string | null;
  date_completed_gmt: string | null;
  cart_hash: string;
  meta_data: WooMeta[];
  line_items: WooLineItem[];
  tax_lines: WooTaxLine[];
  shipping_lines: WooShippingLine[];
  fee_lines: WooFeeLine[];
  coupon_lines: WooCouponLine[];
  refunds: WooRefund[];
  set_paid: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface WooApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface WooApiError {
  code: string;
  message: string;
  data?: {
    status: number;
    params?: Record<string, string>;
  };
}

// ============================================================================
// API Response Format
// ============================================================================

export interface WooApiResponseFormat<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// ============================================================================
// API Client Interface
// ============================================================================

export interface WooCommerceApiClient {
  get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<WooApiResponseFormat<T>>;
  post<T = unknown>(endpoint: string, data: unknown): Promise<WooApiResponseFormat<T>>;
  put<T = unknown>(endpoint: string, data: unknown): Promise<WooApiResponseFormat<T>>;
  delete<T = unknown>(endpoint: string): Promise<WooApiResponseFormat<T>>;
}

// ============================================================================
// Helper Types
// ============================================================================

export type WooOrderCreatePayload = Partial<WooOrder> & {
  line_items: WooLineItem[];
  customer_id?: number;
  meta_data?: WooMeta[];
  status?: WooOrderStatus;
  billing?: WooBilling;
  shipping?: WooShipping;
};

export type WooCustomerCreatePayload = Partial<WooCustomer> & {
  email: string;
  first_name?: string;
  last_name?: string;
  billing?: WooBilling;
  shipping?: WooShipping;
  meta_data?: WooMeta[];
};

export interface WooOrderListParams {
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
  parent?: number[];
  parent_exclude?: number[];
  status?: WooOrderStatus | WooOrderStatus[];
  customer?: number;
  product?: number;
  dp?: number;
  meta_key?: string;
  meta_value?: string;
}

export interface WooCustomerListParams {
  page?: number;
  per_page?: number;
  search?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'id' | 'include' | 'name' | 'registered_date';
  email?: string;
  role?: string;
}

export interface WooProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  parent?: number[];
  parent_exclude?: number[];
  slug?: string;
  status?: 'draft' | 'pending' | 'private' | 'publish' | 'any';
  type?: 'simple' | 'grouped' | 'external' | 'variable';
  sku?: string;
  featured?: boolean;
  category?: number;
  tag?: number;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}
