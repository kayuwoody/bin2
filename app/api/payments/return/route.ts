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
    let params: Record<string, string> = {};

    console.log(`🔄 Payment return received: ${req.method} ${req.url}`);

    // Fiuu can send parameters via GET (query params) or POST (form-urlencoded body)
    if (req.method === 'POST') {
      try {
        // For POST requests, read from form-urlencoded body (same as notify/callback endpoints)
        const body = await req.text();
        console.log(`📦 POST body:`, body);

        const formParams = new URLSearchParams(body);
        params = {
          orderid: formParams.get('orderid') || '',
          status: formParams.get('status') || '',
          tranID: formParams.get('tranID') || '',
          skey: formParams.get('skey') || '',
        };
        console.log(`📋 Parsed POST params:`, params);
      } catch (e) {
        console.error('❌ Error parsing POST body:', e);
        // Fall back to query params if POST parsing fails
        params = {
          orderid: url.searchParams.get('orderid') || '',
          status: url.searchParams.get('status') || '',
          tranID: url.searchParams.get('tranID') || '',
          skey: url.searchParams.get('skey') || '',
        };
        console.log(`📋 Fallback to query params:`, params);
      }
    } else {
      // For GET requests, read from query params
      params = {
        orderid: url.searchParams.get('orderid') || '',
        status: url.searchParams.get('status') || '',
        tranID: url.searchParams.get('tranID') || '',
        skey: url.searchParams.get('skey') || '',
      };
      console.log(`📋 GET query params:`, params);
    }

    const { orderid, status, tranID, skey } = params;

    console.log(`🔄 Customer returned from Fiuu (${req.method}) for order ${orderid}, status: ${status}`);

    // Initialize Fiuu service
    const fiuu = getFiuuService();
    const isSuccess = fiuu.isPaymentSuccessful(status);

    // Redirect to appropriate page based on status
    // Use 303 "See Other" to force browser to change POST to GET when following redirect
    if (isSuccess) {
      // Payment successful - redirect to success page
      return NextResponse.redirect(
        new URL(`/payment/success?order=${orderid}&txn=${tranID}`, req.url),
        303
      );
    } else if (status === '11') {
      // Payment failed - redirect to failed page
      return NextResponse.redirect(
        new URL(`/payment/failed?order=${orderid}&status=${status}`, req.url),
        303
      );
    } else {
      // Unknown status - redirect to error page
      return NextResponse.redirect(
        new URL(`/payment/error?order=${orderid}&status=${status}`, req.url),
        303
      );
    }
  } catch (error: any) {
    console.error('❌ Payment return error:', error);
    // Redirect to generic error page (303 to change POST to GET)
    return NextResponse.redirect(new URL('/payment/error', req.url), 303);
  }
}
