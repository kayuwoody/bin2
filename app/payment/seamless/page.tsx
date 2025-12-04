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

  useEffect(() => {
    const initSeamless = async () => {
      try {
        console.log('📦 Loading seamless scripts...');

        // Load config to get script URLs
        const configResponse = await fetch('/api/payments/config');
        const config = await configResponse.json();

        // Load jQuery FIRST
        await loadScript(config.jqueryUrl);
        console.log('✅ jQuery loaded');

        // NOW create the form BEFORE loading MOLPaySeamless
        // This ensures the form exists when the plugin's $(document).ready() fires
        console.log('🔧 Creating form BEFORE loading MOLPaySeamless script...');
        const container = document.getElementById('payment-form-container');
        if (!container) {
          throw new Error('Payment container not found');
        }

        const formHTML = `
          <form method="POST" action="/api/payments/seamless-process" role="molpayseamless" id="seamless-payment-form">
            <input type="hidden" name="merchantID" value="${searchParams.get('merchantID') || ''}" />
            <input type="hidden" name="channel" value="${searchParams.get('channel') || ''}" />
            <input type="hidden" name="amount" value="${searchParams.get('amount') || ''}" />
            <input type="hidden" name="orderid" value="${searchParams.get('orderid') || ''}" />
            <input type="hidden" name="bill_name" value="${searchParams.get('bill_name') || ''}" />
            <input type="hidden" name="bill_email" value="${searchParams.get('bill_email') || ''}" />
            <input type="hidden" name="bill_mobile" value="${searchParams.get('bill_mobile') || ''}" />
            <input type="hidden" name="bill_desc" value="${searchParams.get('bill_desc') || ''}" />
            <input type="hidden" name="currency" value="${searchParams.get('currency') || ''}" />
            <input type="hidden" name="vcode" value="${searchParams.get('vcode') || ''}" />
            <input type="hidden" name="returnurl" value="${searchParams.get('returnurl') || ''}" />
            <input type="hidden" name="callbackurl" value="${searchParams.get('callbackurl') || ''}" />

            <button type="submit" class="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold shadow-lg">
              Click to Pay
            </button>
          </form>
        `;

        container.innerHTML = formHTML;
        console.log('✅ Form created and exists in DOM');

        // NOW load Fiuu Seamless - it will scan and find our form!
        console.log('📦 Loading MOLPaySeamless script (form already exists)...');
        await loadScript(config.fiuuScriptUrl);
        console.log('✅ Fiuu Seamless loaded - should have found form');

        // Verify plugin
        if (!window.$ || typeof window.$.fn.MOLPaySeamless !== 'function') {
          throw new Error('MOLPaySeamless plugin not available');
        }

        console.log('✅ MOLPaySeamless verified');
        console.log('✅ Form should now intercept submissions and open popup!');
        scriptsLoaded.current = true;
        setLoading(false);
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
              Click the button below to proceed with payment.
            </p>
          </>
        )}

        {/* Container always present so form can be created during loading */}
        <div id="payment-form-container" className="mb-6" style={{ display: loading ? 'none' : 'block' }}></div>

        {!loading && !error && (
          <p className="text-sm text-gray-500">
            A popup window will appear with the payment form.
            <br />
            You can close this tab after completing payment.
          </p>
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
