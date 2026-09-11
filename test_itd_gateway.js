// Test Script for ITD Gateway API Module
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

async function runITDGatewayTests() {
  console.log("🚀 Running Official ITD Gateway API Test Suite...\n");

  try {
    // 1. Get Config
    const configRes = await makeGetRequest('/api/v1/itd/config');
    console.log("✅ 1. Get ITD Gateway Config API Test:", configRes.success ? "PASSED" : "FAILED");
    console.log(`   Active Mode: ${configRes.data?.mode}`);

    // 2. Test Connection
    const connRes = await makePostRequest('/api/v1/itd/test-connection', {});
    console.log("\n✅ 2. ITD Gateway Connection Test:", connRes.success ? "PASSED" : "FAILED");
    console.log(`   Result: ${connRes.message}`);

    // 3. Trigger Aadhaar OTP
    const otpTriggerRes = await makePostRequest('/api/v1/itd/generate-otp', {
      pan: "ABCDE1234F",
      aadhaarNo: "XXXX-XXXX-9876"
    });
    console.log("\n✅ 3. Generate Aadhaar OTP API Test:", otpTriggerRes.success ? "PASSED" : "FAILED");
    console.log(`   Txn ID: ${otpTriggerRes.transactionId}`);
    console.log(`   Msg: ${otpTriggerRes.message}`);

    // 4. Verify Aadhaar OTP
    const otpVerifyRes = await makePostRequest('/api/v1/itd/verify-otp', {
      transactionId: otpTriggerRes.transactionId,
      otp: "123456"
    });
    console.log("\n✅ 4. Verify Aadhaar OTP API Test:", otpVerifyRes.success ? "PASSED" : "FAILED");
    console.log(`   Ack Number: ${otpVerifyRes.ackNumber}`);
    console.log(`   ITD Digital Signature: ${otpVerifyRes.itdSignature}`);

    console.log("\n🎉 ALL ITD GATEWAY API TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ ITD Gateway Test Error:", err);
    process.exit(1);
  }
}

runITDGatewayTests();
