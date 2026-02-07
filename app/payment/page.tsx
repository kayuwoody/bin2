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
  const FIUU_SCRIPT_URL = "https://sandbox-payment.fiuu.com/RMS/API/seamless/3.28/js/MOLPay_seamless.deco.js";

  useEffect(() => {
    const jquery = document.createElement('script');
    // Using the version support suggested (1.11.1) for maximum compatibility
    jquery.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js";
    jquery.async = false;

    jquery.onload = () => {
      const fiuu = document.createElement('script');
      fiuu.src = FIUU_SCRIPT_URL;
      fiuu.async = false;
      fiuu.onload = () => {
        console.log("✅ jQuery & MOLPay Seamless Plugin Loaded");
        setIsReady(true);
      };
      document.body.appendChild(fiuu);
    };
    document.body.appendChild(jquery);
  }, []);

  const handlePayment = () => {
    // This follows the support Step: $('#myPay').MOLPaySeamless(options)
    if (window.jQuery && (window.jQuery.fn as any).MOLPaySeamless) {
      const options = {
        mpsmerchantid: MERCHANT_ID,
        mpschannel: "maybank2u", // FORCES CREDIT CARD CHANNEL
        mpsamount: amount,
        mpsorderid: orderID,
        mpsvcode: vcode,
        mpscurrency: "MYR",
        mpsbill_name: "Coffee Oasis Customer",
        mpsbill_email: "customer@coffee-oasis.com.my",
        mpsbill_desc: `Order #${orderID}`,
        mpsreturnurl: "https://app.coffee-oasis.com.my/api/payments/return",
                mpsnotifynurl: "https://app.coffee-oasis.com.my/api/payments/notify",
                mpscallbackurl: "https://app.coffee-oasis.com.my/api/payments/callback",
      };

      console.log("🚀 Triggering MOLPaySeamless with options:", options);
      window.jQuery('#payButton').MOLPaySeamless(options);
    } else {
      console.error("❌ MOLPaySeamless plugin not found on jQuery");
    }
  };

  if (!vcode || !orderID || orderID === "undefined") {
    return <div className="p-10 text-center">Missing session data.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white p-8 rounded-lg shadow-md border text-center w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Complete Payment</h1>
        <button
          id="payButton" // ID used by the jQuery selector
          type="button"
          onClick={handlePayment}
          disabled={!isReady}
          className={`w-full font-bold py-4 px-6 rounded-lg ${
            isReady ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
          }`}
        >
          {isReady ? `Pay MYR ${amount} with Card` : "Loading..."}
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
  }
}

