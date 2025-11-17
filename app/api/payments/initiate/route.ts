import { NextResponse } from 'next/server';
import { getFiuuService } from '@/lib/fiuuService';
import { handleApiError, validationError } from '@/lib/api/error-handler';

/**
 * POST /api/payments/initiate
 * Generate Fiuu payment URL for customer redirect
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderID,
      amount,
      currency = 'MYR',
      paymentMethod = 'credit', // Default to showing all payment methods
      customerName,
      customerEmail,
      customerPhone,
      description,
    } = body;

    // Validation
    if (!orderID || !amount) {
      return validationError('orderID and amount are required', '/api/payments/initiate');
    }

    // Get app URL from environment
    const appURL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (!appURL) {
      throw new Error('NEXT_PUBLIC_APP_URL not configured');
    }

    // Initialize Fiuu service
    const fiuu = getFiuuService();

    // Generate payment URL
    const paymentURL = fiuu.generatePaymentURL({
      orderID: String(orderID),
      amount: String(amount),
      currency,
      paymentMethod,
      returnURL: `${appURL}/api/payments/return`,
      notifyURL: `${appURL}/api/payments/notify`,
      callbackURL: `${appURL}/api/payments/callback`,
      bill_name: customerName || 'Coffee Oasis Customer',
      bill_email: customerEmail || 'customer@coffee-oasis.com.my',
      bill_mobile: customerPhone || '',
      bill_desc: description || `Order #${orderID}`,
    });

    console.log(`✅ Generated Fiuu payment URL for order ${orderID}: ${paymentURL}`);

    return NextResponse.json({
      success: true,
      paymentURL,
      orderID,
      amount,
      currency,
    });
  } catch (error) {
    return handleApiError(error, '/api/payments/initiate');
  }
}
