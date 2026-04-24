import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { verifyCertificate } from '../../api.js';

export default function VerifyPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVerification() {
      try {
        setLoading(true);
        const data = await verifyCertificate(id);
        setResult(data);
      } catch (err) {
        console.error('Verification fetch error:', err);
        setError('Failed to fetch verification data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchVerification();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="vp-container">
        <div className="vp-loadingCard">
          <div className="vp-spinner"></div>
          <p>Verifying certificate authenticity...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="vp-container">
        <div className="vp-card vp-notFound">
          <div className="vp-statusBadge">NOT FOUND ✗</div>
          <h1>Certificate Not Found</h1>
          <p>The certificate with ID <strong>{id}</strong> could not be located on the blockchain ledger.</p>
          <a href="/" className="vp-homeLink">Go to Home</a>
        </div>
      </div>
    );
  }

  const { valid, cert, blockchainResult } = result;

  if (!valid) {
    return (
      <div className="vp-container">
        <div className="vp-card vp-invalid">
          <div className="vp-statusBadge">INVALID ✗</div>
          <h1>Verification Failed</h1>
          <p>The certificate with ID <strong>{id}</strong> exists but failed integrity checks.</p>
          <div>
            <p><strong>Reason:</strong> {result.reason || 'Data inconsistency detected.'}</p>
          </div>
          <a href="/" className="vp-homeLink">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="vp-container">
      <div className="vp-card">
        <div className="vp-statusBadge">VERIFIED ✓</div>
        <header className="vp-header">
          <h1>Certificate Verified</h1>
          <p className="vp-subtitle">Blockchain-backed academic record</p>
        </header>

        <section className="vp-section">
          <h2>Academic Information</h2>
          <div className="vp-grid">
            <div className="vp-field">
              <label>Student Name</label>
              <div className="vp-value">{cert.studentName}</div>
            </div>
            <div className="vp-field">
              <label>Institution</label>
              <div className="vp-value">{cert.institution}</div>
            </div>
            <div className="vp-field">
              <label>Degree</label>
              <div className="vp-value">{cert.degree}</div>
            </div>
            <div className="vp-field">
              <label>Branch / Major</label>
              <div className="vp-value">{cert.branch}</div>
            </div>
            <div className="vp-field">
              <label>Academic Year</label>
              <div className="vp-value">{cert.year}</div>
            </div>
            <div className="vp-field">
              <label>Grade / CGPA</label>
              <div className="vp-value">{cert.grade}</div>
            </div>
          </div>
        </section>

        <section className="vp-section">
          <h2>Blockchain Metadata</h2>
          <div className="vp-blockchainInfo">
            <div className="vp-infoRow">
              <span>Block Number:</span>
              <span className="vp-badge">{blockchainResult.blockNumber}</span>
            </div>
            <div className="vp-infoRow">
              <span>Issued On:</span>
              <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
            </div>
             <div className="vp-infoRow">
              <span>Ledger Node:</span>
              <span>{blockchainResult.validator}</span>
            </div>
          </div>
        </section>

        <footer className="vp-footer">
          <p>This certificate is digitally signed and indexed on a private blockchain ledger hosted by {cert.institution}.</p>
        </footer>
      </div>
    </div>
  );
}
