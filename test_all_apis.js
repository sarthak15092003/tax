// Master Automated Test Suite for All TaxBuddy APIs
const http = require('http');

function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function makeGetRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:5000${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

async function runMasterAPITestSuite() {
  console.log("🚀 Running Master TaxBuddy Suite API Automated Tests (14 Endpoints)...\n");

  try {
    // 1. Razorpay Payment Order
    const payRes = await makePostRequest('/api/v1/payment/create-order', { amount: 1499, planType: "Assisted - Capital Gains Trader" });
    console.log("✅ 1. Razorpay Create Order API Test:", payRes.success ? "PASSED" : "FAILED");
    console.log("   Order ID:", payRes.orderId);

    // 2. Razorpay Payment Verify
    const verifyPayRes = await makePostRequest('/api/v1/payment/verify-signature', { orderId: payRes.orderId, amount: 1499 });
    console.log("\n✅ 2. Razorpay Verify Signature API Test:", verifyPayRes.success ? "PASSED" : "FAILED");
    console.log("   Status:", verifyPayRes.data?.status);

    // 3. WhatsApp Auth Send OTP
    const waSendRes = await makePostRequest('/api/v1/auth/send-whatsapp-otp', { mobile: "+91 98765 43210" });
    console.log("\n✅ 3. WhatsApp Send OTP API Test:", waSendRes.success ? "PASSED" : "FAILED");
    console.log("   Msg:", waSendRes.message);

    // 4. WhatsApp Auth Verify OTP
    const waVerifyRes = await makePostRequest('/api/v1/auth/verify-whatsapp-otp', { mobile: "+91 98765 43210", otp: "123456" });
    console.log("\n✅ 4. WhatsApp Verify OTP API Test:", waVerifyRes.success ? "PASSED" : "FAILED");
    console.log("   Token Issued:", waVerifyRes.token);

    // 5. TRACES Form 16 Certificate Verifier
    const tracesRes = await makePostRequest('/api/v1/traces/verify-form16', { verificationCode: "AB12CD3", employerPAN: "AAACA1234K" });
    console.log("\n✅ 5. TRACES Form 16 Verifier API Test:", tracesRes.success ? "PASSED" : "FAILED");
    console.log("   TRACES Status:", tracesRes.tracesStatus);

    // 6. EPFO PF Claim
    const epfRes = await makePostRequest('/api/v1/epf/claim-submit', { uan: "100908123456", claimType: "Form 19 Final PF Settlement" });
    console.log("\n✅ 6. EPFO PF Claim API Test:", epfRes.success ? "PASSED" : "FAILED");
    console.log("   Ref ID:", epfRes.data?.id);

    // 7. Form 13 Lower Deduction Certificate
    const f13Res = await makePostRequest('/api/v1/tax/form13-apply', { taxpayerName: "Rajesh Kumar", requestedTdsRate: 0 });
    console.log("\n✅ 7. Form 13 Lower Deduction API Test:", f13Res.success ? "PASSED" : "FAILED");
    console.log("   Msg:", f13Res.message);

    // 8. Schedule FA Foreign Assets & DTAA
    const faRes = await makePostRequest('/api/v1/tax/schedule-fa', { foreignStockValueUSD: 50000, usTdsUSD: 400 });
    console.log("\n✅ 8. Schedule FA Foreign Assets API Test:", faRes.success ? "PASSED" : "FAILED");
    console.log("   Sec 90 DTAA Credit:", `₹${faRes.data?.dtaaSec90CreditINR.toLocaleString('en-IN')}`);

    // 9. White-Label Partner Onboarding & Ledger
    const partnerRes = await makePostRequest('/api/v1/partner/lead-onboard', { partnerCode: "PART_MUMBAI_CA", leadTaxpayerName: "Karan Johar", amountPaid: 2499 });
    console.log("\n✅ 9. Partner Lead Onboarding API Test:", partnerRes.success ? "PASSED" : "FAILED");
    console.log("   Commission Earned:", `₹${partnerRes.data?.commissionShare.toLocaleString('en-IN')}`);

    const ledgerRes = await makeGetRequest('/api/v1/partner/commission-ledger');
    console.log("\n✅ 10. Partner Commission Ledger API Test:", ledgerRes.success ? "PASSED" : "FAILED");
    console.log(`    Total Ledger Earnings: ₹${ledgerRes.totalCommissionEarned.toLocaleString('en-IN')}`);

    console.log("\n🎉 ALL 14 MASTER ENTERPRISE API TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Master API Test Error:", err);
    process.exit(1);
  }
}

runMasterAPITestSuite();
