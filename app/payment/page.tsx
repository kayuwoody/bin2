"use client";

import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Suspense, useState, useEffect } from 'react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  
  const vcode = searchParams.get('vcode'); // You still need this for security
  const orderID = searchParams.get('orderID');
  const amount = searchParams.get('amount');
  const FIUU_SCRIPT_UR = "https://sandbox-payment.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js"

  // TRIGGER FUNCTION: This follows Fiuu Support's exact Step 3
  const handlePayment = () => {
    if (typeof window !== 'undefined' && (window as any).FiuuSeamless) {
      const fiuu = new (window as any).FiuuSeamless({
        merchantId: "SB_coffeeoasisplt",
        verifyUrl: "https://sandbox-payment.fiuu.com/RMS/verify",
      });

      fiuu.pay({
        amount: amount,
        orderId: orderID,
        vcode: vcode, // Signature generated from your backend
        paymentMethod: "credit", 
        currency: "MYR",
        billName: "Coffee Oasis Customer",
        billEmail: "customer@coffee-oasis.com.my",
        billDesc: `Order #${orderID}`,
        returnUrl: "https://app.coffee-oasis.com.my/api/payments/return",
        callbackUrl: "https://app.coffee-oasis.com.my/api/payments/callback",
        notifyUrl: "https://app.coffee-oasis.com.my/api/payments/notify"
      });
    }
  };

  // Auto-trigger when ready (optional) or wait for click
  useEffect(() => {
    if (isReady && vcode && orderID) {
      console.log("✅ Gateway ready, triggering pay()...");
      // handlePayment(); // Uncomment this to auto-trigger on load
    }
  }, [isReady, vcode, orderID]);

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Invalid session. Please restart checkout.</div>;
  }

  return (
    <div className="flex flex-col items-center p-10">
      {/* 1. Load jQuery with strict serial handling */}
      <Script 
        src="https://code.jquery.com/jquery-3.7.1.min.js" 
        strategy="beforeInteractive" 
      />

      {/* 2. ONLY LOAD FIUU AFTER JQUERY IS DEFINITELY ON WINDOW */}
      <Script 
        src={FIUU_SCRIPT_URL} 
        strategy="afterInteractive"
        onLoad={() => {
          console.log("✅ Fiuu Script Loaded");
          // Re-verify jQuery one last time before enabling button
          if (window.jQuery) {
            setIsReady(true);
          }
        }}
        />

      <h1 className="text-xl font-bold mb-4">Complete Your Payment</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-md border max-w-sm w-full">
        <p className="mb-6">Order ID: #{orderID}</p>
        
        <button
          type="button"
          onClick={handlePayment}
          disabled={!isReady}
          className={`w-full font-bold py-4 px-6 rounded-lg transition-all ${
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-gray-300 text-gray-500'
          }`}
        >
          {isReady ? `Pay MYR ${amount} Now` : "Initialising..."}
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
    FiuuSeamless: any;
  }
}



