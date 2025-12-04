import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/seamless-process
 * Processes form submission from seamless payment page
 * Returns JSON for MOLPaySeamless plugin to open popup
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const merchantID = formData.get('merchantID') as string;
    const channel = formData.get('channel') as string;
    const amount = formData.get('amount') as string;
    const orderid = formData.get('orderid') as string;
    const bill_name = formData.get('bill_name') as string;
    const bill_email = formData.get('bill_email') as string;
    const bill_mobile = formData.get('bill_mobile') as string;
    const bill_desc = formData.get('bill_desc') as string;
    const currency = formData.get('currency') as string;
    const vcode = formData.get('vcode') as string;
    const returnurl = formData.get('returnurl') as string;
    const callbackurl = formData.get('callbackurl') as string;

    console.log('🔧 Seamless process received:', {
      merchantID,
      channel,
      amount,
      orderid,
    });
    console.log('💳 Channel value received:', channel);
    console.log('🎯 Expected: creditAN (for credit card forcing)');

    // Return JSON in format expected by MOLPaySeamless plugin
    // Based on seamless-demo-v3.28/process_order.php
    const params = {
      status: true,  // Must be true to proceed
      mpsmerchantid: merchantID,
      mpschannel: channel,
      mpsamount: amount,
      mpsorderid: orderid,
      mpsbill_name: bill_name,
      mpsbill_email: bill_email,
      mpsbill_mobile: bill_mobile || '',
      mpsbill_desc: bill_desc,
      mpscountry: 'MY',
      mpsvcode: vcode,
      mpscurrency: currency,
      mpslangcode: 'en',
      mpsreturnurl: returnurl,
      mpscallbackurl: callbackurl,
      mpsapiversion: '3.28',
    };

    console.log('✅ Returning seamless params for popup:', params);

    return NextResponse.json(params);
  } catch (error) {
    console.error('❌ Seamless process error:', error);

    // Return error format expected by MOLPaySeamless
    return NextResponse.json({
      status: false,
      error_code: '500',
      error_desc: 'Internal Server Error',
      failureurl: '/payment',
    }, { status: 500 });
  }
}
