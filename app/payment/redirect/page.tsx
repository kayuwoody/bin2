"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Loading fallback for Suspense boundary
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Payment Gateway</h2>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}

/**
 * Payment Redirect Component
 * This component receives payment parameters and auto-submits them as a POST request to Fiuu
 * This is necessary because Fiuu requires POST method, not GET
 */
function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmitted = useRef(false);

  // Get all payment parameters from URL
  const fiuuURL = searchParams.get("fiuuURL");
  const amount = searchParams.get("amount");
  const orderid = searchParams.get("orderid");
  const bill_name = searchParams.get("bill_name");
  const bill_email = searchParams.get("bill_email");
  const bill_mobile = searchParams.get("bill_mobile");
  const bill_desc = searchParams.get("bill_desc");
  const currency = searchParams.get("currency");
  const returnurl = searchParams.get("returnurl");
  const callbackurl = searchParams.get("callbackurl");
  const notifyurl = searchParams.get("notifyurl");
  const vcode = searchParams.get("vcode");
  const merchantID = searchParams.get("merchantID");

  useEffect(() => {
    // Auto-submit the form once on mount
    if (formRef.current && !hasSubmitted.current && fiuuURL) {
      hasSubmitted.current = true;
      console.log("🚀 Auto-submitting payment form to Fiuu via POST");
      formRef.current.submit();
    }
  }, [fiuuURL]);

  if (!fiuuURL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-semibold mb-4">❌ Invalid payment parameters</p>
          <p className="text-gray-600">Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Payment Gateway</h2>
        <p className="text-gray-600">Please wait while we redirect you to Fiuu...</p>
        <p className="text-sm text-gray-500 mt-4">Do not close this window</p>

        {/* Hidden form that will auto-submit as POST to Fiuu */}
        <form
          ref={formRef}
          method="POST"
          action={fiuuURL}
          style={{ display: "none" }}
        >
          <input type="hidden" name="amount" value={amount || ""} />
          <input type="hidden" name="orderid" value={orderid || ""} />
          <input type="hidden" name="bill_name" value={bill_name || ""} />
          <input type="hidden" name="bill_email" value={bill_email || ""} />
          {bill_mobile && <input type="hidden" name="bill_mobile" value={bill_mobile} />}
          <input type="hidden" name="bill_desc" value={bill_desc || ""} />
          <input type="hidden" name="currency" value={currency || ""} />
          <input type="hidden" name="returnurl" value={returnurl || ""} />
          <input type="hidden" name="callbackurl" value={callbackurl || ""} />
          {notifyurl && <input type="hidden" name="notifyurl" value={notifyurl} />}
          <input type="hidden" name="vcode" value={vcode || ""} />
          {merchantID && <input type="hidden" name="merchantID" value={merchantID} />}
        </form>
      </div>
    </div>
  );
}

/**
 * Payment Redirect Page (wrapped in Suspense boundary)
 * Required by Next.js for pages using useSearchParams()
 */
export default function PaymentRedirectPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentRedirectContent />
    </Suspense>
  );
}
