"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cartContext";
import Script from "next/script";
import QRCode from "react-qr-code";

// Fiuu channel codes for Seamless integration
const FIUU_CHANNELS: Record<string, string> = {
  credit_card: "credit",
  grabpay: "GrabPay",
  tng: "TNG-EWALLET",
  boost: "BOOST",
  shopeepay: "ShopeePay",
  fpx: "maybank2u", // Use specific bank for FPX
};

// Declare jQuery types
declare global {
  interface Window {
    jQuery: any;
    $: any;
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const fiuuBtnRef = useRef<HTMLButtonElement>(null);

  // Calculate total (using finalPrice which includes discounts)
  const retailTotal = cartItems.reduce((sum, item) => sum + item.retailPrice * item.quantity, 0);
  const finalTotal = cartItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  const totalDiscount = retailTotal - finalTotal;
  const hasDiscount = totalDiscount > 0;

  // Set pending order on mount to keep customer display populated
  useEffect(() => {
    if (cartItems.length > 0) {
      fetch('/api/cart/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setPendingOrder: true,
          orderId: order?.id || 'pending',
          items: cartItems,
        }),
      }).catch(err => console.error('Failed to set pending order:', err));
    }
  }, [cartItems, order]);

  // Download QR code as image
  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'coffee-oasis-payment-qr.png';
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Initialize Fiuu Seamless payment
  const initFiuuSeamless = useCallback(async (channel: string, orderId: string, amount: string) => {
    if (!window.jQuery || !sdkLoaded) {
      console.error('Fiuu SDK not ready. jQuery:', !!window.jQuery, 'SDK:', sdkLoaded);
      setError('Payment system still loading, please wait...');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching Fiuu seamless params for channel:', channel);

      // Get signed params from server
      const response = await fetch('/api/fiuu/seamless-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: orderId,
          amount: amount,
          channel: channel,
          billName: 'Coffee Oasis Customer',
          billEmail: 'customer@coffee-oasis.com.my',
          billMobile: '0123456789',
          billDesc: `Order #${orderId}`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get payment params');
      }

      console.log('Got Fiuu params, initializing SDK...');
      console.log('Params:', JSON.stringify(data.params, null, 2));

      // Use the hidden button ref
      const btn = fiuuBtnRef.current;
      if (!btn) {
        throw new Error('Payment button not found');
      }

      // Initialize MOLPaySeamless on the button
      console.log('Calling MOLPaySeamless on button...');
      window.jQuery(btn).MOLPaySeamless(data.params);

      // Wait for SDK to attach handlers, then trigger
      console.log('Waiting for SDK to attach, then clicking...');
      setTimeout(() => {
        console.log('Triggering click on Fiuu button');
        window.jQuery(btn).trigger('click');
        setLoading(false);
      }, 200);

    } catch (err: any) {
      console.error('Fiuu Seamless error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [sdkLoaded]);

  // Create order when payment method is selected
  const handlePaymentMethodSelect = async (method: string) => {
    setPaymentMethod(method);
    setLoading(true);
    setError(null);

    try {
      // Get or create guestId for guest users
      let guestId = localStorage.getItem('guestId');
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem('guestId', guestId);
      }

      // Calculate total discount across all items
      const totalDiscountCalc = cartItems.reduce((sum, item) => {
        if (item.discountReason) {
          return sum + ((item.retailPrice - item.finalPrice) * item.quantity);
        }
        return sum;
      }, 0);

      // Create order in WooCommerce
      const response = await fetch("/api/orders/create-with-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          line_items: cartItems.map((item) => {
            const meta_data: Array<{ key: string; value: string }> = [];

            if (item.discountReason) {
              meta_data.push(
                { key: "_discount_reason", value: item.discountReason },
                { key: "_retail_price", value: item.retailPrice.toString() },
                { key: "_discount_amount", value: (item.retailPrice - item.finalPrice).toString() }
              );
            }

            meta_data.push({ key: "_final_price", value: item.finalPrice.toString() });

            if (item.bundle) {
              meta_data.push(
                { key: "_is_bundle", value: "true" },
                { key: "_bundle_display_name", value: item.name },
                { key: "_bundle_base_product_name", value: item.bundle.baseProductName },
                { key: "_bundle_mandatory", value: JSON.stringify(item.bundle.selectedMandatory) },
                { key: "_bundle_optional", value: JSON.stringify(item.bundle.selectedOptional) }
              );

              if (item.components) {
                meta_data.push(
                  { key: "_bundle_components", value: JSON.stringify(item.components) }
                );
              }
            }

            return {
              product_id: item.productId,
              quantity: item.quantity,
              subtotal: (item.finalPrice * item.quantity).toString(),
              total: (item.finalPrice * item.quantity).toString(),
              meta_data,
            };
          }),
          meta_data: totalDiscountCalc > 0 ? [
            { key: "_total_discount", value: totalDiscountCalc.toFixed(2) }
          ] : [],
          billing: {
            first_name: "Walk-in Customer",
            email: "pos@coffee-oasis.com.my",
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      setOrder(data.order);

      // Set pending order so customer display stays populated during payment
      await fetch('/api/cart/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setPendingOrder: true,
          orderId: data.order.id,
          items: cartItems,
        }),
      });

      // If bank QR, show QR code display
      if (method === "bank_qr") {
        setShowQRCode(true);
        setLoading(false);
        return;
      }

      // Get the Fiuu channel code and use Seamless SDK
      const fiuuChannel = FIUU_CHANNELS[method];
      if (fiuuChannel) {
        await initFiuuSeamless(fiuuChannel, String(data.order.id), finalTotal.toFixed(2));
      } else {
        setLoading(false);
      }

    } catch (err: any) {
      console.error("Order creation error:", err);
      setError(err.message);
      setPaymentMethod(null);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    clearCart();

    await fetch('/api/cart/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: [],
        setPendingOrder: false,
      }),
    });

    alert(`Payment confirmed! Order #${order.id} is being prepared.`);
    router.push("/products");
  };

  const handleCancel = async () => {
    await fetch('/api/cart/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setPendingOrder: false,
      }),
    });

    setOrder(null);
    setPaymentMethod(null);
    setError(null);
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !order) {
      router.push("/products");
    }
  }, [cartItems, order, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-700">Processing payment...</p>
        </div>
      </div>
    );
  }

  // Show QR Code for bank_qr payment
  if (order && paymentMethod === "bank_qr" && showQRCode) {
    const qrData = `https://coffee-oasis.com.my/pay?order=${order.id}&amount=${finalTotal.toFixed(2)}`;

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Scan QR Code to Pay</h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Order #{order.id}</p>
            <p className="text-3xl font-bold text-gray-900">RM {finalTotal.toFixed(2)}</p>
          </div>

          <div ref={qrRef} className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6 flex justify-center">
            <QRCode value={qrData} size={256} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Scan this QR code with your banking app to complete payment
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={downloadQRCode}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Download QR Code
            </button>
            <button
              onClick={handlePaymentSuccess}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              I've Paid - Continue
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment method selection screen
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Load jQuery first */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('jQuery loaded');
          setJqueryLoaded(true);
        }}
      />

      {/* Load Fiuu Seamless SDK after jQuery */}
      {jqueryLoaded && (
        <Script
          src="https://pay.merchant.razer.com/RMS/API/seamless/latest/js/MOLPay_seamless.deco.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('Fiuu Seamless SDK loaded');
            setSdkLoaded(true);
          }}
          onError={(e) => {
            console.error('Failed to load Fiuu SDK:', e);
          }}
        />
      )}

      {/* Hidden button for Fiuu SDK - MUST stay in DOM */}
      <button
        ref={fiuuBtnRef}
        id="fiuu-seamless-trigger"
        type="button"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        aria-hidden="true"
      >
        Pay
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Payment Method</h1>
        <p className="text-gray-600 mb-6">How will the customer pay?</p>

        {/* SDK Loading Status */}
        {!sdkLoaded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">Loading payment system...</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Order Total</p>
          {hasDiscount && (
            <p className="text-lg text-gray-400 line-through">RM {retailTotal.toFixed(2)}</p>
          )}
          <p className="text-3xl font-bold text-gray-900">RM {finalTotal.toFixed(2)}</p>
          {hasDiscount && (
            <p className="text-sm text-green-600 font-medium mt-1">
              Saved RM {totalDiscount.toFixed(2)}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-2">{cartItems.length} item(s)</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Method Buttons */}
        <div className="space-y-3">
          {/* Credit/Debit Card */}
          <button
            onClick={() => handlePaymentMethodSelect("credit_card")}
            disabled={!sdkLoaded}
            className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div className="text-left">
                <p className="font-semibold">Credit / Debit Card</p>
                <p className="text-sm text-purple-100">Visa, Mastercard</p>
              </div>
            </span>
            <span className="text-2xl">→</span>
          </button>

          {/* E-Wallets Section */}
          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-2 font-medium">E-Wallets</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePaymentMethodSelect("tng")}
                disabled={!sdkLoaded}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center disabled:opacity-50"
              >
                <p className="font-semibold text-sm">Touch 'n Go</p>
              </button>
              <button
                onClick={() => handlePaymentMethodSelect("grabpay")}
                disabled={!sdkLoaded}
                className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center disabled:opacity-50"
              >
                <p className="font-semibold text-sm">GrabPay</p>
              </button>
              <button
                onClick={() => handlePaymentMethodSelect("boost")}
                disabled={!sdkLoaded}
                className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-center disabled:opacity-50"
              >
                <p className="font-semibold text-sm">Boost</p>
              </button>
              <button
                onClick={() => handlePaymentMethodSelect("shopeepay")}
                disabled={!sdkLoaded}
                className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center disabled:opacity-50"
              >
                <p className="font-semibold text-sm">ShopeePay</p>
              </button>
            </div>
          </div>

          {/* Online Banking */}
          <button
            onClick={() => handlePaymentMethodSelect("fpx")}
            disabled={!sdkLoaded}
            className="w-full p-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-between disabled:opacity-50"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">🏦</span>
              <div className="text-left">
                <p className="font-semibold">FPX Online Banking</p>
                <p className="text-sm text-teal-100">Maybank2u</p>
              </div>
            </span>
            <span className="text-2xl">→</span>
          </button>

          {/* Bank QR (manual - doesn't need SDK) */}
          <button
            onClick={() => handlePaymentMethodSelect("bank_qr")}
            className="w-full p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div className="text-left">
                <p className="font-semibold">Bank QR Code</p>
                <p className="text-sm text-gray-300">Manual QR payment</p>
              </div>
            </span>
            <span className="text-2xl">→</span>
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push("/checkout")}
          className="w-full mt-6 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Cart
        </button>
      </div>
    </div>
  );
}
