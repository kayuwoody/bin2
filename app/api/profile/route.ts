// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { wcApi } from '@/lib/wooClient';
import { handleApiError, validationError } from '@/lib/api/error-handler';
import type { WooCustomer } from '@/lib/types/woocommerce';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wooCustomerId = searchParams.get('id');

  if (!wooCustomerId) {
    return validationError('Missing WooCommerce ID', '/api/profile');
  }

  try {
    const { data: customer } = await wcApi.get<WooCustomer>(`customers/${wooCustomerId}`) as { data: WooCustomer };
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error, '/api/profile');
  }
}
