"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentErrorPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Warning Icon */}
        <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Error
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an error processing your payment. The status is unclear.
        </p>

        {/* Order Details */}
        {orderID && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 mb-1">Order Number</div>
            <div className="text-xl font-bold text-gray-900 mb-2">#{orderID}</div>
            {status && (
              <>
                <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                <div className="text-sm text-gray-600 font-mono">{status}</div>
              </>
            )}
          </div>
        )}

        {/* Info Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            ⏳ Your payment may still be processing. Please check your order status
            or contact support if you were charged but didn't receive confirmation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {orderID && (
            <Link
              href={`/orders/${orderID}`}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Check Order Status
            </Link>
          )}
          <Link
            href="/orders"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View All Orders
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
          Questions? Contact us at{" "}
          <a href="mailto:support@coffee-oasis.com.my" className="text-blue-600 hover:underline">
            support@coffee-oasis.com.my
          </a>
        </p>
      </div>
    </div>
  );
}
