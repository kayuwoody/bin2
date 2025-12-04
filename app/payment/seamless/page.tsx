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
  const [paymentParams, setPaymentParams] = useState<any>(null);
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

    // Store params in state so we can render the button with data attributes
    setPaymentParams(params);
    setLoading(false);
  };

  // Initialize MOLPaySeamless after button renders
  useEffect(() => {
    if (!paymentParams || !window.$) return;

    // Wait for button to be in DOM
    setTimeout(() => {
      const $btn = window.$('#molpay-seamless-btn');
      if ($btn.length === 0) {
        console.error('❌ Button not found in DOM');
        return;
      }

      console.log('🔧 Manually initializing MOLPaySeamless on rendered button');

      try {
        $btn.MOLPaySeamless({
          mpsmerchantid: paymentParams.merchantID,
          mpschannel: paymentParams.channel,
          mpsamount: paymentParams.amount,
          mpsorderid: paymentParams.orderid,
          mpsbill_name: paymentParams.bill_name,
          mpsbill_email: paymentParams.bill_email,
          mpsbill_mobile: paymentParams.bill_mobile,
          mpsbill_desc: paymentParams.bill_desc,
          mpscurrency: paymentParams.currency,
          mpsvcode: paymentParams.vcode,
          mpsreturnurl: paymentParams.returnurl,
          mpscallbackurl: paymentParams.callbackurl,
        });

        console.log('✅ MOLPaySeamless initialized on static button');
        console.log('📋 Button data:', $btn.data());
      } catch (err) {
        console.error('❌ Failed to initialize MOLPaySeamless:', err);
      }
    }, 100);
  }, [paymentParams]);

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

        {!loading && !error && paymentParams && (
          <>
            <div className="text-purple-500 text-5xl mb-4">💳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ready to Pay</h1>
            <p className="text-gray-600 mb-6">
              Click the button below to open the payment window.
            </p>

            {/* Static button with data-toggle for Fiuu auto-activation */}
            <div className="mb-6">
              <button
                type="button"
                id="molpay-seamless-btn"
                className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold shadow-lg"
                data-toggle="molpayseamless"
                data-mpsmerchantid={paymentParams.merchantID}
                data-mpschannel={paymentParams.channel}
                data-mpsamount={paymentParams.amount}
                data-mpsorderid={paymentParams.orderid}
                data-mpsbill_name={paymentParams.bill_name}
                data-mpsbill_email={paymentParams.bill_email}
                data-mpsbill_mobile={paymentParams.bill_mobile || ''}
                data-mpsbill_desc={paymentParams.bill_desc}
                data-mpscurrency={paymentParams.currency}
                data-mpsvcode={paymentParams.vcode}
                data-mpsreturnurl={paymentParams.returnurl}
                data-mpscallbackurl={paymentParams.callbackurl}
              >
                Click to Pay
              </button>
            </div>

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
