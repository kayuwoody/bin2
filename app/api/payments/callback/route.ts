import { NextResponse } from 'next/server';
import { getFiuuService } from '@/lib/fiuuService';
import { updateWooOrder } from '@/lib/orderService';

/**
 * POST /api/payments/callback
 * Delayed callback endpoint - called by Fiuu for non-realtime payments
 *
 * Used for payment methods that complete after initial response:
 * - Bank transfers
 * - QR code payments with delayed confirmation
 * - Over-the-counter payments
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // Extract Fiuu callback parameters (same as notify)
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

    console.log(`📞 Fiuu delayed callback for order ${callback.orderid}:`, {
      status: callback.status,
      tranID: callback.tranID,
    });

    // Initialize Fiuu service
    const fiuu = getFiuuService();

    // Verify callback signature
    const isValid = fiuu.verifyCallback(callback);
    if (!isValid) {
      console.error('❌ Invalid Fiuu callback signature!', callback);
      return new NextResponse('INVALID_SIGNATURE', { status: 400 });
    }

    // Check payment status
    const isSuccess = fiuu.isPaymentSuccessful(callback.status);
    const statusDesc = fiuu.getStatusDescription(callback.status);

    console.log(`💳 Delayed payment ${callback.orderid}: ${statusDesc} (${callback.status})`);

    // Update WooCommerce order
    if (isSuccess) {
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

      console.log(`✅ Order ${callback.orderid} marked as processing (delayed payment successful)`);
    } else if (callback.status === '11') {
      await updateWooOrder(callback.orderid, {
        status: 'failed',
        meta_data: [
          { key: '_fiuu_transaction_id', value: callback.tranID },
          { key: '_fiuu_payment_status', value: callback.status },
          { key: '_fiuu_error_desc', value: callback.error_desc },
        ],
      });

      console.log(`❌ Order ${callback.orderid} marked as failed (delayed payment failed)`);
    }

    // Return OK
    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('❌ Fiuu callback error:', error);
    return new NextResponse('OK', { status: 200 });
  }
}
