# Official ITD ERI Intermediary Registration & Integration Guide

This guide details how to register your platform as an official **E-Filing Resource Intermediary (ERI)** with the **Income Tax Department of India (CBDT / ITD)** on [`incometax.gov.in`](https://eportal.incometax.gov.in/) to obtain production API keys and live gateway access.

---

## 📌 1. Understanding ERI Categories

The Income Tax Department authorizes two categories of ERIs:

* **Category I (Software Developers / Fintech Platforms)**:
  - Companies providing e-filing software, automated tax return engines, and tax advisory platforms (e.g. TaxBuddy, ClearTax, Quicko).
  - Allowed to integrate full API capabilities (Form 16 auto-parse, AIS/26AS live sync, Aadhaar OTP trigger, and bulk return submission).
* **Category II (Chartered Accountants / CA Firms / Corporate ERIs)**:
  - Individual Chartered Accountants, Partnership Firms, or Corporate Employers authorized to file returns on behalf of clients/employees.

---

## 📋 2. Prerequisites for ERI Registration

Before applying on the ITD Portal, ensure you have:

1. **Entity Registration**: Company incorporated in India (Private Limited, Public Limited, or LLP).
2. **Class 3 Organizational Digital Signature Certificate (DSC)**: Class 3 Signing & Encryption Certificate issued by a licensed Certifying Authority (e.g., eMudhra, Capricorn, Vsign) registered in the name of the Authorized Signatory / Director.
3. **ISO 27001 Security Certification**: Information Security Management System (ISMS) audit certificate for handling financial data securely.
4. **Static Public IP Address**: Dedicated static IPv4 address for server IP whitelisting on the ITD Firewall.
5. **PAN & TAN**: Entity PAN registered on the e-filing portal.

---

## 🚀 3. Step-by-Step Registration Process on `incometax.gov.in`

### Step 3.1: Register Entity on ITD Portal
1. Visit the Income Tax Portal: [`https://eportal.incometax.gov.in/`](https://eportal.incometax.gov.in/).
2. Log in using the Entity's **PAN** and password.
3. Register the **Class 3 Organizational DSC** under `My Profile -> Register DSC`.

### Step 3.2: Submit ERI Registration Application
1. Navigate to **My Account** -> **Register as ERI (E-Filing Resource Intermediary)**.
2. Select **Category I (Software Developer)** or **Category II (CA / Corporate Intermediary)**.
3. Upload required documents:
   - Certificate of Incorporation (CoI).
   - ISO 27001 Security Audit Compliance Report.
   - Board Resolution authorizing the Signatory.
   - Static Server Public IP addresses.
4. Digital Sign the application using your registered Class 3 DSC.

### Step 3.3: ITD Verification & Staging Credentials
1. The Income Tax Department ERI Cell reviews the application within **7 to 14 business days**.
2. Upon approval, ITD dispatches:
   - **Staging ERI Client ID**.
   - **Staging ERI Client Secret**.
   - Access to the ITD Sandbox Endpoint: `https://eportal-sandbox.incometax.gov.in/iec/foservices/v1`.

---

## 🧪 4. Staging Testing & Security Audit Submission

1. **Sandbox Testing**:
   - Test authentication, AIS sync, Aadhaar OTP trigger, and ITR JSON validation using mock test PANs provided by ITD.
2. **Vulnerability Assessment & Penetration Testing (VAPT)**:
   - Conduct a VAPT audit via a CERT-In empanelled auditor.
3. **Submit Completion Report**:
   - Upload the VAPT Clearance Certificate and test execution logs to the ITD ERI portal.

---

## 🟢 5. Production Go-Live & Credential Setup

Once ITD grants final production approval:

1. ITD issues your **Production Client ID** & **Production Client Secret**.
2. ITD whitelists your **Static Server Public IP**.
3. Configure the credentials in TaxBuddy's **ITD Setup Dashboard**:
   - Open `http://localhost:5000/itd-config.html`.
   - Enter `ITD_ERI_CLIENT_ID` and `ITD_ERI_CLIENT_SECRET`.
   - Specify your PFX Certificate file path and passphrase.
   - Switch mode from `SANDBOX` to `PRODUCTION`.

---

## 🛠️ 6. ITD Gateway Architecture in Codebase

The backend implementation is located in:
- Gateway Engine: [`itd_gateway.js`](file:///C:/Users/HI/.gemini/antigravity-ide/scratch/taxbuddy-clone/itd_gateway.js)
- Server Integration: [`server.js`](file:///C:/Users/HI/.gemini/antigravity-ide/scratch/taxbuddy-clone/server.js)
- Config Dashboard: [`public/itd-config.html`](file:///C:/Users/HI/.gemini/antigravity-ide/scratch/taxbuddy-clone/public/itd-config.html)
