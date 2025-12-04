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

    console.log('🚀 Preparing seamless payment...');
    console.log('📦 Params:', params);

    // Set loading to false FIRST so the UI container renders
    setLoading(false);

    // Wait for next tick to ensure DOM is updated
    setTimeout(() => {
      // Create button for JavaScript initialization (required for dynamic buttons)
      const payBtn = document.createElement('button');
      payBtn.type = 'button';
      payBtn.id = `molpay-seamless-${params.orderid}`;
      payBtn.textContent = 'Click to Pay';
      payBtn.className = 'px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold shadow-lg';

      // Add to the UI container FIRST (must be in DOM before MOLPaySeamless init)
      const container = document.getElementById('payment-button-container');
      if (container) {
        container.appendChild(payBtn);
        console.log('✅ Button added to container');
      } else {
        document.body.appendChild(payBtn);
        console.log('⚠️ Button added to body (container not found)');
      }

      console.log('🔍 Raw params received:', params);

      // Initialize MOLPaySeamless using JavaScript (required for dynamically created buttons)
      // data-toggle only works for buttons present when script loads
      try {
        const seamlessOptions = {
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
        };

        console.log('🔧 Initializing MOLPaySeamless with options:', seamlessOptions);

        // Call MOLPaySeamless on the button
        window.$(`#${payBtn.id}`).MOLPaySeamless(seamlessOptions);

        console.log('✅ MOLPaySeamless initialized successfully');
        console.log('⏳ Click the button to open payment popup...');
      } catch (err) {
        console.error('❌ MOLPaySeamless initialization failed:', err);
        setError(`Failed to initialize payment: ${err}`);
      }
    }, 0); // End setTimeout
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
            <div className="text-purple-500 text-5xl mb-4">💳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ready to Pay</h1>
            <p className="text-gray-600 mb-6">
              Click the button below to open the payment window.
            </p>

            {/* Button will be inserted here */}
            <div id="payment-button-container" className="mb-6"></div>

            <p className="text-sm text-gray-500">
              A popup window will appear with the payment form.
              <br />
              You can close this tab after completing payment.
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
