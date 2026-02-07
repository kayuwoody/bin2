"use client";

import { useSearchParams } from 'next/navigation';
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
    // Polling as a fallback to see when the library actually attaches to window
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.MOLPaySeamless) {
        console.log("✅ MOLPaySeamless detected on window!");
        window.MOLPaySeamless.init();
        setIsReady(true);
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Missing session data.</div>;
  }

  return (
    <div className="flex flex-col items-center p-10">
      {/* 
        FORCE SERIAL LOADING: 
        We inject raw HTML to ensure the browser sees jQuery BEFORE the Razer Script.
      */}
      <div dangerouslySetInnerHTML={{ __html: `
        <script src="https://code.jquery.com"></script>
        <script src="${FIUU_SCRIPT_URL}"></script>
      `}} />

      <div className="bg-white p-8 rounded-lg shadow-md border text-center w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Complete Payment</h1>
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
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500'
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

declare global {
  interface Window {
    jQuery: any;
    MOLPaySeamless: any;
  }
}
