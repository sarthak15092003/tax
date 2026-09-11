// TaxBuddy CA Expert Workspace JS
document.addEventListener('DOMContentLoaded', () => {
  const expertFilingsTable = document.getElementById('expert-filings-body');

  loadExpertFilings();

  async function loadExpertFilings() {
    if (!expertFilingsTable) return;

    try {
      const res = await TaxAPI.getFilings();
      if (res.success && res.data.length > 0) {
        expertFilingsTable.innerHTML = res.data.map(item => `
          <tr>
            <td><strong>${item.id}</strong></td>
            <td>${item.userName}<br><small style="color:var(--text-muted);">${item.pan}</small></td>
            <td>AY ${item.assessmentYear}</td>
            <td>₹${(item.incomeDetails?.grossSalary || 0).toLocaleString('en-IN')}</td>
            <td><span class="status-badge ${getStatusBadgeClass(item.status)}">${item.status}</span></td>
            <td>
              <select class="form-control" style="padding:0.3rem 0.5rem; font-size:0.85rem;" onchange="updateFilingStatus('${item.id}', this.value)">
                <option value="Submitted to CA" ${item.status === 'Submitted to CA' ? 'selected' : ''}>Submitted to CA</option>
                <option value="CA Reviewing" ${item.status === 'CA Reviewing' ? 'selected' : ''}>CA Reviewing</option>
                <option value="Return Formed" ${item.status === 'Return Formed' ? 'selected' : ''}>Return Formed</option>
                <option value="Return Filed" ${item.status === 'Return Filed' ? 'selected' : ''}>Return Filed & E-Verified</option>
                <option value="Notice Issued" ${item.status === 'Notice Issued' ? 'selected' : ''}>Notice Defense Active</option>
              </select>
            </td>
          </tr>
        `).join('');
      } else {
        expertFilingsTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">No taxpayer filings currently assigned.</td></tr>`;
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.updateFilingStatus = async (id, newStatus) => {
    const res = await TaxAPI.updateFilingStatus(id, newStatus, "Verified by CA Expert");
    if (res.success) {
      alert(res.message);
      loadExpertFilings();
    }
  };

  function getStatusBadgeClass(status) {
    if (status.includes('Filed') || status.includes('Approved')) return 'badge-filed';
    if (status.includes('Review') || status.includes('CA')) return 'badge-review';
    if (status.includes('Notice')) return 'badge-notice';
    return 'badge-pending';
  }
});
