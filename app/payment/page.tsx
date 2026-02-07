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
  
  // PINNED CONTEXT
  const MERCHANT_ID = "SB_coffeeoasisplt";
  const FIUU_SCRIPT_URL = "https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js";

  useEffect(() => {
    // 1. Function to manually inject the Fiuu script
    const loadFiuu = () => {
      if (window.jQuery && !document.getElementById('fiuu-seamless-script')) {
        const script = document.createElement('script');
        script.id = 'fiuu-seamless-script';
        script.src = FIUU_SCRIPT_URL;
        script.async = true;
        script.onload = () => {
          if (window.MOLPaySeamless) {
            window.MOLPaySeamless.init();
          }
          setIsReady(true); // Button turns blue here
        };
        document.body.appendChild(script);
      }
    };

    // 2. Poll for jQuery
    const interval = setInterval(() => {
      if (window.jQuery) {
        clearInterval(interval);
        loadFiuu();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [FIUU_SCRIPT_URL]);

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Missing session data. Please restart checkout.</div>;
  }

  return (
    <div className="flex flex-col items-center p-10">
      {/* Load jQuery reliably */}
      <Script 
        src="https://code.jquery.com" 
        strategy="beforeInteractive" 
      />

      <div className="bg-white p-6 rounded-lg shadow-md border text-center w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Confirm Payment</h1>
        <p className="mb-6 text-gray-500">Order #{orderID}</p>
        
        <button
          type="button"
          data-toggle="molpayseamless"
          data-mpsmerchantid={MERCHANT_ID}
          data-mpschannel="credit"
          data-mpsamount={amount}
          data-mpsorderid={orderID}
          data-mpsvcode={vcode}
          data-mpscurrency="MYR"
          disabled={!isReady}
          className={`w-full font-bold py-3 px-6 rounded transition-all ${
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500'
          }`}
        >
          {isReady ? `Pay MYR ${amount} with Card` : "Connecting to Fiuu..."}
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

declare global {
  interface Window {
    jQuery: any;
    MOLPaySeamless: any;
  }
}
