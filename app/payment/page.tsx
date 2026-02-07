/* 
  CONTEXT CHECK: 
  Script URL: https://sandbox.merchant.razer.com 
*/

import Script from 'next/script';

// ... inside your component return ...
<>
  {/* 1. Load jQuery (Required for this script) */}
  <Script 
    src="https://code.jquery.com" 
    strategy="beforeInteractive" 
  />

  {/* 2. Load the CORRECT Pinned Script */}
  <Script 
    src="https://sandbox.merchant.razer.com/MOLPay/API/seamless/latest/js/MOLPay_seamless.deco.js"
    strategy="afterInteractive"
    onLoad={() => {
      if (window.MOLPaySeamless) window.MOLPaySeamless.init();
    }}
  />

  {/* 3. The Forced Channel Button */}
  <button
    type="button"
    data-toggle="molpayseamless"
    data-mpsmerchantid="SB_coffeeoasisplt"
    data-mpschannel="credit"      // THIS FORCES THE CREDIT CARD CHANNEL
    data-mpsamount={amount}      // e.g. "1.10"
    data-mpsorderid={orderID}
    data-mpsvcode={vcode}        // md5(amount + merchantID + orderID + verifyKey)
    data-mpscurrency="MYR"
    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
  >
    Pay with Credit Card
  </button>
</>
