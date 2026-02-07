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
  const merchantID = "SB_coffeeoasisplt"; 

  useEffect(() => {
    // We define everything inside useEffect so setIsReady is definitely in scope
    const checkAndLoad = setInterval(() => {
      if (window.jQuery && !document.getElementById('fiuu-seamless-script')) {
        clearInterval(checkAndLoad);

        const script = document.createElement('script');
        script.id = 'fiuu-seamless-script';
        
        // VERIFIED FULL PATH - DO NOT TRUNCATE:
        script.src = "https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js";
        
        script.async = true;
        script.onload = () => {
          console.log("✅ Fiuu Script Loaded");
          if (window.MOLPaySeamless) {
            window.MOLPaySeamless.init();
          }
          setIsReady(true); 
        };

        document.body.appendChild(script);
      }
    }, 100);

    return () => clearInterval(checkAndLoad);
  }, []);

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-8 text-center text-red-500">Error: Invalid Order Data. Please restart checkout.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 font-sans">
      {/* jQuery is a hard dependency for this specific 3.28/Latest script */}
      <Script 
        src="https://code.jquery.com" 
        strategy="beforeInteractive" 
      />

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 text-center">
        <h1 className="text-xl font-bold mb-6">Secure Checkout</h1>
        
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Amount</p>
          <p className="text-4xl font-black text-blue-600">MYR {amount}</p>
          <p className="text-gray-400 text-sm mt-2">Order #{orderID}</p>
        </div>

        <button
          type="button"
          data-toggle="molpayseamless"
          data-mpsmerchantid={merchantID}
          data-mpschannel="credit"
          data-mpsamount={amount}
          data-mpsorderid={orderID}
          data-mpsvcode={vcode}
          data-mpscurrency="MYR"
          disabled={!isReady}
          className={`w-full font-bold py-4 px-4 rounded-xl transition-all duration-200 ${
            isReady 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isReady ? "Pay with Credit Card" : "Initialising Gateway..."}
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
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
