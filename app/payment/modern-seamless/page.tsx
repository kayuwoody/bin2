"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Declare global types for Fiuu Seamless
declare global {
  interface Window {
    FiuuSeamless: any;
  }
}

function ModernSeamlessContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const loadSeamlessScript = async () => {
      try {
        console.log('📦 Loading jQuery and Fiuu Seamless script...');

        // Determine if sandbox or production
        const merchantID = searchParams.get('merchantID') || '';
        const isSandbox = merchantID.startsWith('SB_');

        // Step 1: Load jQuery FIRST (required by MOLPay seamless)
        const jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
        jqueryScript.async = false; // Load synchronously

        await new Promise<void>((resolve, reject) => {
          jqueryScript.onload = () => {
            console.log('✅ jQuery loaded');
            resolve();
          };
          jqueryScript.onerror = () => reject(new Error('Failed to load jQuery'));
          document.body.appendChild(jqueryScript);
        });

        // Step 2: Load Fiuu Seamless script AFTER jQuery
        // Per Fiuu support: Use MOLPay_seamless.deco.js (not fiuu-seamless.min.js)
        const scriptUrl = isSandbox
          ? 'https://sandbox-payment.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js'
          : 'https://pay.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js';

        console.log('📜 Fiuu Script URL:', scriptUrl);

        const fiuuScript = document.createElement('script');
        fiuuScript.src = scriptUrl;
        fiuuScript.async = false;

        await new Promise<void>((resolve, reject) => {
          fiuuScript.onload = () => {
            console.log('✅ Fiuu Seamless script loaded successfully');

            // Debug: Log what's actually available on window
            console.log('🔍 Checking window globals:', {
              FiuuSeamless: typeof window.FiuuSeamless,
              MOLPay: typeof (window as any).MOLPay,
              molpay: typeof (window as any).molpay,
              jQuery: typeof (window as any).jQuery,
              jQueryFn: (window as any).jQuery ? Object.keys((window as any).jQuery.fn).filter((k: string) => k.toLowerCase().includes('mol') || k.toLowerCase().includes('fiuu')) : [],
            });

            resolve();
          };
          fiuuScript.onerror = () => reject(new Error('Failed to load Fiuu Seamless script'));
          document.body.appendChild(fiuuScript);
        });

        scriptLoaded.current = true;
        setLoading(false);
        setReady(true);
      } catch (err: any) {
        console.error('❌ Failed to load Fiuu Seamless:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadSeamlessScript();
  }, [searchParams]);

  const handlePayment = () => {
    try {
      const $ = (window as any).jQuery;

      // Debug: Log what's available when button is clicked
      console.log('🔍 Window globals at button click:', {
        FiuuSeamless: typeof window.FiuuSeamless,
        MOLPay: typeof (window as any).MOLPay,
        molpay: typeof (window as any).molpay,
        jQuery: typeof $,
        jQueryPlugins: $ ? Object.keys($.fn).filter((k: string) => k.toLowerCase().includes('mol') || k.toLowerCase().includes('fiuu')) : [],
      });

      // Try new API first, fall back to old jQuery plugin API
      if (window.FiuuSeamless) {
        console.log('Using new FiuuSeamless API');
        useNewSeamlessAPI();
      } else if ($ && $.fn.MOLPaySeamless) {
        console.log('Using old jQuery MOLPaySeamless plugin API');
        useOldJQueryAPI($);
      } else {
        throw new Error('No Fiuu payment API available - check console for available globals');
      }
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed');
    }
  };

  const useNewSeamlessAPI = () => {

      // Get payment parameters
      const merchantID = searchParams.get('merchantID') || '';
      const amount = searchParams.get('amount') || '';
      const orderid = searchParams.get('orderid') || '';
      const bill_name = searchParams.get('bill_name') || '';
      const bill_email = searchParams.get('bill_email') || '';
      const bill_mobile = searchParams.get('bill_mobile') || '';
      const bill_desc = searchParams.get('bill_desc') || '';
      const currency = searchParams.get('currency') || 'MYR';
      const returnurl = searchParams.get('returnurl') || '';
      const callbackurl = searchParams.get('callbackurl') || '';
      const notifyurl = searchParams.get('notifyurl') || '';

      console.log('💳 Initializing modern Fiuu Seamless payment');
      console.log('📋 Payment params:', {
        merchantID,
        amount,
        orderid,
        bill_name,
        bill_email,
        bill_mobile,
        currency,
      });

      // Determine verify URL based on environment
      const isSandbox = merchantID.startsWith('SB_');
      const verifyUrl = isSandbox
        ? 'https://sandbox-payment.fiuu.com/RMS/verify'
        : 'https://payment.fiuu.com/RMS/verify';

      // Initialize Fiuu Seamless (modern API)
      const fiuu = new window.FiuuSeamless({
        merchantId: merchantID,
        verifyUrl: verifyUrl,
      });

      console.log('✅ Fiuu Seamless initialized');
      console.log('🚀 Triggering payment popup...');

      // Trigger payment (this opens the popup directly to payment form)
      // Match support example exactly - only these fields
      fiuu.pay({
        amount: amount,
        orderId: orderid,
        billName: bill_name,
        billEmail: bill_email,
        billDesc: bill_desc,
        returnUrl: returnurl,
        callbackUrl: callbackurl,
        notifyUrl: notifyurl,
      });

      console.log('🎉 Payment popup should be open now');
  };

  const useOldJQueryAPI = ($: any) => {
    // Get payment parameters
    const merchantID = searchParams.get('merchantID') || '';
    const amount = searchParams.get('amount') || '';
    const orderid = searchParams.get('orderid') || '';
    const bill_name = searchParams.get('bill_name') || '';
    const bill_email = searchParams.get('bill_email') || '';
    const bill_mobile = searchParams.get('bill_mobile') || '';
    const bill_desc = searchParams.get('bill_desc') || '';
    const currency = searchParams.get('currency') || 'MYR';
    const returnurl = searchParams.get('returnurl') || '';
    const callbackurl = searchParams.get('callbackurl') || '';
    const notifyurl = searchParams.get('notifyurl') || '';
    const vcode = searchParams.get('vcode') || '';

    console.log('💳 Using MOLPay jQuery plugin API with data attributes');
    console.log('📋 All payment params:', {
      merchantID,
      amount,
      orderid,
      bill_name,
      bill_email,
      bill_mobile,
      bill_desc,
      currency,
      returnurl,
      callbackurl,
      notifyurl,
      vcode,
    });

    // Create button with data attributes (per MOLPay seamless plugin docs)
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'molpay-seamless-trigger';
    button.setAttribute('data-toggle', 'molpayseamless');
    button.setAttribute('data-mpsmerchantid', merchantID);
    button.setAttribute('data-mpschannel', 'credit');  // Force credit card channel
    button.setAttribute('data-mpsamount', amount);
    button.setAttribute('data-mpsorderid', orderid);
    button.setAttribute('data-mpsbill_name', bill_name);
    button.setAttribute('data-mpsbill_email', bill_email);
    button.setAttribute('data-mpsbill_mobile', bill_mobile);
    button.setAttribute('data-mpsbill_desc', bill_desc);
    button.setAttribute('data-mpscurrency', currency);
    button.setAttribute('data-mpsreturnurl', returnurl);
    button.setAttribute('data-mpscallbackurl', callbackurl);
    button.setAttribute('data-mpsvcode', vcode);
    if (notifyurl) {
      button.setAttribute('data-mpsnotifyurl', notifyurl);
    }
    button.style.display = 'none';

    console.log('📤 MOLPay seamless button attributes:', {
      'data-toggle': 'molpayseamless',
      'data-mpsmerchantid': merchantID,
      'data-mpschannel': 'credit',
      'data-mpsamount': amount,
      'data-mpsorderid': orderid,
      'data-mpsvcode': vcode,
    });

    // Add button to DOM
    document.body.appendChild(button);

    // Initialize MOLPaySeamless plugin and trigger click
    try {
      // Initialize the plugin on the button
      $(button).MOLPaySeamless();

      // Trigger the payment
      $(button).trigger('click');

      console.log('🎉 MOLPay seamless payment triggered');
    } catch (err) {
      console.error('❌ Failed to trigger MOLPay seamless:', err);
      throw err;
    } finally {
      // Clean up button after a delay
      setTimeout(() => {
        document.body.removeChild(button);
      }, 1000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Payment System</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">💳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ready to Pay</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to open the payment window
        </p>
        <button
          onClick={handlePayment}
          className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold shadow-lg"
        >
          Pay Now
        </button>
        <p className="text-sm text-gray-500 mt-4">
          A secure payment window will open
        </p>
      </div>
    </div>
  );
}

export default function ModernSeamlessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    }>
      <ModernSeamlessContent />
    </Suspense>
  );
}
