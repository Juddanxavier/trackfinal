interface InvoiceData {
  trackingNumber: string;
  whiteLabelTrackingCode?: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  originCountry?: string;
  destinationCountry?: string;
  status: string;
  billAmount?: string;
  createdAt: Date;
  deliveredAt?: Date;
  orgName: string;
  orgAddress: string;
  orgEmail: string;
  orgPhone: string;
  branchName: string;
}

export function buildInvoiceHtml(data: InvoiceData): string {
  const amount = data.billAmount ? parseFloat(data.billAmount) : 0;
  const gstRate = 0.18;
  const base =
    amount > 0 ? Math.round((amount / (1 + gstRate)) * 100) / 100 : 0;
  const gst = amount > 0 ? Math.round((amount - base) * 100) / 100 : 0;

  const invNo =
    data.whiteLabelTrackingCode ||
    `INV-${data.trackingNumber.slice(0, 8).toUpperCase()}`;
  const statusStr = data.status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const issued = new Date(data.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const origin = data.originCountry || 'Origin';
  const dest = data.destinationCountry || 'Destination';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    color: #0f172a;
    background: #ffffff;
    width: 210mm;
    height: 297mm;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 32px 36px 0;
  }

  .org-name {
    font-weight: 800;
    font-size: 24px;
    color: #0f172a;
    line-height: 1.1;
  }

  .org-address {
    font-size: 8px;
    font-weight: 500;
    color: #64748b;
    margin-top: 6px;
    line-height: 1.4;
    max-width: 240px;
  }

  .doc-side {
    text-align: right;
  }

  .doc-side .label {
    font-size: 9px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .doc-side .inv-no {
    font-size: 10px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 2px;
  }

  .accent-line {
    margin: 16px 36px 0;
    height: 3px;
    background: #0f172a;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 36px 0;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: #0f172a;
    color: #ffffff;
  }

  .status-badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ffffff;
    opacity: 0.4;
  }

  .meta-items {
    display: flex;
    gap: 32px;
  }

  .meta-item {
    text-align: right;
  }

  .meta-item .label {
    font-size: 7px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
  }

  .meta-item .value {
    font-size: 10px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 2px;
  }

  .route-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 36px 0;
  }

  .route-box {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    font-size: 11px;
    font-weight: 700;
    color: #0f172a;
  }

  .route-box small {
    display: block;
    font-size: 7px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .route-arrow {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    flex-shrink: 0;
  }

  .addresses {
    display: flex;
    gap: 24px;
    padding: 20px 36px 0;
  }

  .addr-col {
    flex: 1;
  }

  .addr-col .label {
    font-size: 7px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .addr-col .name {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 3px;
  }

  .addr-col .detail {
    font-size: 8px;
    font-weight: 500;
    color: #475569;
    line-height: 1.5;
  }

  .ref-row {
    display: flex;
    gap: 32px;
    padding: 18px 36px 0;
  }

  .ref-item .label {
    font-size: 7px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 2px;
  }

  .ref-item .value {
    font-size: 9px;
    font-weight: 700;
    color: #0f172a;
  }

  .table-wrap {
    padding: 20px 36px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    font-size: 7px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    padding: 0 0 10px;
    border-bottom: 1.5px solid #e2e8f0;
    text-align: left;
  }

  thead th:nth-child(2),
  thead th:nth-child(3),
  thead th:nth-child(4) {
    text-align: right;
  }

  tbody td {
    font-size: 10px;
    font-weight: 600;
    color: #0f172a;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  tbody td:nth-child(2),
  tbody td:nth-child(3),
  tbody td:nth-child(4) {
    text-align: right;
  }

  .paid-banner {
    margin: 18px 36px 0;
    padding: 14px 22px;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .paid-banner .paid-label {
    font-size: 11px;
    font-weight: 700;
    color: #166534;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .paid-banner .paid-amount {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
  }

  .footer {
    position: absolute;
    bottom: 26px;
    left: 36px;
    right: 36px;
    display: flex;
    justify-content: space-between;
    font-size: 7px;
    font-weight: 500;
    color: #94a3b8;
  }

  .footer-line {
    position: absolute;
    bottom: 46px;
    left: 36px;
    right: 36px;
    height: 1px;
    background: #e2e8f0;
  }
</style>
</head>
<body>

  <div class="top-bar">
    <div>
      <div class="org-name">${data.orgName}</div>
      ${data.orgAddress ? `<div class="org-address">${data.orgAddress}</div>` : ''}
    </div>
    <div class="doc-side">
      <div class="label">Invoice</div>
      <div class="inv-no">${invNo}</div>
    </div>
  </div>

  <div class="accent-line"></div>

  <div class="meta-row">
    <div class="status-badge">${statusStr}</div>
    <div class="meta-items">
      <div class="meta-item">
        <div class="label">Issued</div>
        <div class="value">${issued}</div>
      </div>
    </div>
  </div>

  <div class="route-row">
    <div class="route-box"><small>Origin</small>${origin}</div>
    <div class="route-arrow">→</div>
    <div class="route-box"><small>Destination</small>${dest}</div>
  </div>

  <div class="addresses">
    <div class="addr-col">
      <div class="label">Bill To</div>
      <div class="name">${data.recipientName}</div>
      ${data.recipientAddress ? `<div class="detail">${data.recipientAddress}</div>` : ''}
      ${data.recipientEmail ? `<div class="detail">${data.recipientEmail}</div>` : ''}
      ${data.recipientPhone ? `<div class="detail">${data.recipientPhone}</div>` : ''}
    </div>
    <div class="addr-col">
      <div class="label">From</div>
      <div class="name">${data.orgName}</div>
      ${data.orgAddress ? `<div class="detail">${data.orgAddress}</div>` : ''}
      ${data.orgEmail ? `<div class="detail">${data.orgEmail}</div>` : ''}
      ${data.orgPhone ? `<div class="detail">${data.orgPhone}</div>` : ''}
      ${data.branchName ? `<div class="detail">Branch: ${data.branchName}</div>` : ''}
    </div>
  </div>

  <div class="ref-row">
    <div class="ref-item">
      <div class="label">Tracking Number</div>
      <div class="value">${data.whiteLabelTrackingCode || data.trackingNumber}</div>
    </div>
    <div class="ref-item">
      <div class="label">Service</div>
      <div class="value">International Shipping</div>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Shipping Service</td>
          <td>1</td>
          <td>${base.toFixed(2)}</td>
          <td>${base.toFixed(2)}</td>
        </tr>
        <tr>
          <td>GST (18%)</td>
          <td>—</td>
          <td>${gst.toFixed(2)}</td>
          <td>${gst.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="margin: 18px 36px 0; display: flex; justify-content: flex-end;">
    <div style="width: 240px;">
      <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; font-weight: 600; color: #64748b;">
        <span>Subtotal</span><span>${base.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; font-weight: 600; color: #64748b;">
        <span>GST (18%)</span><span>${gst.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 12px 0 6px; font-size: 16px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 6px;">
        <span>Total</span><span>${amount.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="paid-banner">
    <span class="paid-label">Paid in Full</span>
    <span class="paid-amount">${amount.toFixed(2)}</span>
  </div>

  <div class="footer-line"></div>
  <div class="footer">
    <span>${data.orgName}${data.branchName ? ' · ' + data.branchName : ''}</span>
    <span>${[data.orgEmail, data.orgPhone].filter(Boolean).join(' · ')}</span>
  </div>

</body>
</html>`;
}
