import { NextResponse } from 'next/server';

/**
 * POST /api/payments/seamless-return
 * Return endpoint for seamless payment popup
 * Fiuu POSTs payment result here, we redirect to /payment/seamless-return page
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.log(`🔄 Seamless return POST received`);
    console.log(`📦 POST body:`, body);

    const formParams = new URLSearchParams(body);
    const params = {
      orderid: formParams.get('orderid') || '',
      status: formParams.get('status') || '',
      tranID: formParams.get('tranID') || '',
      channel: formParams.get('channel') || '',
    };

    console.log(`📋 Parsed POST params:`, params);
    console.log(`🎉 Seamless payment completed: order=${params.orderid}, status=${params.status}, channel=${params.channel}`);

    // Redirect to page with query params (use 303 to convert POST to GET)
    const redirectURL = new URL('/payment/seamless-return', req.url);
    redirectURL.searchParams.set('order', params.orderid);
    redirectURL.searchParams.set('status', params.status);
    if (params.tranID) redirectURL.searchParams.set('txn', params.tranID);
    if (params.channel) redirectURL.searchParams.set('channel', params.channel);

    return NextResponse.redirect(redirectURL, 303);
  } catch (error: any) {
    console.error('❌ Seamless return error:', error);
    return NextResponse.redirect(
      new URL('/payment/seamless-return?status=error', req.url),
      303
    );
  }
}
