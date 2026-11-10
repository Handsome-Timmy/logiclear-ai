import React, { useState } from 'react';
import { 
  FileText, AlertTriangle, ShieldCheck, 
  Upload, Copy, Check, DollarSign, BarChart3, Truck 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('audit');
  const [copied, setCopied] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const [auditData, setAuditData] = useState({
    loadId: 'LC-9482',
    carrier: 'Apex Logistics LLC',
    origin: 'Atlanta, GA',
    destination: 'Dallas, TX',
    baselineTotal: 2150.00,
    invoiceTotal: 2425.00,
    status: 'Pending review',
    items: [
      { id: 1, desc: 'Linehaul', rateBase: 1800.00, invoiceBilled: 1800.00, variance: 0, status: 'Within tolerance' },
      { id: 2, desc: 'Fuel Surcharge', rateBase: 350.00, invoiceBilled: 375.00, variance: 25.00, status: 'Flagged variance' },
      { id: 3, desc: 'Unapproved Detention', rateBase: 0.00, invoiceBilled: 250.00, variance: 250.00, status: 'Flagged variance' }
    ]
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
      setUploadStatus('Invalid file format. Please upload PDF, PNG, or JPG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('File size exceeds the 5MB limit.');
      return;
    }
    setUploadStatus(`Uploaded "${file.name}" successfully. Checked in browser.`);
    setTimeout(() => setUploadStatus(''), 4000);
  };

  const handleApprove = () => {
    setAuditData(prev => ({ ...prev, status: 'Approved' }));
    setActionNotice('Invoice approved for payment.');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleReject = () => {
    setAuditData(prev => ({ ...prev, status: 'Disputed' }));
    setActionNotice('Dispute generated. Audit defense report ready.');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const defenseLetter = `CARRIER BILLING DISPUTE NOTICE
Load ID: ${auditData.loadId}
Carrier: ${auditData.carrier}
Agreed Contract Total: $${auditData.baselineTotal.toFixed(2)}
Billed Invoice Total: $${auditData.invoiceTotal.toFixed(2)}
Net Discrepancy: $${(auditData.invoiceTotal - auditData.baselineTotal).toFixed(2)}

Audit Findings:
1. Fuel Surcharge billed at $375.00 vs contract baseline of $350.00 (+$25.00).
2. Unapproved Detention billed at $250.00: No contract rate authorized.

Action Required: Please remit a revised invoice reflecting the contracted balance of $${auditData.baselineTotal.toFixed(2)}.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(defenseLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '20px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#0284c7', padding: '10px', borderRadius: '10px', display: 'flex' }}>
              <Truck size={26} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: '700' }}>LOGICLEAR AI</span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Automated Freight Audit</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loads Audited</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>1,284</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Active Discrepancies</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#facc15' }}>38</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 18px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Flagged Variance</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f87171' }}>+$275.00</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', display: 'flex', gap: '24px' }}>
          <button 
            onClick={() => setActiveTab('audit')} 
            style={{ padding: '14px 4px', border: 'none', background: 'none', borderBottom: activeTab === 'audit' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'audit' ? '#0284c7' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
          >
            Audit Workspace
          </button>
          <button 
            onClick={() => setActiveTab('export')} 
            style={{ padding: '14px 4px', border: 'none', background: 'none', borderBottom: activeTab === 'export' ? '3px solid #0284c7' : '3px solid transparent', color: activeTab === 'export' ? '#0284c7' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
          >
            Dispute Reports
          </button>
        </div>
      </div>

      {actionNotice && (
        <div style={{ maxWidth: '1200px', margin: '20px auto 0 auto', padding: '12px 20px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '8px', fontWeight: '600', border: '1px solid #bae6fd' }}>
          {actionNotice}
        </div>
      )}

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '24px auto 48px auto', padding: '0 32px' }}>
        {activeTab === 'audit' ? (
          <div>
            {/* Load Header Card */}
            <div style={{ backgroundColor: '#fff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Load</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '2px 0' }}>{auditData.loadId}</h2>
                <div style={{ color: '#475569', fontSize: '0.9rem' }}>{auditData.carrier}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>{auditData.origin} to {auditData.destination}</div>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: auditData.status === 'Approved' ? '#dcfce7' : auditData.status === 'Disputed' ? '#fee2e2' : '#fef3c7', color: auditData.status === 'Approved' ? '#15803d' : auditData.status === 'Disputed' ? '#b91c1c' : '#b45309' }}>
                    {auditData.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Audit Table */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 16px 0' }}>Contract rates vs. billed charges</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 8px' }}>Charge</th>
                      <th style={{ padding: '12px 8px' }}>Contract Baseline</th>
                      <th style={{ padding: '12px 8px' }}>Billed Invoice</th>
                      <th style={{ padding: '12px 8px' }}>Variance</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 8px', fontWeight: '600' }}>{item.desc}</td>
                        <td style={{ padding: '14px 8px' }}>${item.rateBase.toFixed(2)}</td>
                        <td style={{ padding: '14px 8px' }}>${item.invoiceBilled.toFixed(2)}</td>
                        <td style={{ padding: '14px 8px', fontWeight: '600', color: item.variance > 0 ? '#b45309' : '#0f172a' }}>
                          {item.variance > 0 ? `+$${item.variance.toFixed(2)}` : '$0.00'}
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: item.variance > 0 ? '#fef3c7' : '#dcfce7', color: item.variance > 0 ? '#b45309' : '#15803d' }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #cbd5e1', fontWeight: '700' }}>
                      <td style={{ padding: '14px 8px' }}>Total</td>
                      <td style={{ padding: '14px 8px' }}>${auditData.baselineTotal.toFixed(2)}</td>
                      <td style={{ padding: '14px 8px' }}>${auditData.invoiceTotal.toFixed(2)}</td>
                      <td style={{ padding: '14px 8px', color: '#b45309' }}>+${(auditData.invoiceTotal - auditData.baselineTotal).toFixed(2)}</td>
                      <td style={{ padding: '14px 8px', fontSize: '0.8rem', color: '#64748b' }}>2 of 3 flagged</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Decision & Upload Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 8px 0' }}>Decision</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Approve the invoice as billed, or dispute the flagged charges with the carrier.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={handleApprove} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#15803d', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Approve Invoice
                    </button>
                    <button onClick={handleReject} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#b91c1c', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Dispute Charges
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 6px 0' }}>Supporting documents</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>Add rate confirmation or invoice. PDF, PNG, or JPG up to 5MB.</p>
                  <label style={{ display: 'block', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '20px 12px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc' }}>
                    <Upload size={24} color="#64748b" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0284c7' }}>Browse files</div>
                    <input type="file" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} />
                  </label>
                  {uploadStatus && (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: uploadStatus.includes('Invalid') || uploadStatus.includes('exceeds') ? '#ef4444' : '#15803d', fontWeight: '500' }}>
                      {uploadStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dispute Letter View */
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Automated Audit Defense Letter</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Ready to dispatch to {auditData.carrier}</p>
              </div>
              <button 
                onClick={copyToClipboard}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard' : 'Copy Defense Letter'}
              </button>
            </div>
            <pre style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6' }}>
              {defenseLetter}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}