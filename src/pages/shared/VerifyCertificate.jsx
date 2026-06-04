import { useRef, useState } from 'react'
import { verifyUploadedCertificate } from '../../api.js'

function isPdfFile(file) {
  return file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf')
}

function isSupportedUpload(file) {
  return Boolean(file) && (file.type?.startsWith('image/') || isPdfFile(file))
}

export default function VerifyCertificate() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

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
    <div className="verify-root">
      <div className="verify-header">
        <h1>Verify Certificate</h1>
        <p>Upload a certificate PDF or image for official validation and AI-based forgery checks</p>
      </div>

      <div className="verify-body">
        <form onSubmit={handleVerifyFile} className="verify-form">
          <div
            className={`verify-dropzone ${file ? 'verify-dropzone hasFile' : ''}`}
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
                <span className="verify-fileIcon">{uploadLabel}</span>
                <span className="verify-fileName">{file.name}</span>
                <span className="verify-fileSize">{(file.size / 1024).toFixed(1)} KB</span>
                <button type="button" className="verify-clearFile" onClick={event => { event.stopPropagation(); setFile(null) }}>
                  Remove
                </button>
              </>
            ) : (
              <>
                <span className="verify-dropIcon">UP</span>
                <span className="verify-dropText">Drag and drop a certificate PDF or image, or click to browse</span>
                <span className="verify-dropSub">PDF, PNG, JPG, JPEG, and WEBP are supported</span>
              </>
            )}
          </div>
          {error && <p className="verify-error">Error: {error}</p>}
          <button type="submit" className="verify-btn" disabled={loading || !file}>
            {loading ? <><span className="spinner" /> {uploadButtonLabel}</> : uploadButtonLabel}
          </button>
        </form>

        {result && <ResultPanel result={result} />}
      </div>
    </div>
  )
}

function ResultPanel({ result }) {
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
    <div className={`verify-result ${authentic ? 'verify-valid' : 'verify-invalid'}`}>
      <div className="verify-resultTop">
        <div className="verify-resultIcon">{authentic ? 'OK' : 'AL'}</div>
        <div>
          <div className="verify-resultTitle">{title}</div>
          <div className="verify-resultSub">{subtitle}</div>
        </div>
      </div>

      <div className="verify-meters">
        <Meter label="Verification Confidence" value={ai.confidence} color={authentic ? 'var(--success)' : 'var(--danger)'} />
        <Meter label="Tamper Score" value={ai.tamperScore} color={parseFloat(ai.tamperScore) > 20 ? 'var(--danger)' : 'var(--accent-2)'} />
      </div>

      <div className="verify-panels">
        <div className="verify-panel">
          <div className="verify-panelTitle">Verification Output</div>
          <Row label="Model" value={ai.model.name} />
          <Row label="Version" value={ai.model.version} />
          <Row label="Predicted" value={ai.model.predictedLabel} />
          <Row label="Risk Band" value={ai.riskBand} />
          <Row label="Authentic Prob." value={`${ai.model.authenticProbability}%`} />
          <Row label="Forged Prob." value={`${ai.model.forgedProbability}%`} />
        </div>

        <div className="verify-panel">
          <div className="verify-panelTitle">{isPdf ? 'PDF Evidence' : 'Image Evidence'}</div>
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
        <div className="verify-panels" style={{ marginTop: 20 }}>
          <div className="verify-panel">
            <div className="verify-panelTitle">Matched Certificate</div>
            <Row label="Certificate ID" value={result.matchedCertificate.id} mono />
            <Row label="Student" value={result.matchedCertificate.studentName} />
            <Row label="Degree" value={result.matchedCertificate.degree} />
            <Row label="Branch" value={result.matchedCertificate.branch} />
            <Row label="Year" value={result.matchedCertificate.year} />
            <Row label="Block" value={String(result.matchedCertificate.blockNumber)} />
          </div>
        </div>
      )}

      <div className="verify-detailList" style={{ marginTop: 20 }}>
        {ai.details.map((detail, index) => (
          <div key={index} className={`verify-detailItem ${authentic ? 'verify-detailOk' : 'verify-detailBad'}`}>
            <span>{authentic ? 'OK' : 'AL'}</span>{detail}
          </div>
        ))}
      </div>
    </div>
  )
}

function Meter({ label, value, color }) {
  return (
    <div className="verify-meter">
      <div className="verify-meterLabel">
        <span>{label}</span>
        <span className="verify-meterVal" style={{ color }}>{value}%</span>
      </div>
      <div className="verify-meterBar">
        <div className="verify-meterFill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8, alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: mono ? 'var(--accent-2)' : 'var(--text)', textAlign: 'right', fontFamily: mono ? 'Courier New, monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}
