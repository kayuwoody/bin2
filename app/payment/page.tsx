"use client";

import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Suspense, useEffect, useState } from 'react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  
  const vcode = searchParams.get('vcode');
  const orderID = searchParams.get('orderID');
  const amount = searchParams.get('amount');
  
  // PINNED CONTEXT CONSTANTS
  const MERCHANT_ID = "SB_coffeeoasisplt";
  const FIUU_SCRIPT_URL = "https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js";

  useEffect(() => {
    // This function only runs once jQuery is detected
    const injectFiuuScript = () => {
      if (document.getElementById('fiuu-seamless-script')) return;

      const script = document.createElement('script');
      script.id = 'fiuu-seamless-script';
      script.src = FIUU_SCRIPT_URL;
      script.async = true;
      
      script.onload = () => {
        console.log("✅ Fiuu Script Ready");
        if (window.MOLPaySeamless) {
          window.MOLPaySeamless.init();
        }
        setIsReady(true);
      };

      document.body.appendChild(script);
    };

    // Poll every 100ms to check if jQuery has loaded globally
    const timer = setInterval(() => {
      if (window.jQuery) {
        clearInterval(timer);
        injectFiuuScript();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [FIUU_SCRIPT_URL]);

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Error: Missing session data. Please restart checkout.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      {/* Load jQuery with high priority */}
      <Script 
        src="https://code.jquery.com" 
        strategy="beforeInteractive" 
      />

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border text-center">
        <h1 className="text-xl font-bold mb-4">Finalize Payment</h1>
        <p className="text-gray-500 mb-6">Order #{orderID}</p>

        <button
          type="button"
          data-toggle="molpayseamless"
          data-mpsmerchantid={MERCHANT_ID}
          data-mpschannel="credit" // FORCES DIRECT CREDIT CARD CHANNEL
          data-mpsamount={amount}
          data-mpsorderid={orderID}
          data-mpsvcode={vcode}
          data-mpscurrency="MYR"
          disabled={!isReady}
          className={`w-full font-bold py-4 px-4 rounded-lg transition-all ${
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isReady ? `Pay MYR ${amount} with Card` : "Initialising Gateway..."}
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading Page...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

// Global types for TypeScript
declare global {
  interface Window {
    jQuery: any;
    MOLPaySeamless: any;
  }
}
