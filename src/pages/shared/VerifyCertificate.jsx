import { useRef, useState } from 'react'
import { verifyCertificate, verifyUploadedCertificate } from '../../api.js'
import s from './VerifyCertificate.module.css'

function isPdfFile(file) {
  return file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf')
}

function isSupportedUpload(file) {
  return Boolean(file) && (file.type?.startsWith('image/') || isPdfFile(file))
}

export default function VerifyCertificate() {
  const [tab, setTab] = useState('id')
  const [certId, setCertId] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function handleVerifyById(event) {
    event.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const response = await verifyCertificate(certId.trim())
      setResult({ mode: 'id', ...response })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyFile(event) {
    event.preventDefault()

    if (!file) {
      return
    }

    setError('')
    setResult(null)
    setLoading(true)

    try {
      const response = await verifyUploadedCertificate(file)
      setResult({ mode: 'upload', ...response })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]

    if (isSupportedUpload(droppedFile)) {
      setFile(droppedFile)
    }
  }

  const uploadLabel = file ? (isPdfFile(file) ? 'PDF' : 'IMG') : null
  const uploadButtonLabel = loading
    ? `Checking uploaded ${isPdfFile(file) ? 'PDF' : 'file'}...`
    : `Verify Uploaded ${isPdfFile(file) ? 'PDF' : 'File'}`

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1>Verify Certificate</h1>
        <p>Run blockchain lookup, official PDF validation, and AI-based image forgery checks</p>
      </div>

      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'id' ? s.active : ''}`} onClick={() => { setTab('id'); setResult(null); setError('') }}>
          Verify by Certificate ID
        </button>
        <button className={`${s.tab} ${tab === 'upload' ? s.active : ''}`} onClick={() => { setTab('upload'); setResult(null); setError('') }}>
          Upload PDF or Image
        </button>
      </div>

      <div className={s.body}>
        {tab === 'id' ? (
          <form onSubmit={handleVerifyById} className={s.form}>
            <div className={s.field}>
              <label>Certificate ID</label>
              <input
                type="text"
                required
                placeholder="e.g. CERT-2026-0001"
                value={certId}
                onChange={event => setCertId(event.target.value)}
              />
              <span className={s.fieldHint}>Use the certificate ID to validate the blockchain record directly.</span>
            </div>
            {error && <p className={s.error}>Error: {error}</p>}
            <button type="submit" className={s.btn} disabled={loading}>
              {loading ? <><span className="spinner" /> Checking ledger...</> : 'Verify on Blockchain'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyFile} className={s.form}>
            <div
              className={`${s.dropzone} ${file ? s.hasFile : ''}`}
              onDrop={handleDrop}
              onDragOver={event => event.preventDefault()}
              onClick={() => fileRef.current.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={event => setFile(event.target.files[0])}
              />
              {file ? (
                <>
                  <span className={s.fileIcon}>{uploadLabel}</span>
                  <span className={s.fileName}>{file.name}</span>
                  <span className={s.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                  <button type="button" className={s.clearFile} onClick={event => { event.stopPropagation(); setFile(null) }}>
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <span className={s.dropIcon}>UP</span>
                  <span className={s.dropText}>Drag and drop a certificate PDF or image, or click to browse</span>
                  <span className={s.dropSub}>PDF, PNG, JPG, JPEG, and WEBP are supported</span>
                </>
              )}
            </div>
            {error && <p className={s.error}>Error: {error}</p>}
            <button type="submit" className={s.btn} disabled={loading || !file}>
              {loading ? <><span className="spinner" /> {uploadButtonLabel}</> : uploadButtonLabel}
            </button>
          </form>
        )}

        {result && <ResultPanel result={result} />}
      </div>
    </div>
  )
}

function ResultPanel({ result }) {
  if (result.mode === 'id') {
    if (!result.valid) {
      return (
        <div className={`${s.result} ${s.invalid}`}>
          <div className={s.resultIcon}>X</div>
          <div className={s.resultTitle}>Certificate Not Found</div>
          <p className={s.resultSub}>{result.reason}</p>
        </div>
      )
    }

    const certificate = result.cert
    const ai = result.aiResult
    const blockchain = result.blockchainResult

    return (
      <div className={`${s.result} ${s.valid}`}>
        <div className={s.resultTop}>
          <div className={s.resultIcon}>OK</div>
          <div>
            <div className={s.resultTitle}>Certificate Verified</div>
            <div className={s.resultSub}>Ledger fingerprint matched the stored issuance block.</div>
          </div>
        </div>

        <div className={s.panels}>
          <div className={s.panel}>
            <div className={s.panelTitle}>Certificate Details</div>
            <Row label="ID" value={certificate.id} mono />
            <Row label="Student" value={certificate.studentName} />
            <Row label="Degree" value={certificate.degree} />
            <Row label="Branch" value={certificate.branch} />
            <Row label="Grade" value={certificate.grade} />
            <Row label="Year" value={certificate.year} />
            <Row label="Institution" value={certificate.institution} />
          </div>

          <div className={s.panel}>
            <div className={s.panelTitle}>Integrity Analysis</div>
            <Meter label="Confidence" value={ai.confidence} color="var(--green)" />
            <Meter label="Tamper Score" value={ai.tamperScore} color={parseFloat(ai.tamperScore) > 20 ? 'var(--red)' : 'var(--teal)'} />

            <div className={s.panelTitle} style={{ marginTop: 16 }}>Blockchain Record</div>
            <Row label="Block" value={blockchain.blockNumber} />
            <Row label="Confirmed" value={blockchain.confirmed ? 'Yes' : 'No'} />
            <Row label="Validator" value={blockchain.validator} />
            <Row label="Timestamp" value={new Date(blockchain.timestamp).toLocaleString()} />
            <Row label="Hash" value={certificate.blockchainHash.slice(0, 22) + '...'} mono />
          </div>
        </div>
      </div>
    )
  }

  return <UploadResultPanel result={result} />
}

function UploadResultPanel({ result }) {
  const ai = result.aiResult
  const authentic = ai.authentic
  const isPdf = result.analysisType === 'pdf-fingerprint'
  const title = isPdf
    ? (authentic ? 'Official PDF Matched' : 'PDF Record Not Confirmed')
    : (authentic ? 'Appears Authentic' : 'Potential Forgery Detected')
  const subtitle = isPdf && result.matchedCertificate
    ? `${result.fileName} | matched ${result.matchedCertificate.id}`
    : result.fileName

  return (
    <div className={`${s.result} ${authentic ? s.valid : s.invalid}`}>
      <div className={s.resultTop}>
        <div className={s.resultIcon}>{authentic ? 'OK' : 'AL'}</div>
        <div>
          <div className={s.resultTitle}>{title}</div>
          <div className={s.resultSub}>{subtitle}</div>
        </div>
      </div>

      <div className={s.meters}>
        <Meter label="Verification Confidence" value={ai.confidence} color={authentic ? 'var(--green)' : 'var(--red)'} />
        <Meter label="Tamper Score" value={ai.tamperScore} color={parseFloat(ai.tamperScore) > 20 ? 'var(--red)' : 'var(--teal)'} />
      </div>

      <div className={s.panels}>
        <div className={s.panel}>
          <div className={s.panelTitle}>Verification Output</div>
          <Row label="Model" value={ai.model.name} />
          <Row label="Version" value={ai.model.version} />
          <Row label="Predicted" value={ai.model.predictedLabel} />
          <Row label="Risk Band" value={ai.riskBand} />
          <Row label="Authentic Prob." value={`${ai.model.authenticProbability}%`} />
          <Row label="Forged Prob." value={`${ai.model.forgedProbability}%`} />
        </div>

        <div className={s.panel}>
          <div className={s.panelTitle}>{isPdf ? 'PDF Evidence' : 'Image Evidence'}</div>
          {isPdf ? (
            <>
              <Row label="File Type" value={ai.evidence.fileType} />
              <Row label="Pages" value={String(ai.evidence.pageCount)} />
              <Row label="Method" value={ai.evidence.verificationMethod} />
              <Row label="Matched ID" value={ai.evidence.matchedCertificateId} />
              <Row label="Student" value={ai.evidence.matchedStudentName} />
              <Row label="Hash" value={ai.evidence.uploadedHashPreview} mono />
            </>
          ) : (
            <>
              <Row label="Noise" value={`${ai.evidence.noiseScore}%`} />
              <Row label="Edges" value={`${ai.evidence.edgeScore}%`} />
              <Row label="Blockiness" value={`${ai.evidence.blockinessScore}%`} />
              <Row label="Tile Variance" value={`${ai.evidence.tileVarianceScore}%`} />
              <Row label="Brightness" value={`${ai.evidence.brightnessScore}%`} />
              <Row label="Image Size" value={`${ai.evidence.imageWidth} x ${ai.evidence.imageHeight}`} />
            </>
          )}
        </div>
      </div>

      {isPdf && result.matchedCertificate && (
        <div className={s.panels} style={{ marginTop: 20 }}>
          <div className={s.panel}>
            <div className={s.panelTitle}>Matched Certificate</div>
            <Row label="Certificate ID" value={result.matchedCertificate.id} mono />
            <Row label="Student" value={result.matchedCertificate.studentName} />
            <Row label="Degree" value={result.matchedCertificate.degree} />
            <Row label="Branch" value={result.matchedCertificate.branch} />
            <Row label="Year" value={result.matchedCertificate.year} />
            <Row label="Block" value={String(result.matchedCertificate.blockNumber)} />
          </div>
        </div>
      )}

      <div className={s.detailList} style={{ marginTop: 20 }}>
        {ai.details.map((detail, index) => (
          <div key={index} className={`${s.detailItem} ${authentic ? s.detailOk : s.detailBad}`}>
            <span>{authentic ? 'OK' : 'AL'}</span>{detail}
          </div>
        ))}
      </div>
    </div>
  )
}

function Meter({ label, value, color }) {
  return (
    <div className={s.meter}>
      <div className={s.meterLabel}>
        <span>{label}</span>
        <span className={s.meterVal} style={{ color }}>{value}%</span>
      </div>
      <div className={s.meterBar}>
        <div className={s.meterFill} style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8, alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: mono ? 'var(--teal)' : 'var(--text)', textAlign: 'right', fontFamily: mono ? 'Courier New, monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}
