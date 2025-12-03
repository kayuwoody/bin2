"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Declare jQuery types
declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

function SeamlessPaymentContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scriptsLoaded = useRef(false);
  const paymentTriggered = useRef(false);

  useEffect(() => {
    const initSeamless = async () => {
      try {
        // Get payment params from URL
        const merchantID = searchParams.get('merchantID');
        const channel = searchParams.get('channel');
        const amount = searchParams.get('amount');
        const orderid = searchParams.get('orderid');
        const bill_name = searchParams.get('bill_name');
        const bill_email = searchParams.get('bill_email');
        const bill_mobile = searchParams.get('bill_mobile');
        const bill_desc = searchParams.get('bill_desc');
        const currency = searchParams.get('currency');
        const vcode = searchParams.get('vcode');
        const returnurl = searchParams.get('returnurl');
        const callbackurl = searchParams.get('callbackurl');

        if (!merchantID || !amount || !orderid || !vcode) {
          throw new Error('Missing required payment parameters');
        }

        console.log('📦 Loading seamless scripts...');

        // Load config to get script URLs
        const configResponse = await fetch('/api/payments/config');
        const config = await configResponse.json();

        // Load jQuery
        await loadScript(config.jqueryUrl);
        console.log('✅ jQuery loaded');

        // Load Fiuu Seamless
        await loadScript(config.fiuuScriptUrl);
        console.log('✅ Fiuu Seamless loaded');

        // Verify plugin
        if (!window.$ || typeof window.$.fn.MOLPaySeamless !== 'function') {
          throw new Error('MOLPaySeamless plugin not available');
        }

        console.log('✅ MOLPaySeamless verified');
        scriptsLoaded.current = true;

        // Trigger payment after scripts loaded
        if (!paymentTriggered.current) {
          triggerPayment({
            merchantID,
            channel: channel || 'creditAN',
            amount,
            orderid,
            bill_name: bill_name || '',
            bill_email: bill_email || '',
            bill_mobile: bill_mobile || '',
            bill_desc: bill_desc || '',
            currency: currency || 'MYR',
            vcode,
            returnurl: returnurl || '',
            callbackurl: callbackurl || '',
          });
        }
      } catch (err: any) {
        console.error('❌ Seamless init error:', err);
        setError(err.message || 'Failed to initialize payment');
        setLoading(false);
      }
    };

    initSeamless();
  }, [searchParams]);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.body.appendChild(script);
    });
  };

  const triggerPayment = (params: any) => {
    paymentTriggered.current = true;

    console.log('🚀 Triggering seamless payment...');
    console.log('📦 Params:', params);

    // Create button for seamless
    const payBtn = document.createElement('button');
    payBtn.type = 'button';
    payBtn.id = `molpay-seamless-${params.orderid}`;
    payBtn.textContent = 'Pay Now';

    // Position off-screen but keep in DOM flow
    payBtn.style.position = 'absolute';
    payBtn.style.left = '-9999px';
    payBtn.style.top = '0';

    document.body.appendChild(payBtn);

    console.log('✅ Button created');
    console.log('🔧 Initializing MOLPaySeamless with JavaScript...');

    // Use jQuery to initialize MOLPaySeamless (not data attributes)
    window.$(payBtn).MOLPaySeamless({
      mpsmerchantid: params.merchantID,
      mpschannel: params.channel,
      mpsamount: params.amount,
      mpsorderid: params.orderid,
      mpsbill_name: params.bill_name,
      mpsbill_email: params.bill_email,
      mpsbill_mobile: params.bill_mobile,
      mpsbill_desc: params.bill_desc,
      mpscurrency: params.currency,
      mpsvcode: params.vcode,
      mpsreturnurl: params.returnurl,
      mpscallbackurl: params.callbackurl,
    });

    console.log('✅ MOLPaySeamless initialized with params');

    // Auto-trigger popup
    setTimeout(() => {
      console.log('🎯 Clicking button to trigger popup...');
      payBtn.click();
      console.log('✅ Button clicked');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {loading && !error && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Payment Gateway</h1>
            <p className="text-gray-600">
              Please wait while we prepare your payment...
            </p>
          </>
        )}

        {error && (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close This Tab
            </button>
          </>
        )}

        {!loading && !error && (
          <>
            <div className="text-green-500 text-5xl mb-4">💳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Window Ready</h1>
            <p className="text-gray-600 mb-4">
              Complete your payment in the popup window.
            </p>
            <p className="text-sm text-gray-500">
              You can close this tab after payment is complete.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SeamlessPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    }>
      <SeamlessPaymentContent />
    </Suspense>
  );
}
