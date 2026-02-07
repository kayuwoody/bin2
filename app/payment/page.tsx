"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from "react";
import Script from 'next/script';
import { Suspense } from 'react';

function PaymentContent() {
  const searchParams = useSearchParams();
  
  // Get data passed from your initiate call
  const vcode = searchParams.get('vcode');
  const orderID = searchParams.get('orderID');
  const amount = searchParams.get('amount');
  const merchantID = "SB_coffeeoasisplt"; // Ensure this matches your Sandbox ID

useEffect(() => {
    // This function manually loads the Fiuu script after jQuery is confirmed
    const loadFiuu = () => {
      if (window.jQuery && !document.getElementById('fiuu-seamless-script')) {
        const script = document.createElement('script');
        script.id = 'fiuu-seamless-script';
// Ensure this is the EXACT full path to the JS file
script.src = "https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js";
        script.async = true;
        script.onload = () => {
          console.log("✅ Fiuu Script Loaded & jQuery Ready");
          if (window.MOLPaySeamless) window.MOLPaySeamless.init();
          setIsReady(true);
        };
        document.body.appendChild(script);
      }
    };

    // Check every 100ms if jQuery is ready
    const interval = setInterval(() => {
      if (window.jQuery) {
        clearInterval(interval);
        loadFiuu();
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);
  
  if (!vcode || !orderID || !amount) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Invalid session. Please return to checkout.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      {/* Load jQuery reliably */}
      <Script 
        src="https://code.jquery.com" 
        strategy="beforeInteractive"
      />

      <h1 className="text-2xl font-bold mb-6">Finalize Your Payment</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md border">
        <p className="mb-4">Order ID: #{orderID}</p>
        
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
          className={`w-full font-bold py-3 px-4 rounded transition-colors ${
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 text-gray-200 cursor-not-all'
          }`}
        >
          {isReady ? `Pay MYR ${amount} with Card` : "Initialising Gateway..."}
        </button>
      </div>
    </div>
  );
}

// Wrap in Suspense because we are using useSearchParams
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading payment gateway...</div>}>
      <PaymentContent />
    </Suspense>
  );
}


// Add TypeScript Global Type definitions
declare global {
  interface Window {
    jQuery: any;
    MOLPaySeamless: any;
  }
}


