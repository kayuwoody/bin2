import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { mockWcApi } from './mockWooClient';
import type { WooCommerceApiClient, WooApiResponseFormat } from './types/woocommerce';

// Use mock API if in development mode and USE_MOCK_API is set
const USE_MOCK = process.env.USE_MOCK_API === 'true';

// Lazy initialization to avoid SSR issues
let realWcApiInstance: WooCommerceRestApi | null = null;

function getRealWcApi(): WooCommerceRestApi | WooCommerceApiClient {
  if (!realWcApiInstance) {
    const url = process.env.WC_API_URL || process.env.WC_STORE_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
      console.warn('⚠️ WooCommerce credentials not configured. API calls will fail.');
      console.warn('   Required: WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET');
      // Return a dummy client that will throw helpful errors
      return {
        get: () => Promise.reject(new Error('WooCommerce credentials not configured')),
        post: () => Promise.reject(new Error('WooCommerce credentials not configured')),
        put: () => Promise.reject(new Error('WooCommerce credentials not configured')),
        delete: () => Promise.reject(new Error('WooCommerce credentials not configured')),
      };
    }

    realWcApiInstance = new WooCommerceRestApi({
      url,
      consumerKey,
      consumerSecret,
      version: 'wc/v3',
      queryStringAuth: true, // Force OAuth 1.0a (query parameters) instead of Basic Auth
    });

    // Enhanced logging (only once)
    const apiUrl = url || 'not set';
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 WooCommerce API Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: LIVE
Store URL: ${apiUrl}
Using: Real WooCommerce API with auto-retry
Retry: 3 attempts with exponential backoff (1s, 2s, 4s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  return realWcApiInstance;
}

/**
 * Retry helper with exponential backoff
 * Handles transient network errors from Cloudflare/firewalls
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error & {
        code?: string;
        response?: { status?: number }
      };
      lastError = err;

      // Check if it's a network error worth retrying
      const isNetworkError =
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ECONNREFUSED' ||
        err.message?.includes('socket hang up') ||
        err.message?.includes('network') ||
        (err.response?.status !== undefined && err.response.status >= 500 && err.response.status < 600); // Server errors

      if (!isNetworkError || attempt === maxRetries) {
        throw err;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`⚠️ WooCommerce API error (attempt ${attempt + 1}/${maxRetries + 1}): ${err.message || err.code}`);
      console.warn(`   Retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrap WooCommerce API with retry logic
 */
function wrapWithRetry(getApi: () => WooCommerceRestApi | WooCommerceApiClient): WooCommerceApiClient {
  return {
    get: <T = unknown>(endpoint: string, params?: Record<string, unknown>) =>
      retryWithBackoff(() => getApi().get(endpoint, params)) as Promise<WooApiResponseFormat<T>>,
    post: <T = unknown>(endpoint: string, data: unknown) =>
      retryWithBackoff(() => getApi().post(endpoint, data)) as Promise<WooApiResponseFormat<T>>,
    put: <T = unknown>(endpoint: string, data: unknown) =>
      retryWithBackoff(() => getApi().put(endpoint, data)) as Promise<WooApiResponseFormat<T>>,
    delete: <T = unknown>(endpoint: string) =>
      retryWithBackoff(() => getApi().delete(endpoint)) as Promise<WooApiResponseFormat<T>>,
  };
}

// Export either mock or real API based on environment, with retry wrapper
export const wcApi = USE_MOCK ? mockWcApi : wrapWithRetry(getRealWcApi);

if (USE_MOCK) {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 WooCommerce API Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: MOCK
USE_MOCK_API env: ${process.env.USE_MOCK_API}
Using: Mock responses (no real orders)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

