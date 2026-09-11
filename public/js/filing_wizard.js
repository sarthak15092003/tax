// TaxBuddy Interactive ITR Filing Wizard JS
document.addEventListener('DOMContentLoaded', () => {
  let currentStep = 1;
  const totalSteps = 6;
  let activeFilingRecord = null;

  const btnNext = document.getElementById('btn-next-step');
  const btnPrev = document.getElementById('btn-prev-step');
  const btnTriggerOTP = document.getElementById('btn-trigger-otp');

  // Modal elements
  const everifyModal = document.getElementById('everify-modal');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalVerify = document.getElementById('btn-modal-verify');
  const otpInput = document.getElementById('otp-input');
  const otpStatusMsg = document.getElementById('otp-status-msg');

  // Input elements
  const grossInput = document.getElementById('w-gross-salary');
  const hraReceivedInput = document.getElementById('w-hra-received');
  const basicSalaryInput = document.getElementById('w-basic-salary');
  const rentMonthlyInput = document.getElementById('w-rent-monthly');
  const cityTypeSelect = document.getElementById('w-city-type');
  const otherIncomeInput = document.getElementById('w-other-income');
  const sec80CInput = document.getElementById('w-sec80c');
  const sec80DInput = document.getElementById('w-sec80d');
  const npsInput = document.getElementById('w-nps');
  const homeLoanInput = document.getElementById('w-homeloan');
  const tdsPaidInput = document.getElementById('w-tds-paid');
  const form16Upload = document.getElementById('w-form16-upload');

  // Attach live calculation listeners
  [grossInput, hraReceivedInput, basicSalaryInput, rentMonthlyInput, cityTypeSelect, otherIncomeInput, sec80CInput, sec80DInput, npsInput, homeLoanInput, tdsPaidInput].forEach(el => {
    if (el) el.addEventListener('input', updateWizardComputation);
    if (el) el.addEventListener('change', updateWizardComputation);
  });

  // Form 16 file upload handler
  if (form16Upload) {
    form16Upload.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        const msgEl = document.getElementById('w-parse-msg');
        if (msgEl) msgEl.innerHTML = `<span style="color:var(--primary);">⏳ <em>Scanning Form 16 with TaxBuddy AI OCR...</em></span>`;
        
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
          const res = await TaxAPI.parseForm16(formData);
          if (res.success) {
            const d = res.data;
            grossInput.value = d.grossSalary;
            hraReceivedInput.value = d.hraReceived;
            sec80CInput.value = d.sec80C;
            sec80DInput.value = d.sec80D;
            tdsPaidInput.value = d.tdsDeducted;
            if (msgEl) msgEl.innerHTML = `<span style="color:#047857;">✅ Form 16 auto-parsed! Salary ₹${d.grossSalary.toLocaleString('en-IN')}, TDS ₹${d.tdsDeducted.toLocaleString('en-IN')} loaded.</span>`;
            updateWizardComputation();
          }
        } catch (err) {
          if (msgEl) msgEl.innerHTML = `<span style="color:red;">Error scanning file. Please enter values manually.</span>`;
        }
      }
    });
  }

  // Stepper navigation
  btnNext.addEventListener('click', () => {
    if (currentStep < totalSteps) {
      setWizardStep(currentStep + 1);
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      setWizardStep(currentStep - 1);
    }
  });

  document.querySelectorAll('.stepper-step').forEach(stepEl => {
    stepEl.addEventListener('click', () => {
      const stepNum = parseInt(stepEl.getAttribute('data-step'));
      setWizardStep(stepNum);
    });
  });

  function setWizardStep(step) {
    currentStep = step;
    
    // Toggle active class on steps
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`wizard-step-${step}`).classList.add('active');

    // Update stepper header indicators
    document.querySelectorAll('.stepper-step').forEach(el => {
      const s = parseInt(el.getAttribute('data-step'));
      el.classList.remove('active', 'completed');
      if (s === step) el.classList.add('active');
      else if (s < step) el.classList.add('completed');
    });

    // Toggle button visibility
    btnPrev.style.visibility = step > 1 ? 'visible' : 'hidden';
    btnNext.style.display = step === totalSteps ? 'none' : 'inline-flex';

    if (step === 6) {
      checkITDGatewayMode();
    }

    updateWizardComputation();
  }

  async function checkITDGatewayMode() {
    const badgeEl = document.getElementById('wizard-itd-mode-badge');
    if (!badgeEl) return;
    try {
      const res = await fetch('/api/v1/itd/config');
      const json = await res.json();
      if (json.success && json.data.mode === 'PRODUCTION') {
        badgeEl.className = 'status-badge badge-filed';
        badgeEl.innerHTML = '🟢 Transmitting via Official Platform ERI Gateway (incometax.gov.in)';
      } else {
        badgeEl.className = 'status-badge badge-pending';
        badgeEl.innerHTML = '⚡ Automated ITD Gateway Verification Active';
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function updateWizardComputation() {
    const rentMonthly = Number(rentMonthlyInput ? rentMonthlyInput.value : 0);
    const rentAnnual = rentMonthly * 12;
    const gross = Number(grossInput ? grossInput.value : 1450000);
    const hraRec = Number(hraReceivedInput ? hraReceivedInput.value : 180000);
    const basic = Number(basicSalaryInput ? basicSalaryInput.value : gross * 0.5);
    const isMetro = cityTypeSelect ? cityTypeSelect.value === 'true' : true;

    // HRA Exemption Math
    let hraExempt = 0;
    if (rentAnnual > 0 && hraRec > 0) {
      const rentMinus10Basic = Math.max(0, rentAnnual - (basic * 0.10));
      const metroCap = basic * (isMetro ? 0.50 : 0.40);
      hraExempt = Math.min(hraRec, rentMinus10Basic, metroCap);
    }

    const hraBox = document.getElementById('w-hra-calculated-box');
    if (hraBox) {
      hraBox.textContent = `₹${hraExempt.toLocaleString('en-IN')} Claimable`;
    }

    const payload = {
      grossSalary: gross,
      hraReceived: hraRec,
      rentPaidAnnual: rentAnnual,
      isMetro: isMetro,
      basicSalary: basic,
      otherIncome: Number(otherIncomeInput ? otherIncomeInput.value : 0),
      sec80C: Number(sec80CInput ? sec80CInput.value : 0),
      sec80D: Number(sec80DInput ? sec80DInput.value : 0),
      nps80CCD: Number(npsInput ? npsInput.value : 0),
      homeLoanInterest: Number(homeLoanInput ? homeLoanInput.value : 0),
      tdsPaid: Number(tdsPaidInput ? tdsPaidInput.value : 0)
    };

    try {
      const res = await TaxAPI.calculateTax(payload);
      if (res.success) {
        const d = res.data;

        // Step 5 elements
        const refAmountEl = document.getElementById('w-refund-amount');
        const refSummaryEl = document.getElementById('w-refund-summary');

        if (refAmountEl && refSummaryEl) {
          if (d.recommendation.isRefund) {
            refAmountEl.style.color = '#047857';
            refAmountEl.textContent = `🎉 ₹${d.recommendation.optimalRefundOrPayable.toLocaleString('en-IN')} TAX REFUND`;
            refSummaryEl.textContent = `Direct Bank Refund credited to your account under ${d.recommendation.recommendedRegime}!`;
          } else if (d.recommendation.optimalRefundOrPayable < 0) {
            refAmountEl.style.color = '#D97706';
            refAmountEl.textContent = `⚠️ ₹${Math.abs(d.recommendation.optimalRefundOrPayable).toLocaleString('en-IN')} TAX PAYABLE`;
            refSummaryEl.textContent = `Balance tax payable under ${d.recommendation.recommendedRegime}.`;
          } else {
            refAmountEl.style.color = '#0284C7';
            refAmountEl.textContent = `✅ ZERO TAX BALANCE`;
            refSummaryEl.textContent = `100% Tax Settled under ${d.recommendation.recommendedRegime}!`;
          }
        }

        // Summary table Old Regime
        const oldG = document.getElementById('w-summary-gross-old');
        const oldD = document.getElementById('w-summary-ded-old');
        const oldTable = document.getElementById('w-summary-taxable-old');
        const oldTax = document.getElementById('w-summary-tax-old');
        const oldTds = document.getElementById('w-summary-tds-old');
        const oldFinal = document.getElementById('w-summary-final-old');

        if (oldG) oldG.textContent = `₹${d.totalIncomeGross.toLocaleString('en-IN')}`;
        if (oldD) oldD.textContent = `₹${d.oldRegime.totalDeductions.toLocaleString('en-IN')}`;
        if (oldTable) oldTable.textContent = `₹${d.oldRegime.taxableIncome.toLocaleString('en-IN')}`;
        if (oldTax) oldTax.textContent = `₹${d.oldRegime.totalTaxPayable.toLocaleString('en-IN')}`;
        if (oldTds) oldTds.textContent = `₹${d.tdsPaid.toLocaleString('en-IN')}`;
        if (oldFinal) {
          const val = d.oldRegime.refundOrPayable;
          oldFinal.textContent = val >= 0 ? `₹${val.toLocaleString('en-IN')} Refund` : `₹${Math.abs(val).toLocaleString('en-IN')} Payable`;
          oldFinal.style.color = val >= 0 ? '#047857' : '#D97706';
        }

        // Summary table New Regime
        const newG = document.getElementById('w-summary-gross-new');
        const newD = document.getElementById('w-summary-ded-new');
        const newTable = document.getElementById('w-summary-taxable-new');
        const newTax = document.getElementById('w-summary-tax-new');
        const newTds = document.getElementById('w-summary-tds-new');
        const newFinal = document.getElementById('w-summary-final-new');

        if (newG) newG.textContent = `₹${d.totalIncomeGross.toLocaleString('en-IN')}`;
        if (newD) newD.textContent = `₹${d.newRegime.totalDeductions.toLocaleString('en-IN')}`;
        if (newTable) newTable.textContent = `₹${d.newRegime.taxableIncome.toLocaleString('en-IN')}`;
        if (newTax) newTax.textContent = `₹${d.newRegime.totalTaxPayable.toLocaleString('en-IN')}`;
        if (newTds) newTds.textContent = `₹${d.tdsPaid.toLocaleString('en-IN')}`;
        if (newFinal) {
          const val = d.newRegime.refundOrPayable;
          newFinal.textContent = val >= 0 ? `₹${val.toLocaleString('en-IN')} Refund` : `₹${Math.abs(val).toLocaleString('en-IN')} Payable`;
          newFinal.style.color = val >= 0 ? '#047857' : '#D97706';
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Submit & E-Verify Trigger
  if (btnTriggerOTP) {
    btnTriggerOTP.addEventListener('click', async () => {
      // Create initial wizard submission
      const wizardData = {
        profile: {
          fullName: document.getElementById('w-name').value,
          pan: document.getElementById('w-pan').value,
          dob: document.getElementById('w-dob').value,
          category: document.getElementById('w-category').value
        },
        bank: {
          bankName: document.getElementById('w-bank-name').value,
          accountNumber: document.getElementById('w-account-no').value,
          ifsc: document.getElementById('w-ifsc').value
        },
        incomeDetails: {
          grossSalary: Number(grossInput.value),
          hraReceived: Number(hraReceivedInput.value),
          otherIncome: Number(otherIncomeInput.value),
          tdsPaid: Number(tdsPaidInput.value)
        },
        deductions: {
          rentPaidMonthly: Number(rentMonthlyInput.value),
          isMetro: cityTypeSelect.value === 'true',
          sec80C: Number(sec80CInput.value),
          sec80D: Number(sec80DInput.value),
          nps80CCD: Number(npsInput.value),
          homeLoanInterest: Number(homeLoanInput.value)
        },
        planType: document.getElementById('w-filing-plan').value,
        eVerified: false
      };

      try {
        const res = await TaxAPI.submitWizardITR(wizardData);
        if (res.success) {
          activeFilingRecord = res.data;
          // Open E-Verification Modal
          everifyModal.classList.add('open');
        }
      } catch (err) {
        alert("Filing submission error. Please try again.");
      }
    });
  }

  if (btnModalCancel) {
    btnModalCancel.addEventListener('click', () => everifyModal.classList.remove('open'));
  }

  if (btnModalVerify) {
    btnModalVerify.addEventListener('click', async () => {
      const otp = otpInput.value.trim();
      if (!otp || otp.length !== 6) {
        otpStatusMsg.innerHTML = `<span style="color:red;">Please enter a valid 6-digit Aadhaar OTP.</span>`;
        return;
      }

      otpStatusMsg.innerHTML = `<span style="color:var(--primary);">⏳ <em>Verifying OTP with Income Tax e-Filing Portal...</em></span>`;

      try {
        const res = await TaxAPI.everifyITR(activeFilingRecord.id, otp);
        if (res.success) {
          otpStatusMsg.innerHTML = `<span style="color:#047857; font-weight:700;">✅ E-Verified! Ack No: ${res.data.ackNumber}</span>`;
          setTimeout(() => {
            everifyModal.classList.remove('open');
            alert(`🎉 Success! Your Income Tax Return (ITR-1) for AY 2026-27 is E-Filed & E-Verified! \n\nAcknowledgement Number: ${res.data.ackNumber}`);
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          otpStatusMsg.innerHTML = `<span style="color:red;">${res.message}</span>`;
        }
      } catch (err) {
        otpStatusMsg.innerHTML = `<span style="color:red;">Verification failed. Please retry.</span>`;
      }
    });
  }

  // Initial calculation run
  updateWizardComputation();
});
