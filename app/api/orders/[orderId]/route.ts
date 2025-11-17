// app/api/orders/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWooOrder, updateWooOrder } from '@/lib/orderService';
import { handleApiError, notFoundError, unauthorizedError } from '@/lib/api/error-handler';

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // Fetch the *full* order, meta_data included
    const order = await getWooOrder(params.orderId);

    // Authorization: Ensure user can only access their own orders
    const userIdCookie = cookies().get('userId')?.value;
    const url = new URL(req.url);
    const guestId = url.searchParams.get('guestId');

    // Check if order belongs to logged-in user
    if (userIdCookie && order.customer_id === Number(userIdCookie)) {
      return NextResponse.json(order, { status: 200 });
    }

    // Check if order belongs to guest
    if (guestId) {
      const orderGuestId = order.meta_data?.find((m: any) => m.key === 'guestId')?.value;
      if (orderGuestId === guestId) {
        return NextResponse.json(order, { status: 200 });
      }
    }

    // If neither matches, order doesn't belong to this user
    return unauthorizedError('Not authorized to view this order', '/api/orders/[orderId]');
  } catch (error: any) {
    // Check if this is a 404 (order not found/deleted)
    const statusCode = error?.data?.status || error?.response?.status;
    const errorCode = error?.code;

    if (statusCode === 404 || errorCode === 'woocommerce_rest_shop_order_invalid_id') {
      return notFoundError('Order not found', '/api/orders/[orderId]');
    }

    return handleApiError(error, '/api/orders/[orderId]');
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // First fetch order to check authorization
    const order = await getWooOrder(params.orderId);

    // Authorization: Ensure user can only update their own orders
    const userIdCookie = cookies().get('userId')?.value;
    const url = new URL(req.url);
    const guestId = url.searchParams.get('guestId');

    let authorized = false;

    // Check if order belongs to logged-in user
    if (userIdCookie && order.customer_id === Number(userIdCookie)) {
      authorized = true;
    }

    // Check if order belongs to guest
    if (guestId) {
      const orderGuestId = order.meta_data?.find((m: any) => m.key === 'guestId')?.value;
      if (orderGuestId === guestId) {
        authorized = true;
      }
    }

    if (!authorized) {
      return unauthorizedError('Not authorized to update this order', '/api/orders/[orderId]');
    }

    const body = await req.json();
    const updatedOrder = await updateWooOrder(params.orderId, body);
    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (err: any) {
    return handleApiError(err, '/api/orders/[orderId]');
  }
}
