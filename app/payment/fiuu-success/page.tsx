"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  const orderid = searchParams.get("orderid");
  const tranID = searchParams.get("tranID");
  const amount = searchParams.get("amount");
  const channel = searchParams.get("channel");

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-green-600"
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

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
      <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <div className="space-y-2">
          {orderid && (
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">#{orderid}</span>
            </div>
          )}
          {tranID && (
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-medium text-sm">{tranID}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-green-600">RM {amount}</span>
            </div>
          )}
          {channel && (
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium capitalize">{channel.replace(/-/g, " ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Auto-redirect notice */}
      <p className="text-sm text-gray-500 mb-4">
        Redirecting in {countdown} seconds...
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/"
          className="block w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Return to Home
        </Link>
        {orderid && (
          <Link
            href={`/orders/${orderid}`}
            className="block w-full px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            View Order Details
          </Link>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" />
      <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse" />
    </div>
  );
}

export default function FiuuSuccessPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
