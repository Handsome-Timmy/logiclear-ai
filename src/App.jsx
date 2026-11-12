import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  FileCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'dispute'
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [uploadMessage, setUploadMessage] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [isDisputeGenerated, setIsDisputeGenerated] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [auditDecision, setAuditDecision] = useState('pending'); // 'pending' | 'approved' | 'disputed'
  const fileInputRef = useRef(null);

  // Top-level KPI counters that dynamically increment on new uploads
  const [metrics, setMetrics] = useState({
    loadsAudited: 1284,
    activeDiscrepancies: 38,
    flaggedVariance: 275.0
  });

  // Active load state
  const [loadData, setLoadData] = useState({
    loadId: 'LC-9482',
    carrier: 'Apex Logistics LLC',
    origin: 'Atlanta, GA',
    destination: 'Dallas, TX',
    charges: [
      { id: 1, name: 'Linehaul', contract: 1800.0, billed: 1800.0, status: 'within_tolerance' },
      { id: 2, name: 'Fuel Surcharge', contract: 350.0, billed: 375.0, status: 'flagged' },
      { id: 3, name: 'Unapproved Detention', contract: 0.0, billed: 250.0, status: 'flagged' },
    ]
  });

  const contractTotal = loadData.charges.reduce((acc, curr) => acc + curr.contract, 0);
  const billedTotal = loadData.charges.reduce((acc, curr) => acc + curr.billed, 0);
  const varianceTotal = billedTotal - contractTotal;
  const flaggedCount = loadData.charges.filter(c => c.status === 'flagged').length;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      setUploadMessage(`TC-01 Failed: Unauthorized file format (${file.type || 'unknown'}). Only PDF, PNG, and JPG are accepted.`);
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadStatus('error');
      setUploadMessage(`TC-02 Failed: Payload ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds the 5MB safety limit.`);
      return;
    }

    setCurrentFile(file);
    setUploadStatus('uploading');
    setUploadMessage(`Extracting & auditing ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);

    setTimeout(() => {
      // Generate a realistic new audit scenario derived from the uploaded file so the user sees immediate, tangible table & KPI updates
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const randomLoadNum = Math.floor(1000 + Math.random() * 8999);
      const isSecondUpload = loadData.loadId !== 'LC-9482';

      const newCharges = isSecondUpload
        ? [
            { id: 1, name: 'Linehaul Base Rate', contract: 2200.0, billed: 2200.0, status: 'within_tolerance' },
            { id: 2, name: 'Fuel Surcharge (DOE)', contract: 410.0, billed: 445.0, status: 'flagged' },
            { id: 3, name: 'Layover / Lumper Fee', contract: 0.0, billed: 175.0, status: 'flagged' },
          ]
        : [
            { id: 1, name: 'Linehaul Base Rate', contract: 1950.0, billed: 1950.0, status: 'within_tolerance' },
            { id: 2, name: 'Fuel Surcharge (DOE)', contract: 380.0, billed: 415.0, status: 'flagged' },
            { id: 3, name: 'Unauthorized Detention', contract: 0.0, billed: 300.0, status: 'flagged' },
          ];

      const newVariance = newCharges.reduce((acc, c) => acc + (c.billed - c.contract), 0);

      setLoadData({
        loadId: `LC-${randomLoadNum}`,
        carrier: cleanName.length > 2 ? `${cleanName.slice(0, 22)} Freight` : 'SwiftLine Carriers LLC',
        origin: isSecondUpload ? 'Chicago, IL' : 'Savannah, GA',
        destination: isSecondUpload ? 'Denver, CO' : 'Nashville, TN',
        charges: newCharges
      });

      setMetrics((prev) => ({
        loadsAudited: prev.loadsAudited + 1,
        activeDiscrepancies: prev.activeDiscrepancies + 2,
        flaggedVariance: newVariance
      }));

      setUploadStatus('success');
      setUploadMessage(`Audited ${file.name} → Loaded #LC-${randomLoadNum} into workspace (+$${newVariance.toFixed(2)} variance detected).`);
      setAuditDecision('pending');
      setIsDisputeGenerated(false);
    }, 800);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGenerateDispute = () => {
    setIsDisputeGenerated(true);
    setAuditDecision('disputed');
    setActiveTab('dispute');
  };

  const handleApproveInvoice = () => {
    setAuditDecision('approved');
  };

  const handleCopyNotice = () => {
    const noticeText = `DISPUTE DEFENSE NOTICE - CONTRACT RATE VARIANCE
Load Identifier: ${loadData.loadId}
Carrier: ${loadData.carrier}
Routing: ${loadData.origin} to ${loadData.destination}
Agreed Contract Baseline: $${contractTotal.toFixed(2)}
Carrier Invoiced Total: $${billedTotal.toFixed(2)}
Net Discrepancy Flagged: +$${varianceTotal.toFixed(2)}

ITEMIZED VARIANCE DETAILS:
${loadData.charges
  .filter((c) => c.status === 'flagged')
  .map((c) => `- ${c.name}: Agreed $${c.contract.toFixed(2)} vs Billed $${c.billed.toFixed(2)} (+$${(c.billed - c.contract).toFixed(2)} unapproved variance)`)
  .join('\n')}

RESOLUTION ACTION:
Payment approved strictly for the contracted total of $${contractTotal.toFixed(2)}. Invoiced surcharges exceeding 1% baseline variance have been deducted. Please remit corrected billing.`;

    navigator.clipboard.writeText(noticeText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandRow}>
            <div style={styles.logoBox}>
              <ShieldCheck size={24} color="#38bdf8" />
            </div>
            <div>
              <span style={styles.brandSubtitle}>LOGICLEAR AI</span>
              <h1 style={styles.brandTitle}>Automated Freight Audit &amp; Reconciliation</h1>
            </div>
          </div>

          <div style={styles.metricsGroup}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>Loads Audited</span>
              <span style={styles.metricVal}>{metrics.loadsAudited.toLocaleString()}</span>
            </div>
            <div style={styles.metricDivider}></div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>Active Discrepancies</span>
              <span style={{ ...styles.metricVal, color: '#fbbf24' }}>{metrics.activeDiscrepancies}</span>
            </div>
            <div style={styles.metricDivider}></div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>Flagged Variance</span>
              <span style={{ ...styles.metricVal, color: '#f87171' }}>+${metrics.flaggedVariance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabsBar}>
        <div style={styles.tabsInner}>
          <button
            onClick={() => setActiveTab('audit')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'audit' ? styles.tabButtonActive : {})
            }}
          >
            <FileText size={16} style={{ marginRight: 6 }} />
            Audit Workspace
          </button>
          <button
            onClick={() => setActiveTab('dispute')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'dispute' ? styles.tabButtonActive : {})
            }}
          >
            <AlertTriangle size={16} style={{ marginRight: 6 }} />
            Dispute Reports
            {isDisputeGenerated && <span style={styles.badgeDot}></span>}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {activeTab === 'audit' && (
          <div style={styles.columnStack}>
            {/* Load Header Card */}
            <div style={styles.cardHeaderBanner}>
              <div>
                <span style={styles.loadSub}>ACTIVE AUDIT CANDIDATE</span>
                <div style={styles.loadMainRow}>
                  <h2 style={styles.loadTitle}>Load #{loadData.loadId}</h2>
                  <span style={styles.carrierName}>({loadData.carrier})</span>
                </div>
                <div style={styles.routeText}>
                  Route: <strong>{loadData.origin}</strong> → <strong>{loadData.destination}</strong>
                </div>
              </div>

              <div>
                {auditDecision === 'pending' && (
                  <span style={styles.statusPillAmber}>
                    <AlertTriangle size={14} style={{ marginRight: 6 }} />
                    Review Pending ({flaggedCount} Flagged Items)
                  </span>
                )}
                {auditDecision === 'approved' && (
                  <span style={styles.statusPillGreen}>
                    <CheckCircle2 size={14} style={{ marginRight: 6 }} />
                    Invoice Approved for Payment
                  </span>
                )}
                {auditDecision === 'disputed' && (
                  <span style={styles.statusPillRed}>
                    <XCircle size={14} style={{ marginRight: 6 }} />
                    Dispute Generated (+$275 Deducted)
                  </span>
                )}
              </div>
            </div>

            {/* Split Section: Table on left (65%), Action/Upload on right (35%) */}
            <div style={styles.splitGrid}>
              {/* Left: Reconciliation Table */}
              <div style={styles.card}>
                <div style={styles.cardHeaderFlex}>
                  <div>
                    <h3 style={styles.cardTitle}>Contract Rates vs. Billed Charges</h3>
                    <p style={styles.cardSubtitle}>Automated 1% variance threshold test against signed rate confirmation</p>
                  </div>
                  <button 
                    onClick={() => {
                      setAuditDecision('pending');
                      setIsDisputeGenerated(false);
                      setUploadStatus(null);
                    }}
                    style={styles.resetBtn}
                  >
                    <RefreshCw size={13} style={{ marginRight: 4 }} />
                    Reset View
                  </button>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>Charge Description</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Contract Baseline</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Billed Invoice</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Variance</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadData.charges.map((charge) => {
                      const variance = charge.billed - charge.contract;
                      const isFlagged = charge.status === 'flagged';
                      return (
                        <tr key={charge.id} style={styles.tr}>
                          <td style={styles.tdDesc}>{charge.name}</td>
                          <td style={styles.tdMono}>${charge.contract.toFixed(2)}</td>
                          <td style={{ ...styles.tdMono, fontWeight: 'bold' }}>${charge.billed.toFixed(2)}</td>
                          <td style={{ ...styles.tdMono, color: variance > 0 ? '#fbbf24' : '#94a3b8' }}>
                            {variance > 0 ? `+$${variance.toFixed(2)}` : '$0.00'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            {isFlagged ? (
                              <span style={styles.pillSmallAmber}>Flagged Variance</span>
                            ) : (
                              <span style={styles.pillSmallGreen}>Within Tolerance</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={styles.tfootRow}>
                      <td style={styles.tf}>Audited Total</td>
                      <td style={{ ...styles.tf, textAlign: 'right', color: '#94a3b8' }}>${contractTotal.toFixed(2)}</td>
                      <td style={{ ...styles.tf, textAlign: 'right' }}>${billedTotal.toFixed(2)}</td>
                      <td style={{ ...styles.tf, textAlign: 'right', color: '#f87171' }}>+${varianceTotal.toFixed(2)}</td>
                      <td style={{ ...styles.tf, textAlign: 'center', color: '#fbbf24', fontSize: '11px' }}>
                        {flaggedCount} of {loadData.charges.length} flagged
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div style={styles.noteBox}>
                  <AlertTriangle size={16} color="#fbbf24" style={{ marginRight: 8, flexShrink: 0, marginTop: 2 }} />
                  <span>
                    Contract stipulation: Fuel surcharges tied to DOE weekly index. Dock detention requires electronic in/out gate stamp prior to billing. Unapproved accessorials are subject to automatic dispute notice.
                  </span>
                </div>
              </div>

              {/* Right: Upload & Auditor Decision */}
              <div style={styles.sidebarStack}>
                {/* 1. Document Upload */}
                <div style={styles.card}>
                  <div style={styles.cardHeaderFlex}>
                    <h3 style={styles.cardTitle}>Supporting Documents</h3>
                    <span style={styles.ingestTag}>INGESTION</span>
                  </div>
                  <p style={styles.cardSubtitle}>
                    Add carrier rate confirmation, BOL, or raw invoice (PDF, PNG, JPG up to 5MB).
                  </p>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    style={{ display: 'none' }} 
                  />

                  <div 
                    onClick={triggerFileInput}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) processSelectedFile(file);
                    }}
                    style={styles.dropZone}
                  >
                    <div style={styles.dropIconBox}>
                      <UploadCloud size={24} color="#38bdf8" />
                    </div>
                    <div style={styles.dropMainText}>Click to upload or drag &amp; drop</div>
                    <div style={styles.dropSubText}>PDF, PNG, JPG (Max 5MB)</div>
                  </div>

                  {uploadStatus === 'uploading' && (
                    <div style={styles.uploadAlertBlue}>
                      <RefreshCw size={14} className="spin" style={{ marginRight: 6 }} />
                      <span>{uploadMessage}</span>
                    </div>
                  )}

                  {uploadStatus === 'success' && (
                    <div style={styles.uploadAlertGreen}>
                      <FileCheck size={16} color="#4ade80" style={{ marginRight: 8, flexShrink: 0 }} />
                      <div>
                        <strong>{currentFile?.name}</strong>
                        <div>{uploadMessage}</div>
                      </div>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div style={styles.uploadAlertRed}>
                      <XCircle size={16} color="#f87171" style={{ marginRight: 8, flexShrink: 0 }} />
                      <div>{uploadMessage}</div>
                    </div>
                  )}
                </div>

                {/* 2. Auditor Decision */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Auditor Decision</h3>
                  <p style={styles.cardSubtitle}>
                    Approve invoice for accounts payable payment or initiate automated dispute documentation.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={handleApproveInvoice}
                      style={{
                        ...styles.btnDecision,
                        ...(auditDecision === 'approved' ? styles.btnApprovedActive : styles.btnApproveDefault)
                      }}
                    >
                      <CheckCircle2 size={16} style={{ marginRight: 6 }} />
                      Approve Invoice as Invoiced (${billedTotal.toFixed(2)})
                    </button>

                    <button
                      onClick={handleGenerateDispute}
                      style={{
                        ...styles.btnDecision,
                        ...(auditDecision === 'disputed' ? styles.btnDisputedActive : styles.btnDisputeDefault)
                      }}
                    >
                      <AlertTriangle size={16} style={{ marginRight: 6 }} />
                      Dispute Flagged Charges (Generate Notice)
                    </button>
                  </div>

                  {auditDecision === 'disputed' && (
                    <div style={styles.disputeReadyBanner}>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>Notice ready in Reports tab</span>
                      <button 
                        onClick={() => setActiveTab('dispute')}
                        style={styles.btnViewNotice}
                      >
                        View Notice <ArrowRight size={14} style={{ marginLeft: 4 }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Reports Tab */}
        {activeTab === 'dispute' && (
          <div style={styles.disputeContainer}>
            {!isDisputeGenerated ? (
              <div style={styles.emptyStateCard}>
                <div style={styles.emptyIconBox}>
                  <FileText size={32} color="#64748b" />
                </div>
                <h3 style={styles.emptyTitle}>No Active Dispute Notice Generated</h3>
                <p style={styles.emptySubtitle}>
                  Dispute defense documentation is generated dynamically when flagged charges are confirmed in the Audit Workspace.
                </p>
                <button
                  onClick={() => setActiveTab('audit')}
                  style={styles.btnReturnAudit}
                >
                  Return to Audit Workspace <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </button>
              </div>
            ) : (
              <div style={styles.card}>
                <div style={styles.cardHeaderFlex}>
                  <div>
                    <span style={styles.disputePillTop}>DISPUTE NOTICE READY</span>
                    <h2 style={styles.cardTitle}>Carrier Audit Defense Notice - Load #{loadData.loadId}</h2>
                  </div>

                  <button onClick={handleCopyNotice} style={styles.copyBtn}>
                    {copiedNotice ? (
                      <>
                        <Check size={14} color="#4ade80" style={{ marginRight: 6 }} />
                        <span style={{ color: '#4ade80' }}>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} style={{ marginRight: 6 }} />
                        <span>Copy Defense Notice</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={styles.letterBox}>
{`DISPUTE DEFENSE NOTICE - CONTRACT RATE VARIANCE
Date: November 11, 2026
Carrier: ${loadData.carrier}
Load Reference: ${loadData.loadId}
Routing: ${loadData.origin} to ${loadData.destination}

SUMMARY OF AUDIT FINDINGS:
- Agreed Contract Baseline: $${contractTotal.toFixed(2)}
- Invoiced Freight Total:   $${billedTotal.toFixed(2)}
- Disputed Net Variance:    +$${varianceTotal.toFixed(2)}

ITEMIZED RECONCILIATION BREAKDOWN:
1. ${loadData.charges[0].name}:
   - Agreed: $${loadData.charges[0].contract.toFixed(2)} | Invoiced: $${loadData.charges[0].billed.toFixed(2)} | Status: MATCH (Approved)

2. ${loadData.charges[1].name}:
   - Agreed: $${loadData.charges[1].contract.toFixed(2)} | Invoiced: $${loadData.charges[1].billed.toFixed(2)} | Status: +$${(loadData.charges[1].billed - loadData.charges[1].contract).toFixed(2)} UNAPPROVED VARIANCE
   - Finding: Surcharge exceeds contractual DOE fuel matrix index on dispatch date.

3. ${loadData.charges[2].name}:
   - Agreed: $${loadData.charges[2].contract.toFixed(2)} | Invoiced: $${loadData.charges[2].billed.toFixed(2)} | Status: +$${(loadData.charges[2].billed - loadData.charges[2].contract).toFixed(2)} UNAUTHORIZED ACCESSORIAL
   - Finding: No signed or electronic in/out gate log provided by facility to validate detention time.

PAYMENT DETERMINATION:
Approved settlement payment has been scheduled for $${contractTotal.toFixed(2)}.
Disputed variance of $${varianceTotal.toFixed(2)} has been deducted per Section 4 of Carrier Agreement.

Remit all audit inquiries or time-stamped facility logs to freight-audit@logiclear.ai.`}
                </div>

                <div style={styles.letterFooter}>
                  <span>Target recipient: <strong>apex-billing@apexlogistics.com</strong></span>
                  <button 
                    onClick={() => {
                      setIsDisputeGenerated(false);
                      setAuditDecision('pending');
                      setActiveTab('audit');
                    }}
                    style={styles.revokeLink}
                  >
                    Revoke Dispute &amp; Return to Audit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        LogiClear AI • AIML-515 AI Integration Capstone • Indiana Wesleyan University
      </footer>
    </div>
  );
}

// Complete inline design system ensuring 100% styled output independent of Tailwind
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#020617', // Slate 950
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    padding: '0 24px'
  },
  headerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoBox: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandSubtitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: '0.08em',
    display: 'block'
  },
  brandTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  },
  metricsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column'
  },
  metricLabel: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  metricVal: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#f1f5f9'
  },
  metricDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#334155'
  },
  tabsBar: {
    backgroundColor: '#0b1329',
    borderBottom: '1px solid #1e293b',
    padding: '0 24px'
  },
  tabsInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    gap: '32px'
  },
  tabButton: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#94a3b8',
    padding: '14px 4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    position: 'relative'
  },
  tabButtonActive: {
    color: '#38bdf8',
    borderBottom: '2px solid #38bdf8'
  },
  badgeDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#f87171',
    marginLeft: '6px'
  },
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '28px 24px',
    flex: 1,
    width: '100%',
    boxSizing: 'border-box'
  },
  columnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  cardHeaderBanner: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  loadSub: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '0.08em'
  },
  loadMainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '2px'
  },
  loadTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0
  },
  carrierName: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  routeText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  statusPillAmber: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    color: '#fbbf24',
    border: '1px solid rgba(251, 191, 36, 0.25)',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center'
  },
  statusPillGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    color: '#4ade80',
    border: '1px solid rgba(74, 222, 128, 0.25)',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center'
  },
  statusPillRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(248, 113, 113, 0.25)',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center'
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px'
  },
  card: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '22px'
  },
  cardHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '4px 0 0 0'
  },
  resetBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '6px'
  },
  tableHeaderRow: {
    borderBottom: '1px solid #1e293b'
  },
  th: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    padding: '10px 8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left'
  },
  tr: {
    borderBottom: '1px solid rgba(30, 41, 59, 0.6)'
  },
  td: {
    padding: '12px 8px',
    fontSize: '13px',
    color: '#f8fafc'
  },
  tdDesc: {
    padding: '12px 8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#f1f5f9'
  },
  tdMono: {
    padding: '12px 8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    textAlign: 'right',
    color: '#cbd5e1'
  },
  pillSmallAmber: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    color: '#fbbf24',
    border: '1px solid rgba(251, 191, 36, 0.25)',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  },
  pillSmallGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    color: '#4ade80',
    border: '1px solid rgba(74, 222, 128, 0.25)',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  },
  tfootRow: {
    borderTop: '2px solid #334155'
  },
  tf: {
    padding: '14px 8px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff'
  },
  noteBox: {
    marginTop: '16px',
    backgroundColor: '#020617',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '11px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'flex-start',
    lineHeight: '1.5'
  },
  sidebarStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  ingestTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  dropZone: {
    border: '2px dashed #334155',
    borderRadius: '10px',
    padding: '24px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  dropIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  dropMainText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  dropSubText: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px'
  },
  uploadAlertBlue: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#38bdf8',
    display: 'flex',
    alignItems: 'center'
  },
  uploadAlertGreen: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    border: '1px solid rgba(74, 222, 128, 0.25)',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#4ade80',
    display: 'flex',
    alignItems: 'flex-start'
  },
  uploadAlertRed: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.25)',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#f87171',
    display: 'flex',
    alignItems: 'flex-start'
  },
  btnDecision: {
    padding: '11px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    transition: '0.15s ease'
  },
  btnApproveDefault: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    color: '#4ade80',
    border: '1px solid rgba(74, 222, 128, 0.25)'
  },
  btnApprovedActive: {
    backgroundColor: '#16a34a',
    color: '#ffffff'
  },
  btnDisputeDefault: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(248, 113, 113, 0.25)'
  },
  btnDisputedActive: {
    backgroundColor: '#dc2626',
    color: '#ffffff'
  },
  disputeReadyBanner: {
    marginTop: '14px',
    paddingTop: '12px',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  btnViewNotice: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  },
  disputeContainer: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  emptyStateCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '56px 24px',
    textAlign: 'center'
  },
  emptyIconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#1e293b',
    margin: '0 auto 16px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 6px 0'
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    maxWidth: '440px',
    margin: '0 auto 20px auto',
    lineHeight: '1.5'
  },
  btnReturnAudit: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  },
  disputePillTop: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#f87171',
    letterSpacing: '0.08em',
    display: 'block'
  },
  copyBtn: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  },
  letterBox: {
    backgroundColor: '#020617',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '20px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: '1.6',
    whiteSpace: 'pre-line',
    userSelect: 'all',
    marginTop: '12px'
  },
  letterFooter: {
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#94a3b8'
  },
  revokeLink: {
    background: 'none',
    border: 'none',
    color: '#f87171',
    textDecoration: 'underline',
    fontSize: '12px',
    cursor: 'pointer'
  },
  footer: {
    borderTop: '1px solid #1e293b',
    backgroundColor: '#0b1329',
    padding: '14px',
    textAlign: 'center',
    fontSize: '11px',
    color: '#64748b'
  }
};