# Academic Certificate Verification Portal

End-to-end final year project for issuing academic certificates on a private blockchain ledger and detecting forgery in uploaded certificate images using a CNN-backed AI layer.

## What This Project Now Includes

- React + Vite frontend for admin and student workflows
- Express backend with JWT authentication and role-based access
- Private blockchain ledger service with chained certificate hashes
- PDF certificate generation for issued records
- CNN-based forgery detector in Node.js with hybrid image heuristics
- Seed data, audit logs, health endpoint, and automated ledger tests

## Architecture

### Frontend
- React 18
- Vite
- React Router
- Axios

### Backend
- Express 5
- JWT auth
- Multer file upload handling
- JSON file persistence
- PDF generation with `pdf-lib`

### Blockchain Layer
- Permissioned private ledger implemented as append-only hash-chained blocks
- Each issued certificate stores:
  - document hash
  - transaction ID
  - block number
  - blockchain hash

### AI Layer
- CNN classifier implemented in JavaScript with `convnetjs`
- Synthetic baseline model bootstrapped automatically for demo readiness
- Upload analysis combines:
  - CNN prediction
  - edge discontinuity scoring
  - blockiness detection
  - tile variance analysis
  - noise and brightness heuristics

## Quick Start

```bash
npm install
npm run dev:full
```

Frontend:
- `http://localhost:3000`

Backend:
- `http://localhost:5000`

Windows shortcut:
- double-click `start.bat`

## Default Login Credentials

| Role | User ID | Password |
|------|---------|----------|
| Admin | `admin` | `admin123` |
| Student | `student01` | `student123` |
| Student | `student02` | `student123` |

## Available Scripts

- `npm run dev` starts the Vite frontend
- `npm run server` starts the backend API
- `npm run server:dev` starts the backend in watch mode
- `npm run dev:full` starts frontend and backend together
- `npm run bootstrap:model` trains or restores the baseline CNN model
- `npm run build` builds the frontend
- `npm run test` runs backend ledger tests

## Core Workflows

### Admin
- log in securely
- create student accounts
- issue certificates
- generate downloadable PDF certificates
- inspect all certificates, blocks, and transaction IDs
- verify certificate IDs against the blockchain ledger
- upload certificate images for AI forgery analysis

### Student
- log in and view issued certificates
- copy certificate IDs and hashes
- open certificate PDFs
- run verification checks from the dashboard

## Project Structure

```text
cert-portal/
|-- backend/
|   |-- app.js
|   |-- server.js
|   |-- config.js
|   |-- routes/
|   |-- services/
|   |   |-- ai/
|   |   |-- blockchainLedger.js
|   |   |-- certificatePdfService.js
|   |   |-- verificationService.js
|   |-- data/
|   |-- models/
|   |-- storage/
|   `-- tests/
|-- src/
|   |-- api.js
|   |-- components/
|   `-- pages/
|-- start.bat
|-- package.json
`-- vite.config.js
```

## Important Notes

- The blockchain layer is implemented as a private ledger service inside the backend so the project runs fully on one machine without external chain setup.
- The AI model is a baseline CNN trained on synthetic certificate-like samples to keep the project runnable immediately.
- For real institutional deployment, retrain the CNN with a real labeled dataset of authentic and forged certificates.
- Uploaded images are analyzed in-memory; certificate issuance records and audit data are persisted in `backend/data/database.json`.

## Environment Variables

Copy `.env.example` to `.env` if you want to customize the backend:

```bash
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=12h
```

## Smoke Verification

These commands have been verified successfully in this workspace:

- `npm run bootstrap:model`
- `npm run build`
- `npm run test`

The backend login, admin overview, and certificate verification endpoints were also smoke-tested successfully.
