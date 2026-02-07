"use client";

import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Suspense, useEffect, useState } from 'react';

// 1. Component that uses the search params
function PaymentContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  
  const vcode = searchParams.get('vcode');
  const orderID = searchParams.get('orderID');
  const amount = searchParams.get('amount');
  
  // CONTEXT VALUES
  const MERCHANT_ID = "SB_coffeeoasisplt";
  // PLACEHOLDER: Paste your verified .js URL here
  const FIUU_SCRIPT_URL = "https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js";

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MOLPaySeamless) {
      (window as any).MOLPaySeamless.init();
      setIsReady(true);
    }
  }, [vcode]);

  if (!vcode || !orderID) {
    return <div className="p-10 text-center">Missing session data.</div>;
  }

  return (
    <div className="flex flex-col items-center p-10">
      <Script 
        src="https://code.jquery.com" 
        strategy="beforeInteractive" 
      />
      <Script 
        src={FIUU_SCRIPT_URL} 
        strategy="afterInteractive" 
        onLoad={() => setIsReady(true)}
      />

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
        className="bg-blue-600 text-white p-4 rounded font-bold"
      >
        {isReady ? `Pay MYR ${amount}` : "Loading..."}
      </button>
    </div>
  );
}

// 2. The DEFAULT EXPORT that Next.js requires
export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading Page...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
