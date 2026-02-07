"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  // Data from your successful /api/payments/initiate call
  const vcode = searchParams.get('vcode');
  const orderID = searchParams.get('orderID');
  const amount = searchParams.get('amount');

  // AUTO-SUBMIT: This triggers as soon as the page loads
  useEffect(() => {
    if (vcode && orderID && formRef.current) {
      console.log("🚀 Redirecting to Fiuu Direct Credit Card Channel...");
      formRef.current.submit();
    }
  }, [vcode, orderID]);

  if (!vcode || !orderID || orderID === "undefined") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-10">
        <p className="text-red-500 font-bold text-center">
          Error: Missing Payment Session. <br />
          Please restart the checkout process.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p className="text-gray-500 mb-8">Connecting to secure card payment gateway for Order #{orderID}</p>

      {/* 
        DIRECT POST FORM:
        The URL includes /credit to force the bypass.
      */}
      <form 
        ref={formRef} 
        method="POST" 
        action="https://sandbox-payment.fiuu.com/RMS/pay/SB_coffeeoasisplt/credit"
      >
        <input type="hidden" name="amount" value={amount || ""} />
        <input type="hidden" name="orderid" value={orderID || ""} />
        <input type="hidden" name="bill_name" value="Coffee Oasis Customer" />
        <input type="hidden" name="vcode" value={vcode || ""} />
        <input type="hidden" name="currency" value="MYR" />
        <input type="hidden" name="returnurl" value="https://app.coffee-oasis.com.my/api/payments/return" />
        
        {/* Fallback button if auto-submit fails */}
        <button 
          type="submit"
          className="bg-blue-600 text-white font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-blue-700"
        >
          Click here if not redirected
        </button>
      </form>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Initialising secure session...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
