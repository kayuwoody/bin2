import { wcApi } from './wooClient';
import type {
  WooOrder,
  WooLineItem,
  WooMeta,
  WooBilling,
  WooShipping,
  WooOrderStatus
} from './types/woocommerce';

/* ------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------- */

export interface NewOrderPayload {
  line_items: WooLineItem[];
  userId?: number;              // Woo customer_id if authenticated
  guestId?: string;             // anonymous session id (local)
  status?: WooOrderStatus;      // optional override (default Woo behavior)
  billing?: WooBilling;
  shipping?: WooShipping;
  meta_data?: WooMeta[];        // additional custom meta
}

/* ------------------------------------------------------------------
 * Utilities
 * ---------------------------------------------------------------- */
function buildCreatePayload(p: NewOrderPayload) {
  const {
    line_items,
    userId,
    guestId,
    status,
    billing,
    shipping,
    meta_data = [],
  } = p;

  const payload: Partial<WooOrder> = {
    line_items,
  };

  // Always include metadata if present
  let finalMetaData = [...meta_data];

  if (userId) {
    payload.customer_id = userId;
  } else if (guestId) {
    finalMetaData.push({ key: 'guestId', value: guestId });
  }

  // Always add meta_data if we have any
  if (finalMetaData.length > 0) {
    payload.meta_data = finalMetaData;
  }

  if (status) payload.status = status;
  if (billing) payload.billing = billing;
  if (shipping) payload.shipping = shipping;

  return payload;
}

function buildMetaPatch(meta: WooMeta[] = []) {
  return { meta_data: meta };
}

function logWooErr(where: string, err: unknown) {
  // Woo errors often land in err.response.data
  const error = err as { response?: { data?: unknown } };
  const detail = error?.response?.data ?? err;
  console.error(`❌ Woo error in ${where}:`, detail);
  return detail;
}

/* ------------------------------------------------------------------
 * CREATE
 * ---------------------------------------------------------------- */
export async function createWooOrder(payload: NewOrderPayload): Promise<WooOrder> {
  const wooPayload = buildCreatePayload(payload);
  try {
    const { data } = await wcApi.post<WooOrder>('orders', wooPayload) as { data: WooOrder };
    return data;
  } catch (err) {
    throw logWooErr('createWooOrder', err);
  }
}

/* ------------------------------------------------------------------
 * READ SINGLE
 * ---------------------------------------------------------------- */
export async function getWooOrder(id: number | string): Promise<WooOrder> {
  try {
    const { data } = await wcApi.get<WooOrder>(`orders/${id}`) as { data: WooOrder };
    return data;
  } catch (err) {
    throw logWooErr('getWooOrder', err);
  }
}

/* ------------------------------------------------------------------
 * UPDATE / PATCH (generic)
 * ---------------------------------------------------------------- */
export async function updateWooOrder(
  id: number | string,
  patch: Partial<WooOrder>
): Promise<WooOrder> {
  try {
    const { data } = await wcApi.put<WooOrder>(`orders/${id}`, patch) as { data: WooOrder };
    return data;
  } catch (err) {
    throw logWooErr('updateWooOrder', err);
  }
}

/* ------------------------------------------------------------------
 * Update status convenience
 * ---------------------------------------------------------------- */
export async function setWooOrderStatus(
  id: number | string,
  status: WooOrderStatus
): Promise<WooOrder> {
  return updateWooOrder(id, { status });
}

/* ------------------------------------------------------------------
 * Add / replace meta convenience
 * NOTE: Woo PUT is *replace*, so include full meta_data you want persisted
 * If you want to append, first fetch existing, then merge.
 * ---------------------------------------------------------------- */
export async function appendWooOrderMeta(
  id: number | string,
  newMeta: WooMeta[]
): Promise<WooOrder> {
  // fetch current
  const current = await getWooOrder(id);
  const combined = [
    ...(current?.meta_data?.map((m) => ({ key: m.key, value: m.value })) ?? []),
    ...newMeta,
  ];
  return updateWooOrder(id, buildMetaPatch(combined));
}

/* ------------------------------------------------------------------
 * Mark Ready-to-Pickup helper
 * (attach locker/pickup fields if provided; adjust keys to your store)
 * ---------------------------------------------------------------- */
export interface ReadyPayload {
  locker?: string;
  pickupCode?: string;
  qrUrl?: string;
  status?: WooOrderStatus; // default 'ready-to-pickup'
}

export async function markOrderReadyForPickup(
  id: number | string,
  { locker, pickupCode, qrUrl, status = 'ready-to-pickup' }: ReadyPayload
): Promise<WooOrder> {
  const meta: WooMeta[] = [];
  if (locker) meta.push({ key: '_locker_number', value: locker });
  if (pickupCode) meta.push({ key: '_pickup_code', value: pickupCode });
  if (qrUrl) meta.push({ key: '_pickup_qr_url', value: qrUrl });

  // Add timestamp for auto-cleanup tracking
  meta.push({ key: '_ready_timestamp', value: new Date().toISOString() });

  // patch both status + meta
  const current = await getWooOrder(id);
  const combined = [
    ...(current?.meta_data?.map((m) => ({ key: m.key, value: m.value })) ?? []),
    ...meta,
  ];

  return updateWooOrder(id, {
    status,
    meta_data: combined,
  });
}

/* ------------------------------------------------------------------
 * LIST: logged-in Woo customer
 * ---------------------------------------------------------------- */
export interface ListParams {
  status?: WooOrderStatus | string;  // single status or comma-separated list
  per_page?: number;
  page?: number;
}

export async function listOrdersByUser(
  userId: number,
  { status, per_page = 50, page = 1 }: ListParams = {}
): Promise<WooOrder[]> {
  const params: Record<string, string | number> = {
    customer: userId,
    per_page,
    page,
  };
  if (status) params.status = status;

  try {
    const { data } = await wcApi.get<WooOrder[]>('orders', params) as { data: WooOrder[] };
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw logWooErr('listOrdersByUser', err);
  }
}

/* ------------------------------------------------------------------
 * LIST: guest orders via meta guestId
 * ---------------------------------------------------------------- */
export async function listOrdersByGuest(
  guestId: string,
  { status, per_page = 50, page = 1 }: ListParams = {}
): Promise<WooOrder[]> {
  const params: Record<string, string | number> = {
    meta_key: 'guestId',
    meta_value: guestId,
    per_page,
    page,
  };
  if (status) params.status = status;

  try {
    const { data } = await wcApi.get<WooOrder[]>('orders', params) as { data: WooOrder[] };
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw logWooErr('listOrdersByGuest', err);
  }
}
