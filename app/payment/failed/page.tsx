"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const [orderID, setOrderID] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const order = searchParams.get("order") || "";
    const paymentStatus = searchParams.get("status") || "";
    setOrderID(order);
    setStatus(paymentStatus);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          We couldn't process your payment. Please try again.
        </p>

        {/* Order Details */}
        {orderID && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 mb-1">Order Number</div>
            <div className="text-xl font-bold text-gray-900 mb-2">#{orderID}</div>
            {status && (
              <>
                <div className="text-xs text-gray-500 mb-1">Status Code</div>
                <div className="text-sm text-gray-600">{status}</div>
              </>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            💡 Common reasons for payment failure:
          </p>
          <ul className="text-xs text-yellow-700 mt-2 text-left list-disc list-inside">
            <li>Insufficient funds</li>
            <li>Incorrect card details</li>
            <li>Card expired</li>
            <li>Payment cancelled</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/payment"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Try Again
          </Link>
          <Link
            href="/products"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Menu
          </Link>
        </div>

        {/* Support Link */}
        <p className="text-xs text-gray-400 mt-6">
          Need help? Contact us at{" "}
          <a href="mailto:support@coffee-oasis.com.my" className="text-blue-600 hover:underline">
            support@coffee-oasis.com.my
          </a>
        </p>
      </div>
    </div>
  );
}
