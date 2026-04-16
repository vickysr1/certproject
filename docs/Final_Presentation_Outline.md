# Academic Certificate Verification Portal

## Final Presentation Outline

### Slide 1. Title
- Blockchain-Based Academic Certificate Issuance and AI-Powered Forgery Detection
- Final year project presentation
- Academic Certificate Verification Portal

### Slide 2. Abstract
- Introduces the motivation for secure certificate issuance and trusted verification.
- Summarizes the role of the private blockchain ledger and the CNN-backed forgery detector.
- Highlights the value delivered to institutions, students, and recruiters.

### Slide 3. Existing System
- Describes traditional paper or PDF-based certificate handling.
- Explains how verification is commonly performed through manual communication.
- Shows the absence of machine-verifiable integrity and automated tamper screening.

### Slide 4. Drawbacks of the Existing System
- Manual and slow verification
- Easy document manipulation
- Lack of immutable records
- Weak auditability and poor scalability
- Higher trust gap for employers and external verifiers

### Slide 5. Proposed System
- Role-based web portal for admin and student workflows
- PDF generation and document hashing during issuance
- Private blockchain ledger for tamper-evident certificate fingerprints
- Verification by certificate ID and upload-based AI analysis
- Audit logging for traceability

### Slide 6. Advantages of the Proposed System
- Fast and independent verification
- Better integrity and tamper evidence
- AI-supported forgery screening
- Improved transparency and accountability
- Stronger trust for stakeholders
- Scalable and extensible deployment model

### Slide 7. Architecture Diagram
- Stakeholders interact with the React frontend.
- The frontend communicates with the Express backend.
- The backend coordinates:
  - JSON data store
  - private blockchain ledger
  - PDF generation and storage
  - AI forgery detection engine

### Slide 8. Proposed Modules
- Presentation Layer
- Authentication and API Layer
- Certificate Management
- PDF Document Generator
- Private Blockchain Ledger
- AI Verification and Audit

### Slide 9. Explanation of Proposed Modules - Part I
- Presentation Layer:
  - dashboards, forms, verification screens
- Authentication and API Layer:
  - JWT, validation, secured endpoints
- Certificate Management and PDF Generation:
  - student binding, hash computation, certificate rendering

### Slide 10. Explanation of Proposed Modules - Part II
- Private Blockchain Ledger:
  - chained blocks, transaction IDs, document fingerprints
- AI Forgery Detection Engine:
  - binary CNN classifier with structural image heuristics
- Verification and Audit Logging:
  - verification by ID, upload analysis, history tracking

### Slide 11. Hardware and Software Requirements
- Hardware:
  - Intel i5 / Ryzen 5 recommended
  - 8 GB RAM recommended
  - 10 GB free storage minimum
- Software:
  - Windows / Linux / macOS
  - Node.js and npm
  - React, Vite, Express, ConvNetJS, Jimp, PDF-Lib
  - modern browser and IDE

### Slide 12. Conclusion
- The project converts certificate handling into a secure digital workflow.
- The blockchain layer improves traceability and trust.
- The AI layer strengthens document screening.
- The solution is suitable for academic demonstration and future enhancement.

### Slide 13. References
- React Documentation
- Express.js Documentation
- ConvNetJS documentation by Andrej Karpathy
- JWT RFC 7519
- PDF-Lib Documentation
- Jimp Documentation
- PptxGenJS Documentation
- Project source code
