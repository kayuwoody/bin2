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
        console.log('📦 Loading modern Fiuu Seamless script...');

        // Determine if sandbox or production
        const merchantID = searchParams.get('merchantID') || '';
        const isSandbox = merchantID.startsWith('SB_');

        const scriptUrl = isSandbox
          ? 'https://sandbox-payment.fiuu.com/SeamlessPayment/fiuu-seamless.min.js'
          : 'https://payment.fiuu.com/SeamlessPayment/fiuu-seamless.min.js';

        // Load script
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.onload = () => {
          console.log('✅ Modern Fiuu Seamless script loaded');
          scriptLoaded.current = true;
          setLoading(false);
          setReady(true);
        };
        script.onerror = () => {
          throw new Error('Failed to load Fiuu Seamless script');
        };
        document.body.appendChild(script);
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
      if (!window.FiuuSeamless) {
        throw new Error('Fiuu Seamless library not loaded');
      }

      // Get payment parameters
      const merchantID = searchParams.get('merchantID') || '';
      const amount = searchParams.get('amount') || '';
      const orderid = searchParams.get('orderid') || '';
      const bill_name = searchParams.get('bill_name') || '';
      const bill_email = searchParams.get('bill_email') || '';
      const bill_desc = searchParams.get('bill_desc') || '';
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

    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed');
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
