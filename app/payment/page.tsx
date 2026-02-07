"use client";

import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Suspense, useState } from 'react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  
  const vcode = searchParams.get('vcode');
  const orderID = searchParams.get('orderID');
  const amount = searchParams.get('amount');
  
  // PINNED CONTEXT
  const MERCHANT_ID = "SB_coffeeoasisplt";
  const FIUU_SCRIPT_URL = "https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js";

  // This runs when the PINNED SCRIPT is actually loaded
  const onFiuuLoad = () => {
    console.log("✅ Fiuu Script Loaded");
    if (window.MOLPaySeamless) {
      window.MOLPaySeamless.init();
      setIsReady(true);
    }
  };

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Missing session data. Please restart checkout.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      {/* 1. Load jQuery with BEFORE INTERACTIVE */}
      <Script 
        src="https://code.jquery.com" 
        strategy="beforeInteractive" 
      />

      {/* 2. Load Fiuu ONLY AFTER page is interactive */}
      <Script 
        src={FIUU_SCRIPT_URL} 
        strategy="afterInteractive"
        onLoad={onFiuuLoad}
      />

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border text-center">
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
          className={`w-full font-bold py-4 px-4 rounded-lg transition-all ${
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
