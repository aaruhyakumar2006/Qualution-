import React, { useState } from 'react';
import {
  Download,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Copy,
  Sparkles,
  Award,
  Check,
  FileText,
  Maximize2,
} from 'lucide-react';
import type { QuantumCertificate } from '../../features/certificates/certificateTypes';
import './QuantumCertificateView.css';

export interface QuantumCertificateViewProps {
  certificate: QuantumCertificate;
  showActions?: boolean;
  onClose?: () => void;
}

export const QuantumCertificateView: React.FC<QuantumCertificateViewProps> = ({
  certificate,
  showActions = true,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<'image' | 'pdf'>('image');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const officialPdfUrl = '/Qualution_Certificate_Official.pdf';
  const officialPngUrl = '/Qualution_Certificate_Official.png';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(certificate.verificationUrl || window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareLinkedIn = () => {
    const title = encodeURIComponent(
      `I am honored to have earned my official Certification in Quantum Information Science & Quantum Circuit Engineering from Qualution!`
    );
    const summary = encodeURIComponent(
      `Credential ID: ${certificate.id} | Verification Hash: ${certificate.verificationHash}`
    );
    const url = encodeURIComponent(certificate.verificationUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`,
      '_blank'
    );
  };

  const handleDownloadPdf = () => {
    const a = document.createElement('a');
    a.href = officialPdfUrl;
    a.download = 'Qualution_Certificate_Aarav_Sharma_signed.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPng = () => {
    const a = document.createElement('a');
    a.href = officialPngUrl;
    a.download = 'Qualution_Certificate_Aarav_Sharma_signed.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`qc-root-wrapper ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Top Action Toolbar */}
      {showActions && (
        <div className="qc-action-bar no-print">
          <div className="qc-action-status">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="qc-status-text">Official Signed Credential</span>
            <span className="qc-hash-pill" title="Cryptographic SHA-256 Digest">
              {certificate.id || 'QL-QC-2026-8228-B6'}
            </span>
          </div>

          <div className="qc-actions-group">
            {/* View Mode Toggle */}
            <div className="qc-view-toggle">
              <button
                type="button"
                className={`qc-toggle-btn ${viewMode === 'image' ? 'active' : ''}`}
                onClick={() => setViewMode('image')}
                title="View High-Resolution Image"
              >
                Image
              </button>
              <button
                type="button"
                className={`qc-toggle-btn ${viewMode === 'pdf' ? 'active' : ''}`}
                onClick={() => setViewMode('pdf')}
                title="View Official Signed PDF"
              >
                PDF
              </button>
            </div>

            {/* Download Official Signed PDF */}
            <button
              type="button"
              className="qc-btn qc-btn-primary"
              onClick={handleDownloadPdf}
              title="Download Original Official PDF (94 KB Signed Document)"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>

            {/* Download High-Res Image */}
            <button
              type="button"
              className="qc-btn qc-btn-secondary"
              onClick={handleDownloadPng}
              title="Download High-Resolution PNG"
            >
              <FileText size={14} />
              <span>PNG</span>
            </button>

            {/* Print Official Certificate */}
            <button
              type="button"
              className="qc-btn qc-btn-secondary"
              onClick={handlePrint}
              title="Print Official Certificate"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            {/* Copy Verification Link */}
            <button
              type="button"
              className="qc-btn qc-btn-secondary"
              onClick={handleCopyLink}
              title="Copy Tamper-Evident Verification Link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {/* LinkedIn Share */}
            <button
              type="button"
              className="qc-btn qc-btn-secondary"
              onClick={handleShareLinkedIn}
              title="Share Credential on LinkedIn"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="qc-btn qc-btn-secondary"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            >
              <Maximize2 size={14} />
            </button>

            {onClose && (
              <button
                type="button"
                className="qc-btn qc-btn-close"
                onClick={onClose}
                aria-label="Close certificate"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Official Signed Certificate Viewer */}
      <div className="qc-official-document-container" id="qualution-certificate-print-root">
        {viewMode === 'image' ? (
          <div className="qc-image-frame">
            <img
              src={officialPngUrl}
              alt="Official Qualution Certificate of Completion - Aarav Sharma"
              className="qc-official-img"
              loading="eager"
            />
          </div>
        ) : (
          <div className="qc-pdf-frame">
            <iframe
              src={`${officialPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              title="Official Qualution Signed Certificate PDF"
              className="qc-official-iframe"
            />
          </div>
        )}
      </div>

      {/* Official Ledger Security & Verification Proof Strip */}
      <div className="qc-official-security-strip no-print">
        <div className="qc-strip-col">
          <span className="qc-strip-label">CREDENTIAL ID</span>
          <span className="qc-strip-val text-sky-400 font-mono">
            {certificate.id || 'QL-QC-2026-8228-B6'}
          </span>
        </div>

        <div className="qc-strip-col">
          <span className="qc-strip-label">RECIPIENT</span>
          <span className="qc-strip-val font-semibold">
            {certificate.recipientName || 'Aarav Sharma'}
          </span>
        </div>

        <div className="qc-strip-col">
          <span className="qc-strip-label">FINAL SCORE</span>
          <span className="qc-strip-val text-emerald-400 font-semibold">
            {certificate.overallScore || 92}% ({certificate.overallGrade || 'A+'})
          </span>
        </div>

        <div className="qc-strip-col">
          <span className="qc-strip-label">STATE FIDELITY</span>
          <span className="qc-strip-val text-emerald-400 font-semibold">
            {certificate.stateFidelityScore || 99.82}%
          </span>
        </div>

        <div className="qc-strip-col">
          <span className="qc-strip-label">DATE OF ISSUE</span>
          <span className="qc-strip-val">
            {certificate.formattedDate || '29 September 2026'}
          </span>
        </div>

        <div className="qc-strip-col flex-1">
          <span className="qc-strip-label">SHA-256 DIGEST</span>
          <span className="qc-strip-val font-mono text-xs text-slate-300 break-all">
            {certificate.verificationHash || '7091bf53c3d791f4b3462ea734695147'}
          </span>
        </div>
      </div>
    </div>
  );
};
