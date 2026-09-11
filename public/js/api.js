// TaxBuddy Enterprise API Client
const API_BASE = '/api';

const TaxAPI = {
  // Calculate Old vs New Regime Tax
  calculateTax: async (taxData) => {
    const res = await fetch(`${API_BASE}/tax/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taxData)
    });
    return res.json();
  },

  // ITD AIS / TIS & 26AS Sync
  syncAIS: async (pan, name) => {
    const res = await fetch(`${API_BASE}/itd/sync-ais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pan, name })
    });
    return res.json();
  },

  // FlexiBuddy Corporate Salary Saver
  calculateFlexi: async (flexiData) => {
    const res = await fetch(`${API_BASE}/flexibuddy/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flexiData)
    });
    return res.json();
  },

  saveFlexi: async (flexiData) => {
    const res = await fetch(`${API_BASE}/flexibuddy/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flexiData)
    });
    return res.json();
  },

  // Portfolio Doctor CAS Analyzer
  analyzePortfolio: async (formData) => {
    const res = await fetch(`${API_BASE}/portfolio/analyze`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // MyBizCFO GST & Company Reg
  fileGST: async (gstData) => {
    const res = await fetch(`${API_BASE}/business/gst-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gstData)
    });
    return res.json();
  },

  registerCompany: async (companyData) => {
    const res = await fetch(`${API_BASE}/business/company-reg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    return res.json();
  },

  // Legal Form 26QB & CIT(A) Appeals
  submitForm26QB: async (form26Data) => {
    const res = await fetch(`${API_BASE}/legal/form26qb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form26Data)
    });
    return res.json();
  },

  fileAppeal: async (appealData) => {
    const res = await fetch(`${API_BASE}/legal/appeal-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appealData)
    });
    return res.json();
  },

  // Razorpay Payments
  createPaymentOrder: async (amount, planType, taxpayerName) => {
    const res = await fetch(`${API_BASE}/v1/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, planType, taxpayerName })
    });
    return res.json();
  },

  verifyPaymentSignature: async (paymentData) => {
    const res = await fetch(`${API_BASE}/v1/payment/verify-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return res.json();
  },

  // WhatsApp OTP Auth
  sendWhatsAppOTP: async (mobile) => {
    const res = await fetch(`${API_BASE}/v1/auth/send-whatsapp-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    return res.json();
  },

  verifyWhatsAppOTP: async (mobile, otp) => {
    const res = await fetch(`${API_BASE}/v1/auth/verify-whatsapp-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });
    return res.json();
  },

  // TRACES Form 16 Verification
  verifyForm16Traces: async (verificationCode, employerPAN) => {
    const res = await fetch(`${API_BASE}/v1/traces/verify-form16`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationCode, employerPAN })
    });
    return res.json();
  },

  // EPFO PF Claims
  submitEpfClaim: async (claimData) => {
    const res = await fetch(`${API_BASE}/v1/epf/claim-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData)
    });
    return res.json();
  },

  // Form 13 Lower Deduction
  applyForm13: async (form13Data) => {
    const res = await fetch(`${API_BASE}/v1/tax/form13-apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form13Data)
    });
    return res.json();
  },

  // Schedule FA Foreign Assets
  submitScheduleFA: async (faData) => {
    const res = await fetch(`${API_BASE}/v1/tax/schedule-fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(faData)
    });
    return res.json();
  },

  // White-Label B2B Partner Portal
  onboardPartnerLead: async (leadData) => {
    const res = await fetch(`${API_BASE}/v1/partner/lead-onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    return res.json();
  },

  getPartnerLedger: async () => {
    const res = await fetch(`${API_BASE}/v1/partner/commission-ledger`);
    return res.json();
  },

  // Form 16 Auto Parse
  parseForm16: async (formData) => {
    const res = await fetch(`${API_BASE}/tax/parse-form16`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // Get user filings
  getFilings: async () => {
    const res = await fetch(`${API_BASE}/itr/filings`);
    return res.json();
  },

  // Submit Wizard ITR
  submitWizardITR: async (wizardData) => {
    const res = await fetch(`${API_BASE}/itr/wizard-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wizardData)
    });
    return res.json();
  },

  // E-Verify ITR
  everifyITR: async (filingId, otp) => {
    const res = await fetch(`${API_BASE}/itr/everify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filingId, otp })
    });
    return res.json();
  },

  // Get user notices
  getNotices: async () => {
    const res = await fetch(`${API_BASE}/notices`);
    return res.json();
  },

  // Upload notice
  uploadNotice: async (noticeData) => {
    const res = await fetch(`${API_BASE}/notices/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noticeData)
    });
    return res.json();
  },

  // CA Expert Update Filing Status
  updateFilingStatus: async (filingId, newStatus, caNotes) => {
    const res = await fetch(`${API_BASE}/expert/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filingId, newStatus, caNotes })
    });
    return res.json();
  },

  // Query TaxBuddy AI Chatbot
  askAI: async (query) => {
    const res = await fetch(`${API_BASE}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return res.json();
  }
};
