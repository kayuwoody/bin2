import { NextResponse } from 'next/server';

/**
 * GET /api/payments/config
 * Returns public Fiuu configuration for client-side initialization
 * Does NOT expose sensitive keys
 */
export async function GET() {
  try {
    const merchantID = process.env.FIUU_MERCHANT_ID;
    const sandboxMode = process.env.FIUU_SANDBOX_MODE === 'true';

    if (!merchantID) {
      throw new Error('FIUU_MERCHANT_ID not configured');
    }

    // Fiuu Seamless uses jQuery plugin - same script URL for sandbox/production
    // The sandbox/production mode is determined by merchant ID prefix (SB_ = sandbox)
    const jqueryUrl = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
    const fiuuScriptUrl = 'https://pay.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js';

    return NextResponse.json({
      merchantId: merchantID,
      sandboxMode,
      jqueryUrl,
      fiuuScriptUrl,
    });
  } catch (error) {
    console.error('Failed to get Fiuu config:', error);
    return NextResponse.json(
      { error: 'Failed to get payment configuration' },
      { status: 500 }
    );
  }
}
