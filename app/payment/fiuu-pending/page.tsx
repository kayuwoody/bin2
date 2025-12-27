"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PendingContent() {
  const searchParams = useSearchParams();

  const orderid = searchParams.get("orderid");
  const status = searchParams.get("status");

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      {/* Pending Icon */}
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-yellow-600 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h1>
      <p className="text-gray-600 mb-6">
        Your payment is being processed. This may take a few moments.
      </p>

      {/* Order Details */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
        <div className="space-y-2">
          {orderid && (
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">#{orderid}</span>
            </div>
          )}
          {status && (
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-yellow-600">
                {status === "22" ? "Pending" : status === "33" ? "Processing" : status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
        <p className="text-sm text-blue-900 font-medium mb-2">What happens next:</p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Your payment is being verified</li>
          <li>You will receive a confirmation once complete</li>
          <li>Check your email for updates</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
        >
          Refresh Status
        </button>
        <Link
          href="/"
          className="block w-full px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Return to Home
        </Link>
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

export default function FiuuPendingPage() {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <PendingContent />
      </Suspense>
    </div>
  );
}
