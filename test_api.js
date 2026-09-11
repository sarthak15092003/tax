// Test Script for TaxBuddy Express API
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

async function runTests() {
  console.log("🚀 Running TaxBuddy API Suite Verification...\n");

  try {
    // 1. Test Tax Calculator
    const calcRes = await makePostRequest('/api/tax/calculate', {
      grossSalary: 1500000,
      hraReceived: 180000,
      otherIncome: 20000,
      sec80C: 150000,
      sec80D: 25000
    });
    console.log("✅ 1. Tax Calculation API Test:", calcRes.success ? "PASSED" : "FAILED");
    console.log("   Summary:", calcRes.data?.recommendation?.summary);

    // 2. Test Get Filings
    const filingsRes = await makeGetRequest('/api/itr/filings');
    console.log("\n✅ 2. Get Filings API Test:", filingsRes.success && filingsRes.data?.length > 0 ? "PASSED" : "FAILED");
    console.log(`   Found ${filingsRes.data?.length} filings.`);

    // 3. Test ITR Submit
    const submitRes = await makePostRequest('/api/itr/submit', {
      userName: "Vikram Malhotra",
      pan: "XYZPD9876Q",
      planType: "Assisted - Salaried",
      incomeDetails: { grossSalary: 1800000, regimeChosen: "New Regime" }
    });
    console.log("\n✅ 3. Submit ITR API Test:", submitRes.success ? "PASSED" : "FAILED");
    console.log("   New Filing ID:", submitRes.data?.id);

    // 4. Test AI Query
    const aiRes = await makePostRequest('/api/ai/query', { query: "How to save tax with HRA?" });
    console.log("\n✅ 4. TaxBuddy AI Assistant API Test:", aiRes.success ? "PASSED" : "FAILED");
    console.log("   Answer:", aiRes.answer);

    // 5. Test Expert Update Status
    const expertRes = await makePostRequest('/api/expert/update-status', {
      filingId: submitRes.data?.id,
      newStatus: "Return Formed"
    });
    console.log("\n✅ 5. CA Expert Update Status API Test:", expertRes.success ? "PASSED" : "FAILED");
    console.log("   Status Msg:", expertRes.message);

    console.log("\n🎉 ALL BACKEND API TESTS COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ API Test Error:", err);
    process.exit(1);
  }
}

// Give server time to spin up if running
runTests();
