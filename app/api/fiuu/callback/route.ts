import { NextRequest, NextResponse } from "next/server";
import { getFiuuService, FiuuCallbackData } from "@/lib/fiuuService";
import { updateWooOrder } from "@/lib/orderService";

/**
 * POST /api/fiuu/callback
 *
 * Callback endpoint for delayed payment updates.
 * Called by Fiuu for payments that complete after initial response
 * (e.g., bank transfers with delayed confirmation).
 *
 * Similar to notify but may be called multiple times for the same transaction.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const callback: FiuuCallbackData = {
      tranID: formData.get("tranID") as string || "",
      orderid: formData.get("orderid") as string || "",
      status: formData.get("status") as string || "",
      domain: formData.get("domain") as string || "",
      amount: formData.get("amount") as string || "",
      currency: formData.get("currency") as string || "",
      paydate: formData.get("paydate") as string || "",
      channel: formData.get("channel") as string || "",
      appcode: formData.get("appcode") as string || "",
      skey: formData.get("skey") as string || "",
      error_code: formData.get("error_code") as string || undefined,
      error_desc: formData.get("error_desc") as string || undefined,
    };

    console.log("[Fiuu Callback] Received:", {
      orderid: callback.orderid,
      tranID: callback.tranID,
      status: callback.status,
      amount: callback.amount,
      channel: callback.channel,
    });

    // Verify signature
    const fiuu = getFiuuService();
    const isValid = fiuu.verifyCallback(callback);

    if (!isValid) {
      console.error("[Fiuu Callback] Invalid signature for order:", callback.orderid);
      return new Response("INVALID_SIGNATURE", { status: 400 });
    }

    // Process based on status
    const statusDesc = fiuu.getStatusDescription(callback.status);
    console.log(`[Fiuu Callback] Order ${callback.orderid}: ${statusDesc}`);

    // Skip WooCommerce update for Fiuu demo/test orders
    if (callback.orderid.startsWith("DEMO")) {
      console.log(`⚠️ Skipping WooCommerce update for demo order ${callback.orderid}`);
      return new Response("OK", { status: 200 });
    }

    if (fiuu.isPaymentSuccessful(callback.status)) {
      // Update order status to paid
      await updateWooOrder(callback.orderid, {
        status: "processing",
        meta_data: [
          { key: "_fiuu_transaction_id", value: callback.tranID },
          { key: "_fiuu_payment_status", value: callback.status },
          { key: "_fiuu_payment_date", value: callback.paydate },
          { key: "_fiuu_payment_channel", value: callback.channel },
          { key: "_fiuu_payment_amount", value: callback.amount },
          { key: "_fiuu_app_code", value: callback.appcode },
        ],
      });
      console.log("[Fiuu Callback] Payment confirmed for:", callback.orderid);
    } else if (fiuu.isPaymentFailed(callback.status)) {
      // Update order status to failed
      await updateWooOrder(callback.orderid, {
        status: "failed",
        meta_data: [
          { key: "_fiuu_transaction_id", value: callback.tranID },
          { key: "_fiuu_payment_status", value: callback.status },
          { key: "_fiuu_error_desc", value: callback.error_desc || "" },
        ],
      });
      console.log("[Fiuu Callback] Payment failed for:", callback.orderid);
    }

    // Must return "OK" for Fiuu to acknowledge
    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("[Fiuu Callback] Error:", error);
    return new Response("OK", { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "Fiuu Callback Endpoint",
    status: "active",
    methods: ["POST"],
  });
}
