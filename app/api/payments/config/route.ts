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

    // Determine URLs based on sandbox mode
    const scriptUrl = sandboxMode
      ? 'https://sandbox-payment.fiuu.com/SeamlessPayment/fiuu-seamless.min.js'
      : 'https://payment.fiuu.com/SeamlessPayment/fiuu-seamless.min.js';

    const verifyUrl = sandboxMode
      ? 'https://sandbox-payment.fiuu.com/RMS/verify'
      : 'https://payment.fiuu.com/RMS/verify';

    return NextResponse.json({
      merchantId: merchantID,
      sandboxMode,
      scriptUrl,
      verifyUrl,
    });
  } catch (error) {
    console.error('Failed to get Fiuu config:', error);
    return NextResponse.json(
      { error: 'Failed to get payment configuration' },
      { status: 500 }
    );
  }
}
