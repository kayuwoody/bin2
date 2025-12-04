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

  // Initialize payment button handler
  useEffect(() => {
    if (!scriptsLoaded.current || loading) return;

    console.log('🔧 Setting up manual payment trigger...');

    const handlePayment = async (e: Event) => {
      e.preventDefault();
      console.log('💳 Payment button clicked, fetching params...');

      try {
        // Manually fetch payment params via AJAX
        const formData = new FormData();
        formData.append('merchantID', searchParams.get('merchantID') || '');
        formData.append('channel', searchParams.get('channel') || '');
        formData.append('amount', searchParams.get('amount') || '');
        formData.append('orderid', searchParams.get('orderid') || '');
        formData.append('bill_name', searchParams.get('bill_name') || '');
        formData.append('bill_email', searchParams.get('bill_email') || '');
        formData.append('bill_mobile', searchParams.get('bill_mobile') || '');
        formData.append('bill_desc', searchParams.get('bill_desc') || '');
        formData.append('currency', searchParams.get('currency') || '');
        formData.append('vcode', searchParams.get('vcode') || '');
        formData.append('returnurl', searchParams.get('returnurl') || '');
        formData.append('callbackurl', searchParams.get('callbackurl') || '');

        const response = await fetch('/api/payments/seamless-process', {
          method: 'POST',
          body: formData,
        });

        const params = await response.json();
        console.log('✅ Got seamless params:', params);

        if (params.status === false) {
          throw new Error(params.error_desc || 'Payment failed');
        }

        // Create a temporary button and call MOLPaySeamless on it
        const tempBtn = document.createElement('button');
        tempBtn.id = 'temp-seamless-btn';
        tempBtn.style.display = 'none';
        document.body.appendChild(tempBtn);

        console.log('🚀 Calling MOLPaySeamless with params...');
        window.$(tempBtn).MOLPaySeamless(params);

        // Trigger click on the temp button to open popup
        setTimeout(() => {
          tempBtn.click();
          console.log('👆 Triggered seamless button click');
        }, 500);
      } catch (error) {
        console.error('❌ Payment error:', error);
        setError(`Payment failed: ${error}`);
      }
    };

    // Attach handler to payment button
    const btn = document.getElementById('payment-trigger-btn');
    if (btn) {
      btn.addEventListener('click', handlePayment);
      console.log('✅ Payment handler attached to button');
    }

    return () => {
      if (btn) {
        btn.removeEventListener('click', handlePayment);
      }
    };
  }, [loading, scriptsLoaded, searchParams]);

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

            {/* Manual payment trigger - fetches params via AJAX then calls MOLPaySeamless */}
            <div className="mb-6">
              <button
                id="payment-trigger-btn"
                type="button"
                className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold shadow-lg"
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
