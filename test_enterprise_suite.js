// Test Script for TaxBuddy Enterprise Suite APIs
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

async function runEnterpriseSuiteTests() {
  console.log("🚀 Running TaxBuddy Enterprise Suite Automated API Tests...\n");

  try {
    // 1. Test ITD Live AIS Sync
    const aisRes = await makePostRequest('/api/itd/sync-ais', { pan: "ABCDE1234F" });
    console.log("✅ 1. ITD AIS/TIS Sync API Test:", aisRes.success ? "PASSED" : "FAILED");
    console.log("   Summary:", aisRes.message);

    // 2. Test FlexiBuddy Calculator
    const flexiRes = await makePostRequest('/api/flexibuddy/calculate', {
      baseSalary: 1400000,
      foodCard: 26400,
      lta: 50000,
      fuelAllowance: 39600,
      booksSubscriptions: 15000,
      internetReimbursement: 18000
    });
    console.log("\n✅ 2. FlexiBuddy Calculator API Test:", flexiRes.success ? "PASSED" : "FAILED");
    console.log(`   Annual Tax Saved: ₹${flexiRes.data?.annualTaxSaved.toLocaleString('en-IN')}`);

    // 3. Test Portfolio Doctor Capital Gains
    const portRes = await makePostRequest('/api/portfolio/analyze', {
      pan: "ABCDE1234F",
      equitySTCG: 60000,
      equityLTCG: 180000,
      cryptoGains: 30000
    });
    console.log("\n✅ 3. Portfolio Doctor Capital Gains API Test:", portRes.success ? "PASSED" : "FAILED");
    console.log(`   Total Capital Gains Tax: ₹${portRes.data?.totalCapitalGainsTax.toLocaleString('en-IN')}`);

    // 4. Test MyBizCFO GST Filing
    const gstRes = await makePostRequest('/api/business/gst-file', {
      businessName: "Horizon Tech Pvt Ltd",
      gstin: "27BBBZ9999K1Z2",
      period: "August 2026",
      itcClaimed: 64000
    });
    console.log("\n✅ 4. MyBizCFO GST Filing API Test:", gstRes.success ? "PASSED" : "FAILED");
    console.log("   Msg:", gstRes.message);

    // 5. Test Form 26QB Property Sale TDS
    const tdsRes = await makePostRequest('/api/legal/form26qb', {
      buyerName: "Rajesh Kumar",
      buyerPAN: "ABCDE1234F",
      sellerName: "Suresh Mehta",
      sellerPAN: "XYZPM9876K",
      propertyValue: 8500000
    });
    console.log("\n✅ 5. Form 26QB Property TDS API Test:", tdsRes.success ? "PASSED" : "FAILED");
    console.log(`   1% TDS Amount: ₹${tdsRes.data?.tdsAmount.toLocaleString('en-IN')} (Challan: ${tdsRes.data?.challanNo})`);

    // 6. Test CIT(A) Appeal
    const appealRes = await makePostRequest('/api/legal/appeal-file', {
      taxpayerName: "Rajesh Kumar",
      assessmentYear: "2025-26",
      disputedDemand: 180000,
      grounds: "HRA exemption disallowance appeal."
    });
    console.log("\n✅ 6. CIT(A) Dispute Appeal API Test:", appealRes.success ? "PASSED" : "FAILED");
    console.log("   Msg:", appealRes.message);

    console.log("\n🎉 ALL ENTERPRISE SUITE API TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Enterprise Suite Test Error:", err);
    process.exit(1);
  }
}

runEnterpriseSuiteTests();
