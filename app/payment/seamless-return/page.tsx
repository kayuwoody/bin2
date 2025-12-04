"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SeamlessReturnContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const orderid = searchParams.get('order');

  const isSuccess = status === '00';
  const isFailed = status === '11';

  useEffect(() => {
    // Auto-close popup after 2 seconds
    const timer = setTimeout(() => {
      window.close();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {isSuccess && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Payment Successful
            </h1>
            <p className="text-gray-600 mb-4">
              Order #{orderid} has been paid
            </p>
          </>
        )}

        {isFailed && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600 mb-4">
              Order #{orderid} payment was not completed
            </p>
          </>
        )}

        {!isSuccess && !isFailed && (
          <>
            <div className="text-6xl mb-4">ℹ️</div>
            <h1 className="text-2xl font-bold text-gray-600 mb-2">
              Payment Status: {status}
            </h1>
            <p className="text-gray-600 mb-4">
              Order #{orderid}
            </p>
          </>
        )}

        <p className="text-sm text-gray-500">
          This window will close automatically...
        </p>
        <button
          onClick={() => window.close()}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Close Window
        </button>
      </div>
    </div>
  );
}

export default function SeamlessReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SeamlessReturnContent />
    </Suspense>
  );
}
