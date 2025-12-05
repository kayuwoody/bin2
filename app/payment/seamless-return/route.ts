import { NextResponse } from 'next/server';

/**
 * GET/POST /payment/seamless-return
 * Return endpoint for seamless payment popup
 * Fiuu POSTs payment result here, we redirect to page.tsx with query params
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

    console.log(`🔄 Seamless return received: ${req.method} ${req.url}`);

    // Fiuu can send parameters via GET (query params) or POST (form-urlencoded body)
    if (req.method === 'POST') {
      try {
        // For POST requests, read from form-urlencoded body
        const body = await req.text();
        console.log(`📦 POST body:`, body);

        const formParams = new URLSearchParams(body);
        params = {
          orderid: formParams.get('orderid') || '',
          status: formParams.get('status') || '',
          tranID: formParams.get('tranID') || '',
          channel: formParams.get('channel') || '',
        };
        console.log(`📋 Parsed POST params:`, params);
      } catch (e) {
        console.error('❌ Error parsing POST body:', e);
        // Fall back to query params if POST parsing fails
        params = {
          orderid: url.searchParams.get('orderid') || '',
          status: url.searchParams.get('status') || '',
          tranID: url.searchParams.get('tranID') || '',
          channel: url.searchParams.get('channel') || '',
        };
        console.log(`📋 Fallback to query params:`, params);
      }
    } else {
      // For GET requests, read from query params
      params = {
        orderid: url.searchParams.get('orderid') || '',
        status: url.searchParams.get('status') || '',
        tranID: url.searchParams.get('tranID') || '',
        channel: url.searchParams.get('channel') || '',
      };
      console.log(`📋 GET query params:`, params);
    }

    const { orderid, status, tranID, channel } = params;

    console.log(`🎉 Seamless payment completed: order=${orderid}, status=${status}, channel=${channel}`);

    // Redirect to page with query params (use 303 to convert POST to GET)
    const redirectURL = new URL('/payment/seamless-return', req.url);
    redirectURL.searchParams.set('order', orderid);
    redirectURL.searchParams.set('status', status);
    if (tranID) redirectURL.searchParams.set('txn', tranID);
    if (channel) redirectURL.searchParams.set('channel', channel);

    return NextResponse.redirect(redirectURL, 303);
  } catch (error: any) {
    console.error('❌ Seamless return error:', error);
    // Redirect to page with error status
    return NextResponse.redirect(
      new URL('/payment/seamless-return?status=error', req.url),
      303
    );
  }
}
