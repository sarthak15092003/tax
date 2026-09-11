// TaxBuddy Dynamic Income Tax Calculator JS
document.addEventListener('DOMContentLoaded', () => {
  const grossSalaryInput = document.getElementById('calc-gross');
  const grossSalarySlider = document.getElementById('slider-gross');
  const hraInput = document.getElementById('calc-hra');
  const otherIncomeInput = document.getElementById('calc-other');
  const sec80CInput = document.getElementById('calc-80c');
  const sec80DInput = document.getElementById('calc-80d');
  const npsInput = document.getElementById('calc-nps');
  const homeLoanInput = document.getElementById('calc-homeloan');

  const bannerEl = document.getElementById('recommendation-banner');
  const oldGrossEl = document.getElementById('res-old-gross');
  const oldDedEl = document.getElementById('res-old-ded');
  const oldTaxableEl = document.getElementById('res-old-taxable');
  const oldTaxEl = document.getElementById('res-old-tax');

  const newGrossEl = document.getElementById('res-new-gross');
  const newDedEl = document.getElementById('res-new-ded');
  const newTaxableEl = document.getElementById('res-new-taxable');
  const newTaxEl = document.getElementById('res-new-tax');

  const savingsNoticeEl = document.getElementById('res-savings-notice');

  // Sync slider with text input
  if (grossSalarySlider && grossSalaryInput) {
    grossSalarySlider.addEventListener('input', (e) => {
      grossSalaryInput.value = e.target.value;
      runCalculation();
    });
    grossSalaryInput.addEventListener('input', (e) => {
      grossSalarySlider.value = e.target.value;
      runCalculation();
    });
  }

  // Attach event listeners to all inputs
  [hraInput, otherIncomeInput, sec80CInput, sec80DInput, npsInput, homeLoanInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  async function runCalculation() {
    const payload = {
      grossSalary: Number(grossSalaryInput ? grossSalaryInput.value : 1200000),
      hraReceived: Number(hraInput ? hraInput.value : 0),
      otherIncome: Number(otherIncomeInput ? otherIncomeInput.value : 0),
      sec80C: Number(sec80CInput ? sec80CInput.value : 0),
      sec80D: Number(sec80DInput ? sec80DInput.value : 0),
      nps80CCD: Number(npsInput ? npsInput.value : 0),
      homeLoanInterest: Number(homeLoanInput ? homeLoanInput.value : 0)
    };

    try {
      const res = await TaxAPI.calculateTax(payload);
      if (res.success) {
        const data = res.data;

        // Render Old Regime
        if (oldGrossEl) oldGrossEl.textContent = `₹${data.totalIncomeGross.toLocaleString('en-IN')}`;
        if (oldDedEl) oldDedEl.textContent = `₹${data.oldRegime.totalDeductions.toLocaleString('en-IN')}`;
        if (oldTaxableEl) oldTaxableEl.textContent = `₹${data.oldRegime.taxableIncome.toLocaleString('en-IN')}`;
        if (oldTaxEl) oldTaxEl.textContent = `₹${data.oldRegime.totalTaxPayable.toLocaleString('en-IN')}`;

        // Render New Regime
        if (newGrossEl) newGrossEl.textContent = `₹${data.totalIncomeGross.toLocaleString('en-IN')}`;
        if (newDedEl) newDedEl.textContent = `₹${data.newRegime.totalDeductions.toLocaleString('en-IN')}`;
        if (newTaxableEl) newTaxableEl.textContent = `₹${data.newRegime.taxableIncome.toLocaleString('en-IN')}`;
        if (newTaxEl) newTaxEl.textContent = `₹${data.newRegime.totalTaxPayable.toLocaleString('en-IN')}`;

        // Recommendation Banner
        if (bannerEl) {
          bannerEl.textContent = data.recommendation.summary;
        }

        if (savingsNoticeEl) {
          savingsNoticeEl.innerHTML = `💡 <strong>Tax Optimization Tip:</strong> By opting for <strong>${data.recommendation.recommendedRegime}</strong>, you keep an extra <strong>₹${data.recommendation.savings.toLocaleString('en-IN')}</strong> in your bank account!`;
        }
      }
    } catch (err) {
      console.error("Calculation failed:", err);
    }
  }

  // Initial run
  runCalculation();
});
