import { NextResponse } from 'next/server';
import { getFiuuService } from '@/lib/fiuuService';

/**
 * POST /api/fiuu/seamless-params
 * Generate parameters for Fiuu Seamless SDK integration
 * Returns mps-prefixed params with mpsvcode for SDK initialization
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderID,
      amount,
      channel,
      billName = 'Customer',
      billEmail = 'customer@example.com',
      billMobile = '0123456789',
      billDesc = '',
      currency = 'MYR',
    } = body;

    if (!orderID || !amount || !channel) {
      return NextResponse.json(
        { success: false, error: 'orderID, amount, and channel are required' },
        { status: 400 }
      );
    }

    // Get app URL for return URL
    const appURL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '';

    // Initialize Fiuu service
    const fiuu = getFiuuService();

    // Generate vcode using Fiuu service
    const vcode = fiuu.generateVcode(amount, orderID);

    // Build mps-prefixed params for SDK
    // Note: Omitting mpscurrency to let Fiuu use default (sandbox may not support MYR)
    const params: Record<string, string> = {
      mpsmerchantid: process.env.FIUU_MERCHANT_ID || '',
      mpschannel: channel,
      mpsamount: amount,
      mpsorderid: orderID,
      mpsbill_name: billName,
      mpsbill_email: billEmail,
      mpsbill_mobile: billMobile,
      mpsbill_desc: billDesc || `Order #${orderID}`,
      mpsvcode: vcode,
      mpsreturnurl: `${appURL}/api/fiuu/return`,
    };

    console.log('Generated Fiuu Seamless params:', {
      ...params,
      mpsvcode: '[HIDDEN]',
    });

    return NextResponse.json({
      success: true,
      params,
    });
  } catch (error: any) {
    console.error('Error generating Fiuu seamless params:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate params' },
      { status: 500 }
    );
  }
}
