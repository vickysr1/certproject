import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './VerifyPage.module.css';

// We use an environment variable or a fallback for the API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVerification() {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/certificates/verify/${id}`);
        setResult(response.data);
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
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Verifying certificate authenticity...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.notFound}`}>
          <div className={styles.statusBadge}>NOT FOUND ✗</div>
          <h1>Certificate Not Found</h1>
          <p>The certificate with ID <strong>{id}</strong> could not be located on the blockchain ledger.</p>
          <a href="/" className={styles.homeLink}>Go to Home</a>
        </div>
      </div>
    );
  }

  const { valid, cert, blockchainResult } = result;

  if (!valid) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.invalid}`}>
          <div className={styles.statusBadge}>INVALID ✗</div>
          <h1>Verification Failed</h1>
          <p>The certificate with ID <strong>{id}</strong> exists but failed integrity checks.</p>
          <div className={styles.details}>
            <p><strong>Reason:</strong> {result.reason || 'Data inconsistency detected.'}</p>
          </div>
          <a href="/" className={styles.homeLink}>Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.statusBadge}>VERIFIED ✓</div>
        <header className={styles.header}>
          <h1>Certificate Verified</h1>
          <p className={styles.subtitle}>Blockchain-backed academic record</p>
        </header>

        <section className={styles.section}>
          <h2>Academic Information</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Student Name</label>
              <div className={styles.value}>{cert.studentName}</div>
            </div>
            <div className={styles.field}>
              <label>Institution</label>
              <div className={styles.value}>{cert.institution}</div>
            </div>
            <div className={styles.field}>
              <label>Degree</label>
              <div className={styles.value}>{cert.degree}</div>
            </div>
            <div className={styles.field}>
              <label>Branch / Major</label>
              <div className={styles.value}>{cert.branch}</div>
            </div>
            <div className={styles.field}>
              <label>Academic Year</label>
              <div className={styles.value}>{cert.year}</div>
            </div>
            <div className={styles.field}>
              <label>Grade / CGPA</label>
              <div className={styles.value}>{cert.grade}</div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Blockchain Metadata</h2>
          <div className={styles.blockchainInfo}>
            <div className={styles.infoRow}>
              <span>Transaction ID:</span>
              <code className={styles.hash}>{blockchainResult.transactionId}</code>
            </div>
            <div className={styles.infoRow}>
              <span>Block Number:</span>
              <span className={styles.badge}>{blockchainResult.blockNumber}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Issued On:</span>
              <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
            </div>
             <div className={styles.infoRow}>
              <span>Ledger Node:</span>
              <span>{blockchainResult.validator}</span>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>This certificate is digitally signed and indexed on a private blockchain ledger hosted by {cert.institution}.</p>
        </footer>
      </div>
    </div>
  );
}
