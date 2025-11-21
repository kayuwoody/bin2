import { NextResponse } from 'next/server';
import { getFiuuService } from '@/lib/fiuuService';
import { updateWooOrder } from '@/lib/orderService';

/**
 * GET /api/payments/notify
 * URL verification endpoint - allows Fiuu to verify the webhook URL exists
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'Fiuu Payment Notification Webhook',
    status: 'ready',
    methods: ['POST'],
    note: 'This endpoint accepts POST requests from Fiuu payment gateway for payment notifications',
  });
}

/**
 * POST /api/payments/notify
 * Webhook endpoint - called by Fiuu when payment is completed
 *
 * CRITICAL: This is the most reliable callback
 * Always use this to update order status, not return URL
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // Extract Fiuu callback parameters
    const callback = {
      tranID: params.get('tranID') || '',
      orderid: params.get('orderid') || '',
      status: params.get('status') || '',
      domain: params.get('domain') || '',
      amount: params.get('amount') || '',
      currency: params.get('currency') || '',
      paydate: params.get('paydate') || '',
      skey: params.get('skey') || '',
      channel: params.get('channel') || '',
      appcode: params.get('appcode') || '',
      error_desc: params.get('error_desc') || '',
    };

    console.log(`📥 Fiuu webhook received for order ${callback.orderid}:`, {
      status: callback.status,
      tranID: callback.tranID,
      amount: callback.amount,
    });

    // Initialize Fiuu service
    const fiuu = getFiuuService();

    // CRITICAL: Verify callback signature to prevent fraud
    const isValid = fiuu.verifyCallback(callback);
    if (!isValid) {
      console.error('❌ Invalid Fiuu callback signature!', callback);
      return new NextResponse('INVALID_SIGNATURE', { status: 400 });
    }

    // Check payment status
    const isSuccess = fiuu.isPaymentSuccessful(callback.status);
    const statusDesc = fiuu.getStatusDescription(callback.status);

    console.log(`💳 Payment ${callback.orderid}: ${statusDesc} (${callback.status})`);

    // Skip WooCommerce update for Fiuu demo/test orders
    if (callback.orderid.startsWith('DEMO')) {
      console.log(`⚠️ Skipping WooCommerce update for demo order ${callback.orderid}`);
      return new NextResponse('OK', { status: 200 });
    }

    // Update WooCommerce order based on payment status
    if (isSuccess) {
      // Payment successful - mark order as processing
      await updateWooOrder(callback.orderid, {
        status: 'processing',
        meta_data: [
          { key: '_fiuu_transaction_id', value: callback.tranID },
          { key: '_fiuu_payment_status', value: callback.status },
          { key: '_fiuu_payment_date', value: callback.paydate },
          { key: '_fiuu_payment_channel', value: callback.channel },
          { key: '_fiuu_payment_amount', value: callback.amount },
          { key: '_fiuu_app_code', value: callback.appcode },
        ],
      });

      console.log(`✅ Order ${callback.orderid} marked as processing (payment successful)`);
    } else if (callback.status === '11') {
      // Payment failed
      await updateWooOrder(callback.orderid, {
        status: 'failed',
        meta_data: [
          { key: '_fiuu_transaction_id', value: callback.tranID },
          { key: '_fiuu_payment_status', value: callback.status },
          { key: '_fiuu_error_desc', value: callback.error_desc },
        ],
      });

      console.log(`❌ Order ${callback.orderid} marked as failed (payment failed)`);
    } else {
      // Pending or processing - log but don't update order yet
      console.log(`⏳ Order ${callback.orderid} payment pending (status: ${callback.status})`);
    }

    // IMPORTANT: Fiuu expects "OK" response
    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('❌ Fiuu webhook error:', error);
    // Still return OK to prevent Fiuu from retrying failed webhooks endlessly
    // Log the error but acknowledge receipt
    return new NextResponse('OK', { status: 200 });
  }
}
