"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  
  const vcode = searchParams.get('vcode');
  const orderID = searchParams.get('orderID');
  const amount = searchParams.get('amount');
  
  const MERCHANT_ID = "SB_coffeeoasisplt";
  const FIUU_SCRIPT_URL = "https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js";

  useEffect(() => {
    // 1. Manually create the jQuery script tag
    const jQueryScript = document.createElement('script');
    jQueryScript.src = "https://code.jquery.com";
    jQueryScript.async = false; // LOAD IN ORDER
    
    jQueryScript.onload = () => {
      console.log("✅ jQuery explicitly ready on window");
      
      // 2. ONLY NOW create the Fiuu script tag
      const fiuuScript = document.createElement('script');
      fiuuScript.src = FIUU_SCRIPT_URL;
      fiuuScript.async = false; // LOAD IN ORDER
      
      fiuuScript.onload = () => {
        console.log("✅ Fiuu Script explicitly ready");
        if (window.MOLPaySeamless) {
          window.MOLPaySeamless.init();
          setIsReady(true);
        }
      };
      document.body.appendChild(fiuuScript);
    };

    document.body.appendChild(jQueryScript);

    return () => {
      // Optional cleanup if needed
    };
  }, [FIUU_SCRIPT_URL]);

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Missing session data. Please restart checkout.</div>;
  }

  return (
    <div className="flex flex-col items-center p-10">
      <div className="bg-white p-8 rounded-lg shadow-md border text-center w-full max-w-md">
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
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
