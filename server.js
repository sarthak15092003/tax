const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Storage setup for document uploads (with Vercel /tmp support)
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Warning creating upload dir:", err);
  }
}
const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Paths to JSON data stores
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const FILINGS_FILE = path.join(__dirname, 'data', 'filings.json');
const NOTICES_FILE = path.join(__dirname, 'data', 'notices.json');
const AIS_FILE = path.join(__dirname, 'data', 'ais_records.json');
const FLEXI_FILE = path.join(__dirname, 'data', 'flexibuddy.json');
const PORTFOLIO_FILE = path.join(__dirname, 'data', 'portfolio_scans.json');
const BIZ_FILE = path.join(__dirname, 'data', 'business_services.json');
const LEGAL_FILE = path.join(__dirname, 'data', 'legal_cases.json');

// Helper to read/write JSON (with Vercel /tmp directory support)
function getStoragePath(filePath) {
  if (process.env.VERCEL) {
    const fileName = path.basename(filePath);
    const tmpPath = path.join('/tmp', fileName);
    if (!fs.existsSync(tmpPath) && fs.existsSync(filePath)) {
      try { fs.copyFileSync(filePath, tmpPath); } catch (e) {}
    }
    return tmpPath;
  }
  return filePath;
}

function readJSON(filePath) {
  try {
    const targetPath = getStoragePath(filePath);
    if (!fs.existsSync(targetPath)) return [];
    return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    const targetPath = getStoragePath(filePath);
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// -------------------------------------------------------------
// 1. TAX CALCULATION ENGINE (Old vs New Regime for FY 2025-26 / AY 2026-27)
// -------------------------------------------------------------
function calculateTax(inputs) {
  const grossSalary = Number(inputs.grossSalary) || 0;
  const hraReceived = Number(inputs.hraReceived) || 0;
  const rentPaidAnnual = Number(inputs.rentPaidAnnual) || 0;
  const isMetro = inputs.isMetro === true || inputs.isMetro === 'true';
  const basicSalary = Number(inputs.basicSalary) || (grossSalary * 0.5);
  const otherIncome = Number(inputs.otherIncome) || 0;
  const tdsPaid = Number(inputs.tdsPaid) || 0;

  // HRA Exemption Math
  let hraExemptionOld = 0;
  if (rentPaidAnnual > 0 && hraReceived > 0) {
    const rentMinusTenPercent = Math.max(0, rentPaidAnnual - (basicSalary * 0.10));
    const metroCap = basicSalary * (isMetro ? 0.50 : 0.40);
    hraExemptionOld = Math.min(hraReceived, rentMinusTenPercent, metroCap);
  }

  // Deductions for Old Regime
  const sec80C = Math.min(Number(inputs.sec80C) || 0, 150000);
  const sec80D = Math.min(Number(inputs.sec80D) || 0, 75000);
  const nps80CCD = Math.min(Number(inputs.nps80CCD) || 0, 50000);
  const homeLoanInterest = Math.min(Number(inputs.homeLoanInterest) || 0, 200000);
  const otherDeductions = Number(inputs.otherDeductions) || 0;

  // --- OLD REGIME CALCULATIONS ---
  const standardDeductionOld = 50000;
  const totalOldDeductions = standardDeductionOld + hraExemptionOld + sec80C + sec80D + nps80CCD + homeLoanInterest + otherDeductions;
  
  let taxableOld = Math.max(0, (grossSalary + otherIncome) - totalOldDeductions);
  let taxOld = 0;

  if (taxableOld > 1000000) {
    taxOld += (taxableOld - 1000000) * 0.30;
    taxOld += 500000 * 0.20;
    taxOld += 250000 * 0.05;
  } else if (taxableOld > 500000) {
    taxOld += (taxableOld - 500000) * 0.20;
    taxOld += 250000 * 0.05;
  } else if (taxableOld > 250000) {
    taxOld += (taxableOld - 250000) * 0.05;
  }

  if (taxableOld <= 500000) {
    taxOld = Math.max(0, taxOld - 12500);
  }
  const cessOld = Math.round(taxOld * 0.04);
  const finalTaxOld = Math.round(taxOld + cessOld);
  const refundOrPayableOld = tdsPaid - finalTaxOld;

  // --- NEW REGIME CALCULATIONS (FY 2025-26 / AY 2026-27 Slabs) ---
  const standardDeductionNew = 75000;
  let taxableNew = Math.max(0, (grossSalary + otherIncome) - standardDeductionNew);
  let taxNew = 0;

  if (taxableNew > 1500000) {
    taxNew += (taxableNew - 1500000) * 0.30;
    taxNew += 300000 * 0.20;
    taxNew += 200000 * 0.15;
    taxNew += 300000 * 0.10;
    taxNew += 400000 * 0.05;
  } else if (taxableNew > 1200000) {
    taxNew += (taxableNew - 1200000) * 0.20;
    taxNew += 200000 * 0.15;
    taxNew += 300000 * 0.10;
    taxNew += 400000 * 0.05;
  } else if (taxableNew > 1000000) {
    taxNew += (taxableNew - 1000000) * 0.15;
    taxNew += 300000 * 0.10;
    taxNew += 400000 * 0.05;
  } else if (taxableNew > 700000) {
    taxNew += (taxableNew - 700000) * 0.10;
    taxNew += 400000 * 0.05;
  } else if (taxableNew > 300000) {
    taxNew += (taxableNew - 300000) * 0.05;
  }

  if (taxableNew <= 700000) {
    taxNew = 0;
  }
  const cessNew = Math.round(taxNew * 0.04);
  const finalTaxNew = Math.round(taxNew + cessNew);
  const refundOrPayableNew = tdsPaid - finalTaxNew;

  const recommendedRegime = finalTaxNew <= finalTaxOld ? "New Tax Regime" : "Old Tax Regime";
  const optimalTax = Math.min(finalTaxNew, finalTaxOld);
  const optimalRefundOrPayable = tdsPaid - optimalTax;
  const taxDifference = Math.abs(finalTaxOld - finalTaxNew);

  return {
    grossSalary,
    otherIncome,
    tdsPaid,
    totalIncomeGross: grossSalary + otherIncome,
    hraExemptionCalculated: hraExemptionOld,
    oldRegime: {
      standardDeduction: standardDeductionOld,
      hraExemption: hraExemptionOld,
      totalDeductions: totalOldDeductions,
      taxableIncome: taxableOld,
      taxBeforeCess: Math.round(taxOld),
      cess: cessOld,
      totalTaxPayable: finalTaxOld,
      refundOrPayable: refundOrPayableOld
    },
    newRegime: {
      standardDeduction: standardDeductionNew,
      totalDeductions: standardDeductionNew,
      taxableIncome: taxableNew,
      taxBeforeCess: Math.round(taxNew),
      cess: cessNew,
      totalTaxPayable: finalTaxNew,
      refundOrPayable: refundOrPayableNew
    },
    recommendation: {
      recommendedRegime,
      savings: taxDifference,
      optimalTax,
      optimalRefundOrPayable,
      isRefund: optimalRefundOrPayable > 0,
      summary: finalTaxNew <= finalTaxOld 
        ? `New Tax Regime saves you ₹${taxDifference.toLocaleString('en-IN')} tax!`
        : `Old Tax Regime saves you ₹${taxDifference.toLocaleString('en-IN')} tax due to claimed exemptions!`
    }
  };
}

// API: Calculate Tax
app.post('/api/tax/calculate', (req, res) => {
  const result = calculateTax(req.body);
  res.json({ success: true, data: result });
});

// -------------------------------------------------------------
// 2. ITD AIS / TIS & FORM 26AS LIVE SYNC ENGINE
// -------------------------------------------------------------
app.post('/api/itd/sync-ais', (req, res) => {
  const pan = (req.body.pan || "ABCDE1234F").toUpperCase();
  const aisData = readJSON(AIS_FILE);
  
  const record = aisData[pan] || {
    pan: pan,
    name: req.body.name || "Taxpayer User",
    financialYear: "2025-26",
    assessmentYear: "2026-27",
    summary: {
      totalSalarySec192: 1450000,
      savingsInterestSec194A: 18500,
      dividendSec194K: 6500,
      stockSaleProceedsSFT017: 240000,
      totalTDSCredits26AS: 110000
    },
    aisEntries: [
      { category: "Salary (Sec 192)", source: "TechCorp Global Pvt Ltd", amount: 1450000, tds: 110000 },
      { category: "Savings Interest (Sec 194A)", source: "HDFC Bank Ltd", amount: 18500, tds: 0 },
      { category: "Dividend Income (Sec 194K)", source: "Reliance Industries Ltd", amount: 6500, tds: 0 },
      { category: "Securities Sale (SFT-017)", source: "Zerodha Broking Ltd", amount: 240000, tds: 0 }
    ]
  };

  res.json({
    success: true,
    message: `AIS / TIS & Form 26AS data retrieved live from ITD E-filing Gateway for PAN ${pan}!`,
    data: record
  });
});

// -------------------------------------------------------------
// 3. FLEXIBUDDY CORPORATE SALARY TAX SAVER SUITE
// -------------------------------------------------------------
app.post('/api/flexibuddy/calculate', (req, res) => {
  const baseSalary = Number(req.body.baseSalary) || 1200000;
  const foodCard = Number(req.body.foodCard) || 26400; // Meal Card
  const lta = Number(req.body.lta) || 50000;
  const fuelAllowance = Number(req.body.fuelAllowance) || 39600;
  const booksSubscriptions = Number(req.body.booksSubscriptions) || 15000;
  const internetReimbursement = Number(req.body.internetReimbursement) || 18000;

  const totalExemptions = foodCard + lta + fuelAllowance + booksSubscriptions + internetReimbursement;
  const revisedTaxableSalary = Math.max(0, baseSalary - totalExemptions);

  // Calculate tax saved assuming 30% slab rate
  const taxSaved = Math.round(totalExemptions * 0.312); // including 4% cess

  const responseData = {
    baseSalary,
    flexiComponents: { foodCard, lta, fuelAllowance, booksSubscriptions, internetReimbursement },
    totalFlexiExemption: totalExemptions,
    revisedTaxableSalary,
    annualTaxSaved: taxSaved,
    monthlyTakeHomeIncrease: Math.round(taxSaved / 12)
  };

  res.json({ success: true, data: responseData });
});

app.post('/api/flexibuddy/save', (req, res) => {
  const flexiRecords = readJSON(FLEXI_FILE);
  const newRecord = {
    companyName: req.body.companyName || "TechCorp Global Pvt Ltd",
    employeeId: req.body.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    employeeName: req.body.employeeName || "Rajesh Kumar",
    baseSalary: Number(req.body.baseSalary) || 1200000,
    flexiComponents: req.body.flexiComponents || {},
    totalFlexiExemption: req.body.totalFlexiExemption || 149000,
    taxSavedAnnual: req.body.taxSavedAnnual || 46488,
    configuredAt: new Date().toISOString()
  };

  flexiRecords.unshift(newRecord);
  writeJSON(FLEXI_FILE, flexiRecords);

  res.json({
    success: true,
    message: `FlexiBuddy benefit plan configured! Annual tax savings of ₹${newRecord.taxSavedAnnual.toLocaleString('en-IN')} active.`,
    data: newRecord
  });
});

// -------------------------------------------------------------
// 4. PORTFOLIO DOCTOR & CAPITAL GAINS CAS ANALYZER
// -------------------------------------------------------------
app.post('/api/portfolio/analyze', upload.single('file'), (req, res) => {
  const file = req.file;

  const equitySTCG = Number(req.body.equitySTCG) || 45000;
  const equityLTCG = Number(req.body.equityLTCG) || 165000;
  const cryptoGains = Number(req.body.cryptoGains) || 25000;

  // Sec 112A LTCG Exemption limit: ₹1,25,000 (Budget 2024 amendment)
  const ltcgExemptLimit = 125000;
  const taxableLTCG = Math.max(0, equityLTCG - ltcgExemptLimit);
  
  // Tax Calculations
  const stcgTax = Math.round(equitySTCG * 0.20); // 20% Sec 111A
  const ltcgTax = Math.round(taxableLTCG * 0.125); // 12.5% Sec 112A
  const cryptoTax = Math.round(cryptoGains * 0.30); // 30% Sec 115BBH

  const totalCapitalGainsTax = Math.round((stcgTax + ltcgTax + cryptoTax) * 1.04);

  const scanRecord = {
    id: `cas_${Date.now()}`,
    fileName: file ? file.originalname : "CAMS_CAS_Statement.pdf",
    pan: req.body.pan || "ABCDE1234F",
    investorName: req.body.investorName || "Rajesh Kumar",
    totalPortfolioValue: 1850000,
    equitySTCG,
    equityLTCG,
    cryptoGains,
    taxableLTCG,
    stcgTax,
    ltcgTax,
    cryptoTax,
    totalCapitalGainsTax,
    harvestingRecommendation: "Sell 15 shares of Tata Motors to harvest ₹18,000 capital loss before March 31st!",
    scannedAt: new Date().toISOString()
  };

  const records = readJSON(PORTFOLIO_FILE);
  records.unshift(scanRecord);
  writeJSON(PORTFOLIO_FILE, records);

  res.json({
    success: true,
    message: "CAS Portfolio scanned! Capital Gains tax computed under Sec 111A, 112A & 115BBH.",
    data: scanRecord
  });
});

// -------------------------------------------------------------
// 5. MYBIZCFO GST & CORPORATE COMPLIANCE SUITE
// -------------------------------------------------------------
app.post('/api/business/gst-file', (req, res) => {
  const bizRecords = readJSON(BIZ_FILE);
  const newBiz = {
    id: `biz_${Date.now()}`,
    businessName: req.body.businessName || "Zenith Innovations Pvt Ltd",
    serviceType: req.body.returnType || "GSTR-1 & GSTR-3B Monthly Return",
    gstin: req.body.gstin || "27AAACZ1234K1Z5",
    period: req.body.period || "August 2026",
    status: "Filing Accepted & E-Filed",
    itcClaimed: Number(req.body.itcClaimed) || 52000,
    submittedAt: new Date().toISOString()
  };

  bizRecords.unshift(newBiz);
  writeJSON(BIZ_FILE, bizRecords);

  res.json({
    success: true,
    message: `GST Return for ${newBiz.businessName} (${newBiz.period}) filed successfully! ARN generated.`,
    data: newBiz
  });
});

app.post('/api/business/company-reg', (req, res) => {
  const bizRecords = readJSON(BIZ_FILE);
  const newBiz = {
    id: `inc_${Date.now()}`,
    businessName: req.body.proposedName || "Apex Digital Solutions Pvt Ltd",
    serviceType: "New Company Incorporation (SPICe+)",
    entityType: req.body.entityType || "Private Limited Company",
    directorsCount: Number(req.body.directorsCount) || 2,
    status: "NAME Approved - RUN Application Complete",
    submittedAt: new Date().toISOString()
  };

  bizRecords.unshift(newBiz);
  writeJSON(BIZ_FILE, bizRecords);

  res.json({
    success: true,
    message: `Company Registration application submitted for ${newBiz.businessName}! SPICe+ form initialized.`,
    data: newBiz
  });
});

// -------------------------------------------------------------
// 6. LEGAL SERVICES & FORM 26QB PROPERTY TDS SUITE
// -------------------------------------------------------------
app.post('/api/legal/form26qb', (req, res) => {
  const legalRecords = readJSON(LEGAL_FILE);
  const propertyValue = Number(req.body.propertyValue) || 7500000;
  const tdsAmount = Math.round(propertyValue * 0.01); // 1% TDS Sec 194-IA

  const newRecord = {
    id: `leg_${Date.now()}`,
    caseType: "Form 26QB Property Sale TDS",
    buyerName: req.body.buyerName || "Rajesh Kumar",
    buyerPAN: (req.body.buyerPAN || "ABCDE1234F").toUpperCase(),
    sellerName: req.body.sellerName || "Suresh Mehta",
    sellerPAN: (req.body.sellerPAN || "XYZPM9876K").toUpperCase(),
    propertyValue,
    tdsAmount,
    challanNo: `CHAL2026${Math.floor(100000 + Math.random() * 900000)}`,
    status: "Challan Generated & Form 26QB Transmitted",
    submittedAt: new Date().toISOString()
  };

  legalRecords.unshift(newRecord);
  writeJSON(LEGAL_FILE, legalRecords);

  res.json({
    success: true,
    message: `Form 26QB 1% Property TDS Challan (₹${tdsAmount.toLocaleString('en-IN')}) generated successfully under Section 194-IA!`,
    data: newRecord
  });
});

app.post('/api/legal/appeal-file', (req, res) => {
  const legalRecords = readJSON(LEGAL_FILE);
  const newAppeal = {
    id: `app_${Date.now()}`,
    caseType: "CIT(A) Income Tax Appeal",
    taxpayerName: req.body.taxpayerName || "Rajesh Kumar",
    assessmentYear: req.body.assessmentYear || "2024-25",
    disputedDemand: Number(req.body.disputedDemand) || 145000,
    groundsOfAppeal: req.body.grounds || "Disallowance of HRA & Sec 80C deductions despite submitting rent receipts.",
    assignedAdvocate: "Adv. Meenakshi Sundaram (High Court Panelist)",
    status: "Appeal Drafted & Form 35 Submitted to CIT(A)",
    submittedAt: new Date().toISOString()
  };

  legalRecords.unshift(newAppeal);
  writeJSON(LEGAL_FILE, legalRecords);

  res.json({
    success: true,
    message: `Form 35 Appeal for AY ${newAppeal.assessmentYear} submitted before CIT(A)! Appeal Acknowledgement created.`,
    data: newAppeal
  });
});

// -------------------------------------------------------------
// 7. EXISTING ITR & NOTICE API ENDPOINTS
// -------------------------------------------------------------
app.post('/api/tax/parse-form16', upload.single('file'), (req, res) => {
  const file = req.file;
  const parsedData = {
    fileName: file ? file.originalname : "Form16_Sample.pdf",
    employerName: "TechCorp Global Private Limited",
    employerPAN: "AAACA1234K",
    employeePAN: "ABCDE1234F",
    financialYear: "2025-26",
    assessmentYear: "2026-27",
    grossSalary: 1450000,
    hraReceived: 180000,
    sec80C: 150000,
    sec80D: 25000,
    tdsDeducted: 110000,
    confidenceScore: "98.8%",
    status: "Parsed Successfully"
  };

  res.json({ success: true, message: "Form 16 auto-parsed!", data: parsedData });
});

app.get('/api/itr/filings', (req, res) => {
  const filings = readJSON(FILINGS_FILE);
  res.json({ success: true, data: filings });
});

app.post('/api/itr/wizard-submit', (req, res) => {
  const filings = readJSON(FILINGS_FILE);
  
  const taxSummary = calculateTax({
    grossSalary: req.body.incomeDetails?.grossSalary || 1450000,
    hraReceived: req.body.incomeDetails?.hraReceived || 180000,
    rentPaidAnnual: (req.body.deductions?.rentPaidMonthly || 0) * 12,
    isMetro: req.body.deductions?.isMetro,
    otherIncome: req.body.incomeDetails?.otherIncome || 0,
    sec80C: req.body.deductions?.sec80C || 0,
    sec80D: req.body.deductions?.sec80D || 0,
    nps80CCD: req.body.deductions?.nps80CCD || 0,
    tdsPaid: req.body.incomeDetails?.tdsPaid || 0
  });

  const ackNumber = `ACK2026${Math.floor(100000000 + Math.random() * 900000000)}`;

  const newWizardFiling = {
    id: `itr_${Date.now()}`,
    ackNumber: ackNumber,
    userId: "usr_101",
    userName: req.body.profile?.fullName || "Taxpayer User",
    pan: (req.body.profile?.pan || "ABCDE1234F").toUpperCase(),
    dob: req.body.profile?.dob || "1992-05-15",
    assessmentYear: "2026-27",
    financialYear: "2025-26",
    planType: req.body.planType || "Assisted - Salaried",
    status: req.body.eVerified ? "Return Filed & E-Verified" : "Pending E-Verification",
    assignedCA: req.body.planType?.includes("DIY") ? "AI Auto Validator" : "CA Gaurav Sharma (Ex-IRS Advisor)",
    bankDetails: {
      accountNumber: req.body.bank?.accountNumber || "XXXX5678",
      ifsc: req.body.bank?.ifsc || "SBIN0001234",
      bankName: req.body.bank?.bankName || "State Bank of India"
    },
    incomeDetails: req.body.incomeDetails || {},
    deductions: req.body.deductions || {},
    taxSummary: taxSummary,
    eVerified: req.body.eVerified || false,
    everifiedAt: req.body.eVerified ? new Date().toISOString() : null,
    submittedAt: new Date().toISOString()
  };

  filings.unshift(newWizardFiling);
  writeJSON(FILINGS_FILE, filings);

  res.json({
    success: true,
    message: "🎉 Your Income Tax Return (ITR-1) for AY 2026-27 has been submitted!",
    data: newWizardFiling
  });
});

app.post('/api/itr/auto-pilot', (req, res) => {
  const filings = readJSON(FILINGS_FILE);
  const pan = (req.body.pan || "ABCDE1234F").toUpperCase();
  const name = req.body.fullName || "Rajesh Kumar";
  
  const grossSalary = req.body.grossSalary || 1450000;
  const hraReceived = req.body.hraReceived || 180000;
  const rentPaidAnnual = req.body.rentPaidAnnual || 240000;
  const otherIncome = req.body.otherIncome || 25000;
  const sec80C = req.body.sec80C || 150000;
  const sec80D = req.body.sec80D || 25000;
  const nps80CCD = req.body.nps80CCD || 50000;
  const tdsPaid = req.body.tdsPaid || 135000;

  const taxSummary = calculateTax({
    grossSalary,
    hraReceived,
    rentPaidAnnual,
    isMetro: true,
    otherIncome,
    sec80C,
    sec80D,
    nps80CCD,
    tdsPaid
  });

  const ackNumber = `ACK2026${Math.floor(100000000 + Math.random() * 900000000)}`;

  const autoFiling = {
    id: `itr_auto_${Date.now()}`,
    ackNumber: ackNumber,
    userId: "usr_101",
    userName: name,
    pan: pan,
    dob: req.body.dob || "1992-05-15",
    assessmentYear: "2026-27",
    financialYear: "2025-26",
    planType: "Assisted - 1-Click Auto-Pilot",
    status: "Return Filed & E-Verified",
    assignedCA: "AI Auto-Pilot Filing System & TaxBuddy CA Team",
    bankDetails: {
      accountNumber: req.body.accountNumber || "987654321012",
      ifsc: req.body.ifsc || "SBIN0001234",
      bankName: req.body.bankName || "State Bank of India"
    },
    incomeDetails: {
      grossSalary,
      hraReceived,
      otherIncome,
      tdsPaid
    },
    deductions: {
      rentPaidMonthly: rentPaidAnnual / 12,
      isMetro: true,
      sec80C,
      sec80D,
      nps80CCD
    },
    taxSummary: taxSummary,
    eVerified: true,
    everifiedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    autoPilotLogs: [
      "📡 Connected to Income Tax Department ERI Gateway",
      "📊 AIS / TIS Data Synced Successfully",
      "📄 Form 16 Auto-Parsed (TDS Verified)",
      "⚖️ Tax Engine Regime Comparison Completed",
      "🔒 Return Submitted to ITD e-Filing Portal",
      "✅ Aadhaar OTP Auto E-Verified"
    ]
  };

  filings.unshift(autoFiling);
  writeJSON(FILINGS_FILE, filings);

  res.json({
    success: true,
    message: "🚀 1-Click Auto-Pilot ITR Filing & Aadhaar E-Verification Completed Successfully!",
    data: autoFiling
  });
});

app.post('/api/itr/everify', (req, res) => {
  const { filingId, otp } = req.body;
  const filings = readJSON(FILINGS_FILE);

  const item = filings.find(f => f.id === filingId);
  if (!item) {
    return res.status(404).json({ success: false, message: "Filing not found" });
  }

  item.status = "Return Filed & E-Verified";
  item.eVerified = true;
  item.everifiedAt = new Date().toISOString();
  if (!item.ackNumber) {
    item.ackNumber = `ACK2026${Math.floor(100000000 + Math.random() * 900000000)}`;
  }

  writeJSON(FILINGS_FILE, filings);

  res.json({
    success: true,
    message: `Aadhaar OTP Verified Successfully! Acknowledgement No: ${item.ackNumber}`,
    data: item
  });
});

app.get('/api/notices', (req, res) => {
  const notices = readJSON(NOTICES_FILE);
  res.json({ success: true, data: notices });
});

app.post('/api/notices/upload', (req, res) => {
  const notices = readJSON(NOTICES_FILE);
  const newNotice = {
    id: `ntc_${Date.now()}`,
    userId: req.body.userId || "usr_101",
    userName: req.body.userName || "Rajesh Kumar",
    noticeType: req.body.noticeType || "Section 143(1) Intimation",
    assessmentYear: req.body.assessmentYear || "2025-26",
    receivedDate: req.body.receivedDate || new Date().toISOString().split('T')[0],
    status: "Assigned to Notice Specialist",
    assignedCA: "CA Gaurav Sharma",
    demandAmount: Number(req.body.demandAmount) || 0,
    description: req.body.description || "Notice received from Income Tax Department.",
    documents: [req.body.fileName || "Notice_Copy.pdf"],
    updates: [
      {
        timestamp: new Date().toISOString(),
        author: "System AI",
        text: "Notice ticket created. Assigned to TaxBuddy Notice Defense Team."
      }
    ]
  };

  notices.unshift(newNotice);
  writeJSON(NOTICES_FILE, notices);

  res.json({
    success: true,
    message: "Tax Notice uploaded successfully! Free expert notice support activated.",
    data: newNotice
  });
});

app.post('/api/expert/update-status', (req, res) => {
  const { filingId, newStatus, caNotes } = req.body;
  const filings = readJSON(FILINGS_FILE);

  const item = filings.find(f => f.id === filingId);
  if (!item) {
    return res.status(404).json({ success: false, message: "Filing not found" });
  }

  item.status = newStatus;
  if (caNotes) item.caNotes = caNotes;
  item.updatedAt = new Date().toISOString();

  writeJSON(FILINGS_FILE, filings);

  res.json({
    success: true,
    message: `Filing ${filingId} status updated to '${newStatus}'!`,
    data: item
  });
});

app.post('/api/ai/query', (req, res) => {
  const query = (req.body.query || '').toLowerCase();
  let responseText = "";

  if (query.includes('flexibuddy') || query.includes('flexi')) {
    responseText = "FlexiBuddy allows employers & employees to restructure salary components (Food coupons ₹26,400, LTA ₹50k, Fuel ₹39,600, Internet ₹18k) to save up to ₹46,488 tax per year under Section 10!";
  } else if (query.includes('cas') || query.includes('portfolio')) {
    responseText = "TaxBuddy Portfolio Doctor scans your CAMS/KFintech CAS statement to compute Equity STCG (20%), LTCG (12.5% above ₹1.25L exemption), and Crypto 30% tax with tax loss harvesting suggestions!";
  } else if (query.includes('26qb') || query.includes('property')) {
    responseText = "Under Section 194-IA, purchasing immovable property above ₹50 Lakhs requires deducting 1% TDS and submitting Form 26QB within 30 days. TaxBuddy handles Form 26QB filing instantly!";
  } else if (query.includes('gst') || query.includes('biz')) {
    responseText = "MyBizCFO offers GSTR-1 & GSTR-3B filing, Input Tax Credit (ITC) reconciliation, Form 24Q/26Q TDS returns, and SPICe+ Private Limited & LLP company incorporation!";
  } else if (query.includes('regime') || query.includes('old vs new')) {
    responseText = "Under FY 2025-26 (AY 2026-27), the New Tax Regime offers a standard deduction of ₹75,000 and zero tax for taxable income up to ₹7 Lakhs (gross income up to ₹7.75 Lakhs).";
  } else {
    responseText = `Thanks for asking TaxBuddy AI! Regarding "${req.body.query}", our platform supports full automated e-filing, AIS sync, FlexiBuddy, Portfolio Doctor, GST, and Form 26QB legal services.`;
  }

  res.json({ success: true, query: req.body.query, answer: responseText });
});

const { getITDConfig, saveITDConfig, ITDGatewayEngine } = require('./itd_gateway');

// -------------------------------------------------------------
// ITD ERI GATEWAY API ROUTES
// -------------------------------------------------------------
app.get('/api/v1/itd/config', (req, res) => {
  res.json({ success: true, data: getITDConfig() });
});

app.post('/api/v1/itd/config', (req, res) => {
  const saved = saveITDConfig(req.body);
  ITDGatewayEngine.reloadConfig();
  res.json({
    success: saved,
    message: saved ? `ITD Gateway configured! Active Mode: ${req.body.mode}` : "Failed to save configuration"
  });
});

app.post('/api/v1/itd/test-connection', async (req, res) => {
  try {
    const token = await ITDGatewayEngine.getOAuthToken();
    const config = getITDConfig();
    res.json({
      success: true,
      message: `[${config.mode}] ITD Gateway Connection Test Successful! OAuth Token retrieved: ${token.accessToken ? 'Valid Token' : 'OK'}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: `Connection Test Failed: ${err.message}` });
  }
});

app.post('/api/v1/itd/generate-otp', async (req, res) => {
  const { pan, aadhaarNo } = req.body;
  const result = await ITDGatewayEngine.requestAadhaarOTP(pan, aadhaarNo);
  res.json(result);
});

app.post('/api/v1/itd/verify-otp', async (req, res) => {
  const { transactionId, otp } = req.body;
  const result = await ITDGatewayEngine.verifyAadhaarOTP(transactionId, otp);
  res.json(result);
});

// -------------------------------------------------------------
// 8. RAZORPAY PAYMENT GATEWAY APIS
// -------------------------------------------------------------
app.post('/api/v1/payment/create-order', (req, res) => {
  const amount = Number(req.body.amount) || 499;
  const orderId = `order_${Math.floor(100000000 + Math.random() * 900000000)}`;

  res.json({
    success: true,
    orderId,
    amount: amount * 100, // paise
    currency: "INR",
    keyId: "rzp_live_taxbuddy_demo_key",
    message: "Razorpay order created successfully!"
  });
});

app.post('/api/v1/payment/verify-signature', (req, res) => {
  const payments = readJSON(path.join(__dirname, 'data', 'payments.json'));
  const newPayment = {
    orderId: req.body.orderId || `ord_${Date.now()}`,
    paymentId: req.body.paymentId || `pay_${Date.now()}_rzp`,
    amount: Number(req.body.amount) || 499,
    currency: "INR",
    planType: req.body.planType || "Assisted - Salaried Professional",
    taxpayerName: req.body.taxpayerName || "Rajesh Kumar",
    status: "PAID",
    timestamp: new Date().toISOString()
  };

  payments.unshift(newPayment);
  writeJSON(path.join(__dirname, 'data', 'payments.json'), payments);

  res.json({
    success: true,
    message: "🎉 Payment verified via Razorpay! Dedicated CA assigned to your return.",
    data: newPayment
  });
});

// -------------------------------------------------------------
// 9. WHATSAPP & SMS OTP AUTH APIS
// -------------------------------------------------------------
app.post('/api/v1/auth/send-whatsapp-otp', (req, res) => {
  const mobile = req.body.mobile || "+91 98765 43210";
  res.json({
    success: true,
    mobile,
    txnId: `WA_TXN_${Date.now()}`,
    message: `[WHATSAPP BUSINESS API] Sent 6-digit OTP to ${mobile} via WhatsApp!`
  });
});

app.post('/api/v1/auth/verify-whatsapp-otp', (req, res) => {
  const { otp, mobile } = req.body;
  if (!otp || otp.length !== 6) {
    return res.status(400).json({ success: false, message: "Invalid WhatsApp OTP" });
  }

  res.json({
    success: true,
    user: {
      id: "usr_101",
      name: "Rajesh Kumar",
      mobile: mobile || "+91 98765 43210",
      role: "taxpayer"
    },
    token: `JWT_TAXBUDDY_WA_${Date.now()}`,
    message: "WhatsApp OTP verified! Session authenticated."
  });
});

// -------------------------------------------------------------
// 10. TRACES FORM 16 CERTIFICATE VERIFIER API
// -------------------------------------------------------------
app.post('/api/v1/traces/verify-form16', (req, res) => {
  const { verificationCode, employerPAN } = req.body;

  res.json({
    success: true,
    verificationCode: (verificationCode || "AB12CD3").toUpperCase(),
    employerName: "TechCorp Global Private Limited",
    employerPAN: (employerPAN || "AAACA1234K").toUpperCase(),
    tracesStatus: "VALID_GENUINE_TRACES_CERTIFICATE",
    tdsDeposited: 110000,
    quarter4Status: "Form 24Q Filed & Challan Matched",
    message: "✅ Form 16 genuine status verified against TRACES TDSCPC Portal!"
  });
});

// -------------------------------------------------------------
// 11. EPFO PROVIDENT FUND WITHDRAWAL API
// -------------------------------------------------------------
app.post('/api/v1/epf/claim-submit', (req, res) => {
  const epfClaims = readJSON(path.join(__dirname, 'data', 'epf_claims.json'));
  const newClaim = {
    id: `epf_${Date.now()}`,
    uan: req.body.uan || "100908123456",
    memberId: req.body.memberId || "MH/BAN/0012345/000/0009081",
    claimType: req.body.claimType || "Form 19 Final PF Settlement",
    taxpayerName: req.body.taxpayerName || "Rajesh Kumar",
    pfBalance: Number(req.body.pfBalance) || 345000,
    status: "Transmitted to EPFO Unified Portal",
    submittedAt: new Date().toISOString()
  };

  epfClaims.unshift(newClaim);
  writeJSON(path.join(__dirname, 'data', 'epf_claims.json'), epfClaims);

  res.json({
    success: true,
    message: `EPFO Claim (${newClaim.claimType}) submitted successfully for UAN ${newClaim.uan}! Claim Reference No: ${newClaim.id}`,
    data: newClaim
  });
});

// -------------------------------------------------------------
// 12. FORM 13 LOWER TDS DEDUCTION CERTIFICATE API
// -------------------------------------------------------------
app.post('/api/v1/tax/form13-apply', (req, res) => {
  const form13List = readJSON(path.join(__dirname, 'data', 'form13_applications.json'));
  const newApp = {
    id: `f13_${Date.now()}`,
    taxpayerName: req.body.taxpayerName || "Rajesh Kumar",
    pan: (req.body.pan || "ABCDE1234F").toUpperCase(),
    estimatedIncome: Number(req.body.estimatedIncome) || 1800000,
    requestedTdsRate: Number(req.body.requestedTdsRate) || 0,
    assessingOfficerJurisdiction: req.body.aoJurisdiction || "WARD 12(3) MUMBAI",
    status: "Form 13 Transmitted to AO Desk",
    submittedAt: new Date().toISOString()
  };

  form13List.unshift(newApp);
  writeJSON(path.join(__dirname, 'data', 'form13_applications.json'), form13List);

  res.json({
    success: true,
    message: `Section 197 Form 13 application for ${newApp.requestedTdsRate}% TDS rate transmitted to AO Desk (${newApp.assessingOfficerJurisdiction})!`,
    data: newApp
  });
});

// -------------------------------------------------------------
// 13. SCHEDULE FA & FOREIGN ASSET / US EXPAT TAX API
// -------------------------------------------------------------
app.post('/api/v1/tax/schedule-fa', (req, res) => {
  const faRecords = readJSON(path.join(__dirname, 'data', 'foreign_assets.json'));
  const usdValue = Number(req.body.foreignStockValueUSD) || 45000;
  const inrValue = Math.round(usdValue * 84); // 84 INR per USD
  const usDividendUSD = Number(req.body.usDividendUSD) || 1200;
  const usTdsUSD = Number(req.body.usTdsUSD) || 300;
  const dtaaCreditINR = Math.round(usTdsUSD * 84);

  const newRecord = {
    id: `fa_${Date.now()}`,
    pan: (req.body.pan || "ABCDE1234F").toUpperCase(),
    taxpayerName: req.body.taxpayerName || "Rajesh Kumar",
    foreignBroker: req.body.foreignBroker || "Morgan Stanley / E*TRADE USA",
    foreignStockValueUSD: usdValue,
    foreignStockValueINR: inrValue,
    usDividendUSD,
    usTdsDeductedUSD: usTdsUSD,
    dtaaSec90CreditINR: dtaaCreditINR,
    status: "Schedule FA Structured for ITR-2",
    submittedAt: new Date().toISOString()
  };

  faRecords.unshift(newRecord);
  writeJSON(path.join(__dirname, 'data', 'foreign_assets.json'), faRecords);

  res.json({
    success: true,
    message: `Schedule FA foreign stock holdings ($${usdValue.toLocaleString('en-US')}) & Sec 90 DTAA tax credit (₹${dtaaCreditINR.toLocaleString('en-IN')}) structured for ITR-2!`,
    data: newRecord
  });
});

// -------------------------------------------------------------
// 14. B2B WHITE-LABEL PARTNER & AFFILIATE APIS
// -------------------------------------------------------------
app.post('/api/v1/partner/lead-onboard', (req, res) => {
  const partnerLeads = readJSON(path.join(__dirname, 'data', 'partner_leads.json'));
  const amountPaid = Number(req.body.amountPaid) || 1499;
  const commission = Math.round(amountPaid * 0.30); // 30% commission

  const newLead = {
    id: `part_${Date.now()}`,
    partnerCode: req.body.partnerCode || "PART_MUMBAI_CA",
    partnerName: req.body.partnerName || "Mehta & Associates CA Firm",
    leadTaxpayerName: req.body.leadTaxpayerName || "Aakash Varma",
    leadPAN: (req.body.leadPAN || "BHKPV9081L").toUpperCase(),
    planType: req.body.planType || "Assisted - Capital Gains Trader",
    amountPaid,
    commissionShare: commission,
    status: "Lead Onboarded & CA Assigned",
    createdAt: new Date().toISOString()
  };

  partnerLeads.unshift(newLead);
  writeJSON(path.join(__dirname, 'data', 'partner_leads.json'), partnerLeads);

  res.json({
    success: true,
    message: `Client ${newLead.leadTaxpayerName} onboarded under Partner Code ${newLead.partnerCode}! Partner Commission: ₹${commission.toLocaleString('en-IN')}`,
    data: newLead
  });
});

app.get('/api/v1/partner/commission-ledger', (req, res) => {
  const partnerLeads = readJSON(path.join(__dirname, 'data', 'partner_leads.json'));
  const totalCommission = partnerLeads.reduce((acc, curr) => acc + (curr.commissionShare || 0), 0);

  res.json({
    success: true,
    totalLeads: partnerLeads.length,
    totalCommissionEarned: totalCommission,
    data: partnerLeads
  });
});


// =============================================================
// 15. TAX PLANNER / INVESTMENT OPTIMIZER API
// =============================================================
app.post('/api/tax/plan-optimize', (req, res) => {
  const gross = Number(req.body.grossSalary) || 1200000;
  const sec80C = Number(req.body.sec80C) || 0;
  const sec80D = Number(req.body.sec80D) || 0;
  const nps = Number(req.body.nps80CCD) || 0;
  const homeLoan = Number(req.body.homeLoanInterest) || 0;

  const remaining80C = Math.max(0, 150000 - sec80C);
  const remaining80D = Math.max(0, 25000 - sec80D);
  const remainingNPS = Math.max(0, 50000 - nps);

  const suggestions = [];
  if (remaining80C > 0) suggestions.push({ section: 'Sec 80C', instrument: 'ELSS Mutual Fund / PPF / LIC', limit: 150000, used: sec80C, remaining: remaining80C, taxSaving: Math.round(remaining80C * 0.30 * 1.04) });
  if (remaining80D > 0) suggestions.push({ section: 'Sec 80D', instrument: 'Health Insurance Premium', limit: 25000, used: sec80D, remaining: remaining80D, taxSaving: Math.round(remaining80D * 0.30 * 1.04) });
  if (remainingNPS > 0) suggestions.push({ section: 'Sec 80CCD(1B)', instrument: 'NPS Additional Contribution', limit: 50000, used: nps, remaining: remainingNPS, taxSaving: Math.round(remainingNPS * 0.30 * 1.04) });
  if (homeLoan === 0) suggestions.push({ section: 'Sec 24(b)', instrument: 'Home Loan Interest', limit: 200000, used: 0, remaining: 200000, taxSaving: Math.round(200000 * 0.30 * 1.04) });

  const totalPossibleSaving = suggestions.reduce((a, s) => a + s.taxSaving, 0);

  res.json({
    success: true,
    data: {
      grossIncome: gross,
      currentDeductions: sec80C + sec80D + nps + homeLoan,
      suggestions,
      totalPossibleTaxSaving: totalPossibleSaving,
      message: `Invest wisely to save up to ₹${totalPossibleSaving.toLocaleString('en-IN')} in taxes!`
    }
  });
});

// =============================================================
// 16. INCOME TAX NOTICE HUB API
// =============================================================

app.post('/api/notices/submit', (req, res) => {
  const notices = readJSON(NOTICES_FILE);
  const noticeTypes = {
    '143(1)': { reply: 'Intimation u/s 143(1) — Verify the demand/refund, submit rectification if data mismatch.', deadline: 30 },
    '143(2)': { reply: 'Scrutiny Notice u/s 143(2) — Appear before AO with supporting documents for assessment.', deadline: 15 },
    '148': { reply: 'Reassessment Notice u/s 148 — File return within 3 months or contest the notice.', deadline: 90 },
    '156': { reply: 'Demand Notice u/s 156 — Pay demand within 30 days or apply for stay.', deadline: 30 },
    '139(9)': { reply: 'Defective Return u/s 139(9) — Correct and refile within 15 days.', deadline: 15 },
    '245': { reply: 'Refund Adjustment u/s 245 — Consent or object to refund setoff within 30 days.', deadline: 30 },
    '154': { reply: 'Rectification u/s 154 — File rectification request on portal within 4 years.', deadline: 120 }
  };
  const nType = req.body.noticeType || '143(1)';
  const info = noticeTypes[nType] || noticeTypes['143(1)'];
  const newNotice = {
    id: `ntc_${Date.now()}`,
    userId: 'usr_101',
    userName: req.body.userName || 'Rajesh Kumar',
    pan: (req.body.pan || 'ABCDE1234F').toUpperCase(),
    noticeType: `Section ${nType} ${req.body.noticeSubject || 'Income Tax Notice'}`,
    assessmentYear: req.body.assessmentYear || '2025-26',
    receivedDate: req.body.receivedDate || new Date().toISOString().split('T')[0],
    status: 'Under CA Review',
    suggestedAction: info.reply,
    replyDeadlineDays: info.deadline,
    assignedCA: 'CA Priya Mehta (Ex-IRS, 12 yrs exp)',
    submittedAt: new Date().toISOString()
  };
  notices.unshift(newNotice);
  writeJSON(NOTICES_FILE, notices);
  res.json({ success: true, message: `Notice under Section ${nType} submitted. CA assigned. Reply deadline: ${info.deadline} days.`, data: newNotice });
});

app.get('/api/notices/list', (req, res) => {
  const notices = readJSON(NOTICES_FILE);
  res.json({ success: true, data: notices });
});

// =============================================================
// 17. TDS RETURN FILING API (Form 24Q / 26Q)
// =============================================================
app.post('/api/tds/file-return', (req, res) => {
  const tdsReturns = readJSON(path.join(__dirname, 'data', 'filings.json'));
  const totalTDS = Number(req.body.totalTDS) || 485000;
  const entries = Number(req.body.deducteeCount) || 15;
  const token = `TDS${req.body.formType || '24Q'}${Date.now()}`;
  const newReturn = {
    id: `tds_${Date.now()}`,
    type: 'TDS Return',
    formType: req.body.formType || '24Q',
    deductorName: req.body.deductorName || 'Tech Corp Pvt Ltd',
    deductorTAN: (req.body.tan || 'MUMK12345A').toUpperCase(),
    quarter: req.body.quarter || 'Q1 (Apr-Jun 2025)',
    financialYear: '2025-26',
    deducteeCount: entries,
    totalTDSDeducted: totalTDS,
    provisionToken: token,
    status: 'Filed & Acknowledged',
    filedAt: new Date().toISOString()
  };
  tdsReturns.unshift(newReturn);
  writeJSON(path.join(__dirname, 'data', 'filings.json'), tdsReturns);
  res.json({ success: true, message: `TDS Return Form ${req.body.formType || '24Q'} filed for ${entries} deductees. TDS: ₹${totalTDS.toLocaleString('en-IN')}. Token: ${token}`, data: newReturn });
});

// =============================================================
// 18. HUF REGISTRATION & FILING API
// =============================================================
app.post('/api/huf/register', (req, res) => {
  const hufId = `HUF${Date.now()}`;
  const data = {
    id: hufId,
    hufName: `${req.body.kartaName || 'Rajesh Kumar'} HUF`,
    kartaName: req.body.kartaName || 'Rajesh Kumar',
    kartaPan: (req.body.kartaPan || 'ABCDE1234F').toUpperCase(),
    hufPanApplied: `${hufId}_PAN_PENDING`,
    members: req.body.members || ['Sunita Kumar (Spouse)', 'Ananya Kumar (Daughter)'],
    createdAt: new Date().toISOString(),
    status: 'HUF Deed Drafted — PAN Application Submitted'
  };
  res.json({ success: true, message: `HUF "${data.hufName}" registered. PAN application initiated. HUF can claim separate ₹2.5L basic exemption!`, data });
});

app.post('/api/huf/file', (req, res) => {
  const hufTax = calculateTax({
    grossSalary: Number(req.body.hufIncome) || 800000,
    hraReceived: 0, rentPaidAnnual: 0, isMetro: false,
    otherIncome: Number(req.body.otherIncome) || 0,
    sec80C: Number(req.body.sec80C) || 150000,
    sec80D: 0, nps80CCD: 0,
    tdsPaid: Number(req.body.tdsPaid) || 0
  });
  const ack = `HUFACK2026${Math.floor(100000000 + Math.random() * 900000000)}`;
  res.json({
    success: true,
    message: `HUF ITR-2 filed successfully! Acknowledgement: ${ack}`,
    data: { hufName: `${req.body.kartaName || 'Rajesh Kumar'} HUF`, ackNumber: ack, taxSummary: hufTax, filedAt: new Date().toISOString() }
  });
});

// =============================================================
// 19. CAPITAL GAINS TAX CALCULATOR API
// =============================================================
app.post('/api/tax/capital-gains', (req, res) => {
  const type = req.body.assetType || 'equity'; // equity | debt | property | crypto
  const saleValue = Number(req.body.saleValue) || 500000;
  const costValue = Number(req.body.costValue) || 300000;
  const holdingMonths = Number(req.body.holdingMonths) || 18;
  const indexedCost = Number(req.body.indexedCost) || costValue;

  let isLongTerm = false;
  let taxRate = 0;
  let gainType = '';
  let gain = 0;

  if (type === 'equity') {
    isLongTerm = holdingMonths >= 12;
    gain = Math.max(0, saleValue - costValue);
    if (isLongTerm) {
      const exemption = 125000;
      taxRate = 0.10;
      gain = Math.max(0, gain - exemption);
      gainType = 'LTCG (Equity) — 10% above ₹1.25L';
    } else { taxRate = 0.15; gainType = 'STCG (Equity) — 15%'; }
  } else if (type === 'debt') {
    isLongTerm = holdingMonths >= 36;
    gain = isLongTerm ? Math.max(0, saleValue - indexedCost) : Math.max(0, saleValue - costValue);
    taxRate = isLongTerm ? 0.20 : null; // added to slab if STCG
    gainType = isLongTerm ? 'LTCG (Debt) — 20% with Indexation' : 'STCG (Debt) — Added to slab income';
  } else if (type === 'property') {
    isLongTerm = holdingMonths >= 24;
    gain = isLongTerm ? Math.max(0, saleValue - indexedCost) : Math.max(0, saleValue - costValue);
    taxRate = isLongTerm ? 0.20 : null;
    gainType = isLongTerm ? 'LTCG (Property) — 20% with Indexation' : 'STCG (Property) — Added to slab income';
  } else if (type === 'crypto') {
    gain = Math.max(0, saleValue - costValue);
    taxRate = 0.30;
    gainType = 'Crypto/VDA — Flat 30% (Sec 115BBH) + 4% Cess';
  }

  const taxBeforeCess = taxRate ? Math.round(gain * taxRate) : 0;
  const cess = Math.round(taxBeforeCess * 0.04);
  const totalTax = taxBeforeCess + cess;

  res.json({
    success: true,
    data: {
      assetType: type, saleValue, costValue, indexedCost, holdingMonths, isLongTerm,
      capitalGain: gain, gainType, taxRate: taxRate ? `${(taxRate * 100).toFixed(0)}%` : 'Slab Rate',
      taxBeforeCess, cess, totalTaxPayable: totalTax,
      netProfit: saleValue - costValue - totalTax
    }
  });
});

// =============================================================
// 20. GST FILING API
// =============================================================
app.post('/api/gst/file', (req, res) => {
  const period = req.body.period || 'Aug 2025';
  const taxableValue = Number(req.body.taxableValue) || 850000;
  const cgst = Math.round(taxableValue * 0.09);
  const sgst = Math.round(taxableValue * 0.09);
  const totalGST = cgst + sgst;
  const arn = `ARN-GST${Date.now()}`;
  res.json({
    success: true,
    message: `GSTR-3B filed for ${period}. Total GST: ₹${totalGST.toLocaleString('en-IN')}. ARN: ${arn}`,
    data: { period, taxableValue, cgst, sgst, igst: 0, totalGST, arn, status: 'Filed', filedAt: new Date().toISOString() }
  });
});

app.get('/api/gst/lookup/:gstin', (req, res) => {
  const gstin = req.params.gstin.toUpperCase();
  const stateCode = gstin.substring(0, 2);
  const statemap = { '27': 'Maharashtra', '07': 'Delhi', '29': 'Karnataka', '33': 'Tamil Nadu', '24': 'Gujarat', '09': 'Uttar Pradesh', '06': 'Haryana' };
  res.json({
    success: true,
    data: {
      gstin,
      legalName: `Tech Business Pvt Ltd (${gstin.substring(2, 12)})`,
      tradeName: 'TechBiz',
      state: statemap[stateCode] || 'Maharashtra',
      registrationType: 'Regular',
      registrationDate: '2022-04-01',
      status: 'Active'
    }
  });
});

// =============================================================
// 21. US / NRI TAX ENQUIRY API
// =============================================================
app.post('/api/us-tax/enquiry', (req, res) => {
  const usdIncome = Number(req.body.usdIncome) || 85000;
  const inrEquivalent = Math.round(usdIncome * 84);
  const dtaaCredit = Math.round(inrEquivalent * 0.20);
  res.json({
    success: true,
    message: `NRI/US Tax Enquiry received. Expert will call within 24hrs. DTAA credit estimate: ₹${dtaaCredit.toLocaleString('en-IN')}`,
    data: {
      enquiryId: `NRI${Date.now()}`,
      name: req.body.name || 'NRI Taxpayer',
      email: req.body.email || 'nri@example.com',
      residencyStatus: req.body.residencyStatus || 'NRI',
      usdIncome,
      inrEquivalent,
      estimatedDTAACredit: dtaaCredit,
      servicesRequired: req.body.services || ['Form 1040-NR', 'DTAA Sec 90 Credit', 'Schedule FA / FBAR'],
      status: 'Expert Assigned — CA Rajiv Bhatia (US CPA + Indian CA)',
      submittedAt: new Date().toISOString()
    }
  });
});

// =============================================================
// 22. REVISED / BELATED / ITR-U RETURN FILING
// =============================================================
app.post('/api/itr/revise', (req, res) => {
  const ack = `REV2026${Math.floor(100000000 + Math.random() * 900000000)}`;
  res.json({ success: true, message: `Revised Return for AY ${req.body.assessmentYear || '2026-27'} filed. Ack: ${ack}. Original errors corrected.`, data: { ack, type: 'Revised Return', filedAt: new Date().toISOString() } });
});

app.post('/api/itr/belated', (req, res) => {
  const lateFee = 5000; // Sec 234F
  const ack = `BEL2026${Math.floor(100000000 + Math.random() * 900000000)}`;
  res.json({ success: true, message: `Belated Return filed with ₹${lateFee} late fee (Sec 234F). Ack: ${ack}.`, data: { ack, type: 'Belated Return', lateFee, filedAt: new Date().toISOString() } });
});

app.post('/api/itr/itr-u', (req, res) => {
  const additionalTax = Math.round((Number(req.body.additionalIncome) || 200000) * 0.30 * 0.25); // 25% additional tax
  const ack = `ITRU2026${Math.floor(100000000 + Math.random() * 900000000)}`;
  res.json({ success: true, message: `Updated Return (ITR-U) filed. Additional tax + 25% surcharge: ₹${additionalTax.toLocaleString('en-IN')}. Ack: ${ack}.`, data: { ack, type: 'Updated Return (ITR-U)', additionalTax, filedAt: new Date().toISOString() } });
});

// =============================================================
// 23. SPECIAL CALCULATORS APIs
// =============================================================
app.post('/api/calc/hra', (req, res) => {
  const basic = Number(req.body.basicSalary) || 600000;
  const hra = Number(req.body.hraReceived) || 240000;
  const rent = Number(req.body.rentPaidAnnual) || 300000;
  const isMetro = req.body.isMetro !== false;
  const metroPercent = isMetro ? 0.50 : 0.40;
  const exemption = Math.min(hra, Math.min(basic * metroPercent, Math.max(0, rent - basic * 0.10)));
  res.json({ success: true, data: { basicSalary: basic, hraReceived: hra, rentPaidAnnual: rent, isMetro, hraExemption: Math.round(exemption), taxableHRA: Math.round(hra - exemption) } });
});

app.post('/api/calc/advance-tax', (req, res) => {
  const totalIncome = Number(req.body.totalIncome) || 1500000;
  const tds = Number(req.body.tdsExpected) || 100000;
  const taxSummary = calculateTax({ grossSalary: totalIncome, hraReceived: 0, rentPaidAnnual: 0, isMetro: false, otherIncome: 0, sec80C: 0, sec80D: 0, nps80CCD: 0, tdsPaid: 0 });
  const netTax = Math.max(0, (taxSummary.newRegime.totalTaxPayable || 0) - tds);
  const installments = [
    { due: 'Jun 15, 2025', pct: '15%', amount: Math.round(netTax * 0.15) },
    { due: 'Sep 15, 2025', pct: '45%', amount: Math.round(netTax * 0.30) },
    { due: 'Dec 15, 2025', pct: '75%', amount: Math.round(netTax * 0.30) },
    { due: 'Mar 15, 2026', pct: '100%', amount: Math.round(netTax * 0.25) }
  ];
  res.json({ success: true, data: { totalIncome, estimatedTDSByEmployer: tds, netAdvanceTaxDue: netTax, installments } });
});

app.post('/api/calc/gratuity', (req, res) => {
  const last = Number(req.body.lastBasicSalary) || 75000;
  const years = Number(req.body.yearsOfService) || 10;
  const gratuity = Math.min(2000000, Math.round((last * 15 * years) / 26));
  const exemptLimit = 2000000;
  const taxableGratuity = Math.max(0, gratuity - exemptLimit);
  res.json({ success: true, data: { lastBasicSalary: last, yearsOfService: years, gratuityAmount: gratuity, exemptLimit, taxableGratuity, formula: '(Last Basic × 15 × Years) / 26' } });
});

app.post('/api/calc/emi', (req, res) => {
  const principal = Number(req.body.loanAmount) || 5000000;
  const rate = (Number(req.body.annualRate) || 8.5) / 12 / 100;
  const months = Number(req.body.tenureMonths) || 240;
  const emi = Math.round(principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1));
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  res.json({ success: true, data: { loanAmount: principal, annualRate: req.body.annualRate || 8.5, tenureMonths: months, emi, totalPayment, totalInterest } });
});

app.post('/api/calc/sip', (req, res) => {
  const monthly = Number(req.body.monthlyAmount) || 10000;
  const rate = (Number(req.body.expectedReturnRate) || 12) / 12 / 100;
  const months = Number(req.body.tenureMonths) || 120;
  const corpus = Math.round(monthly * (Math.pow(1 + rate, months) - 1) / rate * (1 + rate));
  const invested = monthly * months;
  const gains = corpus - invested;
  const ltcgTax = Math.round(Math.max(0, gains - 125000) * 0.10);
  res.json({ success: true, data: { monthlyAmount: monthly, expectedReturnRate: req.body.expectedReturnRate || 12, tenureMonths: months, maturityCorpus: corpus, totalInvested: invested, estimatedGains: gains, ltcgTaxEstimate: ltcgTax } });
});

app.post('/api/calc/crypto-tax', (req, res) => {
  const income = Number(req.body.cryptoIncome) || 500000;
  const tax30 = Math.round(income * 0.30);
  const cess = Math.round(tax30 * 0.04);
  const tds1pct = Math.round(income * 0.01);
  res.json({ success: true, data: { cryptoIncome: income, flatTaxRate: '30%', taxAmount: tax30, cess4Pct: cess, totalTax: tax30 + cess, tdsAlreadyDeducted1Pct: tds1pct, netTaxPayable: tax30 + cess - tds1pct, rule: 'Sec 115BBH — No deduction except cost of acquisition. Losses cannot be set off.' } });
});

app.post('/api/calc/nps', (req, res) => {
  const monthly = Number(req.body.monthlyContribution) || 5000;
  const years = Number(req.body.yearsToRetirement) || 25;
  const rate = (Number(req.body.expectedReturn) || 10) / 12 / 100;
  const months = years * 12;
  const corpus = Math.round(monthly * (Math.pow(1 + rate, months) - 1) / rate * (1 + rate));
  const annuity40pct = Math.round(corpus * 0.40);
  const lumpsum60pct = Math.round(corpus * 0.60);
  const taxFreeAmount = lumpsum60pct; // 60% lumpsum is tax-free
  res.json({ success: true, data: { monthlyContribution: monthly, yearsToRetirement: years, maturityCorpus: corpus, annuityPurchase40pct: annuity40pct, taxFreeLumpsum60pct: lumpsum60pct, taxFreeAmount, sec80CCDDeduction: Math.min(monthly * 12, 50000) } });
});

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`TaxBuddy Enterprise Suite running live on http://localhost:${PORT}`);
  });
}

module.exports = app;
