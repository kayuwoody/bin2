import { NextRequest, NextResponse } from "next/server";
import { getFiuuService, FiuuCallbackData } from "@/lib/fiuuService";
import { updateWooOrder } from "@/lib/orderService";

/**
 * POST /api/fiuu/notify
 *
 * Webhook endpoint for Fiuu payment notifications.
 * This is the MOST RELIABLE way to receive payment status updates.
 * Called server-to-server by Fiuu after payment completion.
 *
 * IMPORTANT: Must return "OK" on success for Fiuu to mark notification as delivered.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data (Fiuu sends application/x-www-form-urlencoded)
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

    console.log("[Fiuu Notify] Received:", {
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
      console.error("[Fiuu Notify] Invalid signature for order:", callback.orderid);
      return new Response("INVALID_SIGNATURE", { status: 400 });
    }

    // Skip WooCommerce update for Fiuu demo/test orders
    if (callback.orderid.startsWith("DEMO")) {
      console.log(`⚠️ Skipping WooCommerce update for demo order ${callback.orderid}`);
      return new Response("OK", { status: 200 });
    }

    // Process based on status
    if (fiuu.isPaymentSuccessful(callback.status)) {
      console.log("[Fiuu Notify] Payment SUCCESS:", {
        orderid: callback.orderid,
        tranID: callback.tranID,
        amount: callback.amount,
        channel: callback.channel,
      });

      // Update order status in WooCommerce
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

      console.log(`✅ Order ${callback.orderid} marked as processing (payment successful)`);

    } else if (fiuu.isPaymentFailed(callback.status)) {
      console.log("[Fiuu Notify] Payment FAILED:", {
        orderid: callback.orderid,
        error_code: callback.error_code,
        error_desc: callback.error_desc,
      });

      // Update order status to failed
      await updateWooOrder(callback.orderid, {
        status: "failed",
        meta_data: [
          { key: "_fiuu_transaction_id", value: callback.tranID },
          { key: "_fiuu_payment_status", value: callback.status },
          { key: "_fiuu_error_desc", value: callback.error_desc || "" },
        ],
      });

      console.log(`❌ Order ${callback.orderid} marked as failed (payment failed)`);

    } else if (fiuu.isPaymentPending(callback.status)) {
      console.log("[Fiuu Notify] Payment PENDING:", callback.orderid);
      // Wait for final status via callback endpoint
    }

    // Must return "OK" for Fiuu to acknowledge
    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("[Fiuu Notify] Error:", error);
    // Still return OK to prevent Fiuu from retrying failed webhooks endlessly
    return new Response("OK", { status: 200 });
  }
}

// Also handle GET requests (some systems send GET for testing)
export async function GET() {
  return NextResponse.json({
    endpoint: "Fiuu Notify Endpoint",
    status: "active",
    methods: ["POST"],
  });
}
