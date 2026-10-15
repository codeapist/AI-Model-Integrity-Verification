# Blockchain-Based Integrity Verification of AI Models

> Detect whether an AI model file has changed after registration by comparing its SHA-256 fingerprint with the fingerprint recorded in a hash-linked ledger.

## Project at a glance

- **Type:** College micro-project / educational full-stack prototype
- **Domain:** AI security, cryptographic hashing, data integrity, blockchain concepts
- **Frontend:** React, Vite, JavaScript/JSX, CSS, Lucide React
- **Backend:** Python, Flask, Flask-CORS
- **Hashing:** Python `hashlib` using SHA-256
- **Ledger storage:** Local JSON file, normally `backend/data/blockchain.json`
- **Frontend URL:** Usually `http://localhost:5173`
- **Backend URL:** `http://localhost:5000`

**Important:** This is a blockchain-style local prototype, not a decentralized network like Bitcoin or Ethereum. It does not implement consensus, cryptocurrency, or proof-of-work mining.

## Abstract

AI model files may be copied, transferred, stored, or deployed in different environments. If a model file is modified after its original version has been registered, users need a way to check whether a later file is identical to the registered artifact. During registration, the backend calculates a SHA-256 cryptographic hash of the uploaded file and records the hash and model metadata in a hash-linked ledger. During verification, the uploaded file is hashed again and compared with the registered hash. A match means the file contents match the registered artifact; a mismatch means the submitted file differs. The application also displays ledger records and validates block hashes and previous-hash links.

## Features

- Register an uploaded model file and calculate its SHA-256 hash.
- Generate a model ID and record model metadata in a ledger block.
- Link blocks using previous-block hashes.
- Verify a later upload against the registered file hash.
- List registered models and inspect ledger blocks.
- Validate block hashes and previous-hash links.
- Demonstrate matching and mismatching files.

## Architecture

```text
Browser / User
      |
      v
React + Vite frontend
(Dashboard, Register, Verify, Ledger)
      |
      | HTTP REST API
      v
Python + Flask backend
(uploads, SHA-256, registration, verification, validation)
      |
      v
Local JSON ledger
backend/data/blockchain.json
```

## Technology stack

| Technology | Purpose |
|---|---|
| Python | Backend language |
| Flask | REST API and request handling |
| Flask-CORS | Cross-origin requests during local development |
| hashlib | SHA-256 hashing |
| JSON | Local ledger format |
| React | Frontend UI |
| Vite | Frontend development server and build tooling |
| JavaScript/JSX, HTML/CSS | Frontend logic, structure and styling |
| Lucide React | Interface icons |

## Project structure

```text
AI_Model_Integrity_Verification_Project/
├── backend/
│   ├── app.py
│   ├── blockchain.py
│   ├── requirements.txt
│   └── data/
│       └── .gitkeep
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── sample_model.txt
├── README.md
└── .gitignore
```

The ledger file may be created at runtime when records are first written.

## How it works

### Registration
1. The user selects a model file.
2. The frontend sends the file to the Flask backend.
3. The backend calculates SHA-256 from the uploaded bytes.
4. A unique model ID and model metadata are created.
5. A block is added with the model hash and previous-block hash.
6. The ledger is saved locally and the result is returned.

### Verification
1. The user provides a registered model ID and a file.
2. The backend calculates a new SHA-256 hash for the submitted file.
3. The registered hash is retrieved.
4. The hashes are compared.
5. Matching hashes indicate that the submitted file matches the registered artifact; different hashes indicate a mismatch.

### Chain validation
The backend recalculates block hashes and checks previous-hash links. A mismatch indicates that the ledger is internally inconsistent according to the implementation's validation rules.

## API endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check whether the backend is running |
| POST | `/api/register` | Register an uploaded model file |
| POST | `/api/verify` | Verify a file against a registered model ID |
| GET | `/api/models` | List registered models |
| GET | `/api/chain` | Retrieve ledger blocks |
| GET | `/api/chain/validate` | Validate chain consistency |

Check `backend/app.py` for exact request fields and response schemas before relying on the API in another application.

## Requirements

- Python 3
- Node.js and npm
- Modern web browser
- Windows, macOS, or Linux

A standard laptop is sufficient; a GPU is not required because the core workflow hashes files and manages records rather than training a model.

## Installation and execution

### Start the backend

```bash
cd backend
python -m venv venv
```

Activate the environment.

**Windows PowerShell**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows Command Prompt**
```bat
venv\Scripts\activate.bat
```

Install dependencies and start Flask:

```bash
python -m pip install -r requirements.txt
python app.py
```

The backend should run at `http://localhost:5000`.

### Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

If PowerShell blocks `npm.ps1`, try `npm.cmd install` and `npm.cmd run dev`.

## Demo workflow

1. Register `sample_model.txt` or another sample model artifact.
2. Save the returned model ID and SHA-256 hash.
3. Verify the exact same file against that model ID; the hashes should match.
4. Make a copy and change its contents.
5. Verify the modified copy against the original model ID; the hashes should differ.
6. Inspect the ledger and run chain validation.

These are expected outcomes; only report tests as passed after executing them.

## Security assumptions and limitations

- The registered hash is assumed to be a trusted reference.
- A matching hash indicates file identity relative to that reference; it does not prove that the model is accurate, fair, safe, or free from backdoors.
- The ledger is stored locally in JSON and is not decentralized or replicated.
- There is no distributed consensus, cryptocurrency, proof-of-work mining, or smart contracts.
- A privileged user with local access may rewrite the ledger and recompute hashes.
- Production use would require additional authentication, authorization, protected storage, digital signatures, independent validation and operational hardening.

## Future enhancements

- Integrate a permissioned blockchain such as Hyperledger Fabric.
- Add digital signatures, authentication and role-based access control.
- Anchor ledger checkpoints to an independent trusted system.
- Add model version history and provenance metadata.
- Use protected cloud storage, audit logs and monitoring.
- Add unit and integration tests.
- Containerize the application with Docker.
- Test with a genuinely trained scikit-learn or ONNX model.
- Measure performance across file sizes and ledger lengths.

## Research reference

Ö. Ural and K. Yoshigoe, “Survey on Blockchain-Enhanced Machine Learning,” *IEEE Access*, 2023. DOI: https://doi.org/10.1109/ACCESS.2023.3344669.

Read and verify the original publication before citing detailed claims, page numbers, or quotations.

## License

Add a license file if you intend to grant others permission to reuse or modify this project.
