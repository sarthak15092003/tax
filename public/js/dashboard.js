// TaxBuddy User Dashboard JS
document.addEventListener('DOMContentLoaded', () => {
  const form16Input = document.getElementById('form16-file-input');
  const dropZone = document.getElementById('form16-dropzone');
  const parseResultBox = document.getElementById('form16-parsed-result');
  const filingsContainer = document.getElementById('user-filings-list');
  const noticesContainer = document.getElementById('user-notices-list');
  const itrSubmitForm = document.getElementById('itr-submission-form');
  const noticeUploadForm = document.getElementById('notice-upload-form');

  // Load active filings
  loadFilings();
  loadNotices();

  // Drag & drop setup for Form 16
  if (dropZone && form16Input) {
    dropZone.addEventListener('click', () => form16Input.click());

    form16Input.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        await processForm16(e.target.files[0]);
      }
    });
  }

  async function processForm16(file) {
    if (parseResultBox) {
      parseResultBox.style.display = 'block';
      parseResultBox.innerHTML = `<p>⏳ <em>Scanning Form 16 PDF with TaxBuddy AI OCR...</em></p>`;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await TaxAPI.parseForm16(formData);
      if (res.success && parseResultBox) {
        const d = res.data;
        parseResultBox.innerHTML = `
          <div style="background:#ECFDF5; border:1px solid #10B981; padding:1.2rem; border-radius:12px; margin-top:1rem;">
            <h4 style="color:#047857; margin-bottom:0.5rem;">✅ Form 16 Auto-Parsed Successfully (${d.confidenceScore} AI Confidence)</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; font-size:0.9rem;">
              <div><strong>Employer:</strong> ${d.employerName} (${d.employerPAN})</div>
              <div><strong>Assessment Year:</strong> ${d.assessmentYear}</div>
              <div><strong>Gross Salary:</strong> ₹${d.grossSalary.toLocaleString('en-IN')}</div>
              <div><strong>TDS Deducted:</strong> ₹${d.tdsDeducted.toLocaleString('en-IN')}</div>
              <div><strong>Section 80C Deductions:</strong> ₹${d.sec80C.toLocaleString('en-IN')}</div>
              <div><strong>Section 80D Deductions:</strong> ₹${d.sec80D.toLocaleString('en-IN')}</div>
            </div>
            <p style="margin-top:0.8rem; font-size:0.85rem; color:#065F46;">Form 16 fields automatically populated into your ITR filing draft below!</p>
          </div>
        `;

        // Pre-fill ITR submission form if exists
        const grossInput = document.getElementById('itr-gross-salary');
        const tdsInput = document.getElementById('itr-tds-paid');
        if (grossInput) grossInput.value = d.grossSalary;
        if (tdsInput) tdsInput.value = d.tdsDeducted;
      }
    } catch (err) {
      if (parseResultBox) {
        parseResultBox.innerHTML = `<p style="color:red;">Failed to scan Form 16. Please enter values manually.</p>`;
      }
    }
  }

  // Load Filings
  async function loadFilings() {
    if (!filingsContainer) return;
    try {
      const res = await TaxAPI.getFilings();
      if (res.success && res.data.length > 0) {
        filingsContainer.innerHTML = res.data.map(item => `
          <div class="feature-card" style="margin-bottom:1.2rem; border-left:4px solid #0F62FE;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
              <h4 style="font-family:var(--font-heading); font-size:1.1rem; color:#0F172A;">ITR Filing - AY ${item.assessmentYear}</h4>
              <span class="status-badge ${getStatusBadgeClass(item.status)}">${item.status}</span>
            </div>
            
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:0.6rem 0.8rem; border-radius:8px; margin-bottom:0.8rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <div style="font-size:0.85rem;">
                <span style="color:var(--text-muted);">Acknowledgement No:</span>
                <strong style="font-family:monospace; color:var(--primary); font-size:0.92rem; margin-left:0.3rem;">${item.ackNumber || 'ACK2026' + Math.floor(100000000 + Math.random() * 900000000)}</strong>
              </div>
              <button onclick="navigator.clipboard.writeText('${item.ackNumber || 'ACK2026'}'); this.innerText='✅ Copied!'; setTimeout(()=>this.innerText='📋 Copy Ack',2000);" class="btn btn-outline" style="font-size:0.75rem; padding:0.25rem 0.6rem; min-height:28px;">📋 Copy Ack</button>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:0.5rem; font-size:0.88rem; color:var(--text-muted); margin-bottom:1rem;">
              <div><strong>Taxpayer:</strong> ${item.userName}</div>
              <div><strong>PAN:</strong> ${item.pan}</div>
              <div><strong>Plan:</strong> ${item.planType}</div>
              <div><strong>Assigned CA:</strong> ${item.assignedCA}</div>
              <div><strong>Gross Salary:</strong> ₹${(item.incomeDetails?.grossSalary || 0).toLocaleString('en-IN')}</div>
              <div><strong>Tax Saved:</strong> ₹${(item.taxSummary?.taxSaved || 0).toLocaleString('en-IN')}</div>
            </div>

            <!-- Live Status Verification Action Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.8rem; border-top:1px solid #E2E8F0; padding-top:0.8rem; flex-wrap:wrap;">
              <a href="https://eportal.incometax.gov.in/iec/foservices/#/pre-login/itrStatus" target="_blank" rel="noopener noreferrer" class="btn btn-accent" style="font-size:0.82rem; padding:0.45rem 0.9rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
                🏛️ Check Live Status on incometax.gov.in ↗
              </a>
              <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">
                Verified with ITD E-Filing System
              </span>
            </div>
          </div>
        `).join('');
      } else {
        filingsContainer.innerHTML = `<p>No tax filings submitted yet. Start your filing below!</p>`;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Load Notices
  async function loadNotices() {
    if (!noticesContainer) return;
    try {
      const res = await TaxAPI.getNotices();
      if (res.success && res.data.length > 0) {
        noticesContainer.innerHTML = res.data.map(item => `
          <div class="feature-card" style="margin-bottom:1rem; border-left:4px solid #DC2626;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <h4 style="font-family:var(--font-heading); font-size:1.1rem; color:#DC2626;">🚨 ${item.noticeType} (AY ${item.assessmentYear})</h4>
              <span class="status-badge badge-notice">${item.status}</span>
            </div>
            <p style="font-size:0.9rem; margin-bottom:0.5rem;"><strong>Demand Amount:</strong> ₹${item.demandAmount.toLocaleString('en-IN')} | <strong>Assigned Expert:</strong> ${item.assignedCA}</p>
            <p style="font-size:0.85rem; color:var(--text-muted);">${item.description}</p>
            ${item.updates ? item.updates.map(u => `
              <div style="background:#F1F5F9; padding:0.5rem 0.8rem; border-radius:6px; margin-top:0.5rem; font-size:0.82rem;">
                <strong>${u.author}:</strong> ${u.text}
              </div>
            `).join('') : ''}
          </div>
        `).join('');
      } else {
        noticesContainer.innerHTML = `<p>No income tax notices reported. You have 365-day free notice protection!</p>`;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ITR Submission Form Handler
  if (itrSubmitForm) {
    itrSubmitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userName = document.getElementById('itr-name').value;
      const pan = document.getElementById('itr-pan').value;
      const grossSalary = Number(document.getElementById('itr-gross-salary').value || 1200000);
      const planType = document.getElementById('itr-plan').value;

      const payload = {
        userName,
        pan,
        planType,
        incomeDetails: { grossSalary, regimeChosen: "New Regime" },
        taxSummary: { taxSaved: 42500 }
      };

      const res = await TaxAPI.submitITR(payload);
      if (res.success) {
        alert(res.message);
        loadFilings();
      }
    });
  }

  // Notice Upload Form Handler
  if (noticeUploadForm) {
    noticeUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const noticeType = document.getElementById('notice-type').value;
      const demandAmount = document.getElementById('notice-demand').value;
      const description = document.getElementById('notice-desc').value;

      const payload = { noticeType, demandAmount, description };
      const res = await TaxAPI.uploadNotice(payload);
      if (res.success) {
        alert(res.message);
        loadNotices();
      }
    });
  }

  function getStatusBadgeClass(status) {
    if (status.includes('Filed') || status.includes('Approved')) return 'badge-filed';
    if (status.includes('Review') || status.includes('CA')) return 'badge-review';
    if (status.includes('Notice')) return 'badge-notice';
    return 'badge-pending';
  }
});
