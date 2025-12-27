"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FiuuFailedPage() {
  const searchParams = useSearchParams();

  const orderid = searchParams.get("orderid");
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Failed Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-red-600"
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be processed.
        </p>

        {/* Error Details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-2">
            {orderid && (
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{orderid}</span>
              </div>
            )}
            {error && (
              <div>
                <span className="text-gray-600">Error:</span>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 font-medium mb-2">What you can do:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Check your payment details and try again</li>
            <li>Try a different payment method</li>
            <li>Contact your bank if the issue persists</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
