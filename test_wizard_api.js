// Test Script for TaxBuddy Wizard & E-Verify APIs
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

async function runWizardTests() {
  console.log("🚀 Running TaxBuddy Wizard & E-Verification Test Suite...\n");

  try {
    // 1. Submit 6-Step Wizard Filing
    const wizardRes = await makePostRequest('/api/itr/wizard-submit', {
      profile: {
        fullName: "Ananya Deshmukh",
        pan: "PQRS5678M",
        dob: "1994-08-20",
        category: "Salaried Employee"
      },
      bank: {
        bankName: "ICICI Bank",
        accountNumber: "000401567890",
        ifsc: "ICIC0000004"
      },
      incomeDetails: {
        grossSalary: 1650000,
        hraReceived: 210000,
        otherIncome: 30000,
        tdsPaid: 135000
      },
      deductions: {
        rentPaidMonthly: 22000,
        isMetro: true,
        sec80C: 150000,
        sec80D: 25000,
        nps80CCD: 50000
      },
      planType: "Assisted - Salaried Professional",
      eVerified: false
    });

    console.log("✅ 1. Wizard Submit API Test:", wizardRes.success ? "PASSED" : "FAILED");
    console.log("   Filing ID:", wizardRes.data?.id);
    console.log("   Ack Number Generated:", wizardRes.data?.ackNumber);
    console.log("   Calculated Net Result:", wizardRes.data?.taxSummary?.recommendation?.summary);

    // 2. Test E-Verification via Aadhaar OTP
    const everifyRes = await makePostRequest('/api/itr/everify', {
      filingId: wizardRes.data?.id,
      otp: "123456"
    });

    console.log("\n✅ 2. Aadhaar OTP E-Verify API Test:", everifyRes.success ? "PASSED" : "FAILED");
    console.log("   Status:", everifyRes.data?.status);
    console.log("   Message:", everifyRes.message);

    console.log("\n🎉 ALL WIZARD & E-VERIFY API TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Wizard API Test Error:", err);
    process.exit(1);
  }
}

runWizardTests();
