import { NextResponse } from 'next/server';

/**
 * GET /api/fiuu/config
 * Return Fiuu configuration for client-side SDK loading
 * Only exposes safe values (no secret key)
 */
export async function GET() {
  const merchantID = process.env.FIUU_MERCHANT_ID || '';
  const sandboxMode = process.env.FIUU_SANDBOX_MODE === 'true';

  // TEMP: Force production for testing direct channel access
  const sdkUrl = 'https://pay.merchant.razer.com/RMS/API/seamless/latest/js/MOLPay_seamless.deco.js';

  return NextResponse.json({
    success: true,
    merchantID,
    sandboxMode,
    sdkUrl,
  });
}
