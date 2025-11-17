import { NextResponse } from 'next/server';
import { getFiuuService } from '@/lib/fiuuService';

/**
 * GET/POST /api/payments/return
 * Browser redirect endpoint - customer returns here after payment
 *
 * NOTE: Do NOT rely on this for critical logic (user may close browser)
 * Use this only for UI redirect - actual order updates happen in notify webhook
 */
export async function GET(req: Request) {
  return handleReturn(req);
}

export async function POST(req: Request) {
  return handleReturn(req);
}

async function handleReturn(req: Request) {
  try {
    const url = new URL(req.url);

    // Extract parameters (Fiuu sends these)
    const orderid = url.searchParams.get('orderid') || '';
    const status = url.searchParams.get('status') || '';
    const tranID = url.searchParams.get('tranID') || '';
    const skey = url.searchParams.get('skey') || '';

    console.log(`🔄 Customer returned from Fiuu for order ${orderid}, status: ${status}`);

    // Initialize Fiuu service
    const fiuu = getFiuuService();
    const isSuccess = fiuu.isPaymentSuccessful(status);

    // Redirect to appropriate page based on status
    if (isSuccess) {
      // Payment successful - redirect to success page
      return NextResponse.redirect(
        new URL(`/payment/success?order=${orderid}&txn=${tranID}`, req.url)
      );
    } else if (status === '11') {
      // Payment failed - redirect to failed page
      return NextResponse.redirect(
        new URL(`/payment/failed?order=${orderid}&status=${status}`, req.url)
      );
    } else {
      // Unknown status - redirect to error page
      return NextResponse.redirect(
        new URL(`/payment/error?order=${orderid}&status=${status}`, req.url)
      );
    }
  } catch (error: any) {
    console.error('❌ Payment return error:', error);
    // Redirect to generic error page
    return NextResponse.redirect(new URL('/payment/error', req.url));
  }
}
