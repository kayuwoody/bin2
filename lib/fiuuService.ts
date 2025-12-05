import crypto from "crypto";

/**
 * Fiuu Payment Gateway Service
 * Handles payment URL generation, callback verification, and transaction queries
 */
export class FiuuService {
  private merchantID: string;
  private verifyKey: string;
  private secretKey: string;
  private baseURL: string;

  constructor(
    merchantID: string,
    verifyKey: string,
    secretKey: string,
    sandboxMode: boolean = false
  ) {
    this.merchantID = merchantID;
    this.verifyKey = verifyKey;
    this.secretKey = secretKey;
    // Per official Fiuu documentation:
    // Production: https://pay.fiuu.com
    // Sandbox: https://sandbox-payment.fiuu.com
    this.baseURL = sandboxMode
      ? "https://sandbox-payment.fiuu.com"
      : "https://pay.fiuu.com";
  }

  /**
   * Generate MD5 hash
   */
  private md5(value: string): string {
    return crypto.createHash("md5").update(value).digest("hex");
  }

  /**
   * Generate Fiuu payment form data for POST submission
   * Fiuu requires POST method for payment initiation
   *
   * @param params Payment parameters
   * @returns Object with action URL and form parameters
   */
  generatePaymentFormData(params: {
    orderID: string;
    amount: string;
    currency?: string;
    paymentMethod: string;
    returnURL: string;
    notifyURL: string;
    callbackURL: string;
    bill_name?: string;
    bill_email?: string;
    bill_mobile?: string;
    bill_desc?: string;
  }): {
    action: string;
    params: Record<string, string>;
  } {
    const {
      orderID,
      amount,
      currency = "MYR",
      paymentMethod,
      returnURL,
      notifyURL,
      callbackURL,
      bill_name = "",
      bill_email = "",
      bill_mobile = "",
      bill_desc = "",
    } = params;

    // Generate vcode (verify key hash) - MD5 hash for outbound request
    // Official formula: vcode = md5(amount + merchantID + orderID + verifyKey)
    const vcodeRaw = `${amount}${this.merchantID}${orderID}${this.verifyKey}`;
    const vcode = this.md5(vcodeRaw);

    console.log('🔑 Fiuu vcode generation:');
    console.log('  Formula: amount + merchantID + orderID + verifyKey');
    console.log('  Raw string:', vcodeRaw);
    console.log('  Generated vcode:', vcode);
    console.log('  Verify at: https://api.fiuu.com/RMS/query/vcode.php');

    // Build query parameters (per support example format)
    // Note: merchantID is NOT included as a parameter (only in URL path)
    // Note: bill_mobile is included even if empty (per support example)
    const queryParams: Record<string, string> = {
      amount,
      orderid: orderID,
      bill_name,
      bill_email,
      bill_mobile: bill_mobile || '', // Always include, even if empty
      bill_desc,
      currency,
      returnurl: returnURL,
      callbackurl: callbackURL,
      vcode,
    };

    // Add notifyURL if provided
    if (notifyURL) {
      queryParams.notifyurl = notifyURL;
    }

    // Build complete URL with query params (GET request)
    // Per Fiuu support: indexAN.php forces credit card selection
    const channelFile = 'indexAN.php';
    const baseAction = `${this.baseURL}/RMS/pay/${this.merchantID}/${channelFile}`;

    // Build query string
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const action = `${baseAction}?${queryString}`;

    console.log(`💳 Using channel file: ${channelFile}`);
    console.log(`📋 Complete payment URL: ${action}`);

    return {
      action,
      params: queryParams, // Keep for backwards compatibility
    };
  }

  /**
   * Generate Fiuu payment URL for redirect (DEPRECATED - use generatePaymentFormData for POST)
   * Note: Fiuu may require POST method instead of GET
   *
   * @param params Payment parameters
   * @returns Complete payment URL to redirect customer to
   */
  generatePaymentURL(params: {
    orderID: string;
    amount: string;
    currency?: string;
    paymentMethod: string;
    returnURL: string;
    notifyURL: string;
    callbackURL: string;
    bill_name?: string;
    bill_email?: string;
    bill_mobile?: string;
    bill_desc?: string;
  }): string {
    const formData = this.generatePaymentFormData(params);
    const queryParams = new URLSearchParams(formData.params);
    return `${formData.action}?${queryParams.toString()}`;
  }

  /**
   * Verify callback signature from Fiuu
   * Uses double-hashed MD5 (skey) to prevent tampering
   *
   * @param callback Callback data from Fiuu webhook/return/callback
   * @returns true if signature is valid
   */
  verifyCallback(callback: {
    tranID: string;
    orderid: string;
    status: string;
    domain: string;
    amount: string;
    currency: string;
    paydate: string;
    appcode: string;
    skey: string;
  }): boolean {
    const { tranID, orderid, status, amount, currency, paydate, appcode, skey } = callback;

    // Official Fiuu signature verification formula (2-step MD5):
    // IMPORTANT: amount includes currency (e.g., "1.10RM")
    // Step 1: pre_skey = MD5(txnID + orderID + status + merchantID + amount + currency)
    // Step 2: skey = MD5(paydate + merchantID + pre_skey + appcode + secret_key)

    const amountWithCurrency = `${amount}${currency}`;
    const preSkey = this.md5(`${tranID}${orderid}${status}${this.merchantID}${amountWithCurrency}`);
    const calculatedSkey = this.md5(`${paydate}${this.merchantID}${preSkey}${appcode}${this.secretKey}`);

    console.log('🔐 Fiuu Signature Verification:');
    console.log('  Step 1 raw:', `${tranID}${orderid}${status}${this.merchantID}${amountWithCurrency}`);
    console.log('  Step 1 pre_skey:', preSkey);
    console.log('  Step 2 calculated skey:', calculatedSkey);
    console.log('  Received skey:', skey);
    console.log('  Match:', calculatedSkey === skey ? '✅ VERIFIED' : '❌ FAILED');

    if (calculatedSkey !== skey) {
      console.log('  ⚠️ Signature mismatch - verify FIUU_MERCHANT_ID and FIUU_SECRET_KEY');
    }

    return calculatedSkey === skey;
  }

  /**
   * Check if payment was successful
   * Status "00" indicates success
   */
  isPaymentSuccessful(status: string): boolean {
    return status === "00";
  }

  /**
   * Get payment status description
   */
  getStatusDescription(status: string): string {
    const statusMap: Record<string, string> = {
      "00": "Successful",
      "11": "Failed",
      "22": "Pending",
      "33": "Processing/Incomplete",
    };
    return statusMap[status] || "Unknown";
  }

  /**
   * Query transaction status directly from Fiuu
   * Useful for reconciliation or when callbacks are missed
   *
   * @param orderID Order ID to query
   * @returns Transaction status data
   */
  async requeryTransaction(orderID: string): Promise<any> {
    const url = `${this.baseURL}/RMS/API/TxnQuery/${this.merchantID}/${orderID}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fiuu requery failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Fiuu requery error:", error);
      throw error;
    }
  }

  /**
   * Process refund (optional - not in v1 but kept for future use)
   *
   * @param orderID Order ID to refund
   * @param amount Amount to refund
   * @returns Refund response data
   */
  async refundTransaction(
    orderID: string,
    amount: string
  ): Promise<any> {
    const url = `${this.baseURL}/RMS/API/Refund`;

    const body = new URLSearchParams({
      merchantID: this.merchantID,
      orderid: orderID,
      amount,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(`Fiuu refund failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Fiuu refund error:", error);
      throw error;
    }
  }
}

/**
 * Get Fiuu service instance with environment credentials
 */
export function getFiuuService(): FiuuService {
  const merchantID = process.env.FIUU_MERCHANT_ID;
  const verifyKey = process.env.FIUU_VERIFY_KEY;
  const secretKey = process.env.FIUU_SECRET_KEY;
  const sandboxMode = process.env.FIUU_SANDBOX_MODE === "true";

  if (!merchantID || !verifyKey || !secretKey) {
    throw new Error(
      "Missing Fiuu credentials. Please set FIUU_MERCHANT_ID, FIUU_VERIFY_KEY, and FIUU_SECRET_KEY in environment variables."
    );
  }

  return new FiuuService(merchantID, verifyKey, secretKey, sandboxMode);
}
