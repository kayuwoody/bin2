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

        // Create form using DOM methods (not innerHTML) for proper DOM insertion
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/payments/seamless-process';
        form.setAttribute('role', 'molpayseamless');
        form.id = 'seamless-payment-form';

        // Add all hidden inputs
        const fields = {
          'merchantID': searchParams.get('merchantID') || '',
          'channel': searchParams.get('channel') || '',
          'amount': searchParams.get('amount') || '',
          'orderid': searchParams.get('orderid') || '',
          'bill_name': searchParams.get('bill_name') || '',
          'bill_email': searchParams.get('bill_email') || '',
          'bill_mobile': searchParams.get('bill_mobile') || '',
          'bill_desc': searchParams.get('bill_desc') || '',
          'currency': searchParams.get('currency') || '',
          'vcode': searchParams.get('vcode') || '',
          'returnurl': searchParams.get('returnurl') || '',
          'callbackurl': searchParams.get('callbackurl') || '',
        };

        Object.entries(fields).forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });

        // Add submit button
        const button = document.createElement('button');
        button.type = 'submit';
        button.className = 'px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold shadow-lg';
        button.textContent = 'Click to Pay';
        form.appendChild(button);

        // Add form to container
        container.appendChild(form);
        console.log('✅ Form created with createElement and exists in DOM');
        console.log('📋 Form element:', form);
        console.log('📋 Form has role attribute:', form.getAttribute('role'));

        // NOW load Fiuu Seamless - it will scan and find our form!
        console.log('📦 Loading MOLPaySeamless script (form already exists)...');
        await loadScript(config.fiuuScriptUrl);
        console.log('✅ Fiuu Seamless loaded - should have found form');

        // Verify plugin
        if (!window.$ || typeof window.$.fn.MOLPaySeamless !== 'function') {
          throw new Error('MOLPaySeamless plugin not available');
        }

        console.log('✅ MOLPaySeamless verified');

        // The plugin scans on load, but we need to manually reinitialize
        // Check if there's an init method we can call
        console.log('🔄 Checking plugin initialization...');

        const $forms = window.$('form[role="molpayseamless"]');
        console.log('📋 Found forms with role="molpayseamless":', $forms.length);

        if ($forms.length === 0) {
          console.error('❌ No forms found! Form was not created properly.');
        } else {
          console.log('✅ Form found in DOM');

          // Check if the plugin attached any data to the form
          const formData = $forms.data();
          console.log('📋 Form jQuery data:', formData);

          // Try to manually trigger the plugin's form scanning
          // The plugin should have attached on document ready, but let's force it
          if (typeof window.$.molpayseamless !== 'undefined') {
            console.log('🔧 Found molpayseamless object, trying to initialize...');
          }

          // Check if form has submit handler attached
          const events = window.$._data($forms[0], 'events');
          console.log('📋 Form events attached:', events);
        }

        console.log('✅ Setup complete - form should intercept on submit!');
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
