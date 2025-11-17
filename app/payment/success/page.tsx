"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderID, setOrderID] = useState<string>("");
  const [txnID, setTxnID] = useState<string>("");

  useEffect(() => {
    const order = searchParams.get("order") || "";
    const txn = searchParams.get("txn") || "";
    setOrderID(order);
    setTxnID(txn);

    // Store order in active orders for tracking
    if (order) {
      const activeOrders = JSON.parse(localStorage.getItem("activeOrders") || "[]");
      if (!activeOrders.includes(order)) {
        activeOrders.push(order);
        localStorage.setItem("activeOrders", JSON.stringify(activeOrders));
      }

      // Trigger refresh of active orders in navigation
      window.dispatchEvent(new Event("refreshActiveOrders"));
    }

    // Auto-redirect to products after 5 seconds
    const timer = setTimeout(() => {
      router.push("/products");
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your order has been confirmed and is being prepared.
        </p>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-500 mb-1">Order Number</div>
          <div className="text-2xl font-bold text-gray-900 mb-3">#{orderID}</div>
          {txnID && (
            <>
              <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
              <div className="text-sm text-gray-600 font-mono">{txnID}</div>
            </>
          )}
        </div>

        {/* Order Tracking Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            📦 Track your order status in the navigation bar above.
            You'll be notified when it's ready for pickup!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href={`/orders/${orderID}`}
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View Order Details
          </Link>
          <Link
            href="/products"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-xs text-gray-400 mt-4">
          Redirecting to menu in 5 seconds...
        </p>
      </div>
    </div>
  );
}
