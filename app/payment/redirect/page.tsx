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
 * This component receives the complete Fiuu payment URL and redirects to it
 * Uses GET request with all params in query string (per Fiuu support example)
 */
function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  const hasSubmitted = useRef(false);

  // Get Fiuu payment URL (already contains all params in query string)
  const fiuuURL = searchParams.get("fiuuURL");

  useEffect(() => {
    // Redirect directly to Fiuu URL (now contains all params in query string)
    if (!hasSubmitted.current && fiuuURL) {
      hasSubmitted.current = true;
      console.log("🚀 Redirecting to Fiuu payment URL (GET request)");
      console.log("📋 Payment URL:", fiuuURL);
      window.location.href = fiuuURL;
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
        <p className="text-gray-600">Please wait while we redirect you to Fiuu credit card payment...</p>
        <p className="text-sm text-gray-500 mt-4">Do not close this window</p>
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
