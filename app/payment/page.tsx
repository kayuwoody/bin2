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
  const FIUU_SCRIPT_URL = "https://sandbox-payment.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js"

  useEffect(() => {
    // 1. Manually create the jQuery script
    const jquery = document.createElement('script');
    jquery.src = "https://code.jquery.com/jquery-3.7.1.min.js";
    jquery.async = false; // Execute in order

    jquery.onload = () => {
      console.log("✅ 1. jQuery is now on the window object.");
      
      // 2. Only after jQuery loads, create the Fiuu script
      const fiuu = document.createElement('script');
      fiuu.src = FIUU_SCRIPT_URL;
      fiuu.async = false; // Execute in order

      fiuu.onload = () => {
        console.log("✅ 2. Fiuu Script is now on the window object.");
        // Initialize if the script requires it
        if (window.MOLPaySeamless) window.MOLPaySeamless.init();
        setIsReady(true);
      };
      
      document.body.appendChild(fiuu);
    };

    document.body.appendChild(jquery);

    return () => {
      // Cleanup to prevent duplicate script injection on hot-reloads
      const s1 = document.getElementById('fiuu-script');
      if (s1) s1.remove();
    };
  }, []);

  const handlePayment = () => {
    if (window.FiuuSeamless) {
      const fiuu = new window.FiuuSeamless({
        merchantId: MERCHANT_ID,
        verifyUrl: "https://sandbox-payment.fiuu.com/RMS/verify",
      });

      fiuu.pay({
        amount: amount,
        orderId: orderID,
        vcode: vcode,
        currency: "MYR",
        paymentMethod: "credit", // Bypass selection
        billName: "Coffee Oasis Customer",
        billEmail: "customer@coffee-oasis.com.my",
        billDesc: `Order #${orderID}`,
        returnUrl: "https://app.coffee-oasis.com.my/api/payments/return",
        callbackUrl: "https://app.coffee-oasis.com.my/api/payments/callback",
        notifyUrl: "https://app.coffee-oasis.com.my/api/payments/notify"
      });
    }
  };

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Missing session data.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border text-center w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Complete Payment</h1>
        <p className="mb-6 text-gray-500">Order #{orderID}</p>
        
        <button
          type="button"
          onClick={handlePayment}
          disabled={!isReady}
          className={`w-full font-bold py-4 px-6 rounded-lg transition-all ${
            isReady ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500'
          }`}
        >
          {isReady ? `Pay MYR ${amount} with Card` : "Connecting to Gateway..."}
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
    MOLPaySeamless: any;
  }
}
