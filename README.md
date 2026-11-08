# TCMS — Transmission Case Management System
### CDC Share Registrar Services Limited (CDCSR)

An enterprise-grade workflow and records management system built for **CDC Share Registrar Services Limited** to track, audit, and execute physical share transmissions across 215 Pakistan Stock Exchange (PSX) listed client companies and 340,000+ shareholder portfolios.

---

## 🏛 System Highlights & Architecture

- **13,259 Transmission Cases**: Unified tracking across Active Pending (305), Under Review (2,983), Awaiting Legal Heirs (6,322), Issuer Approvals (363), and Closed/Transmitted (3,182).
- **Enterprise Role-Based Access Control (RBAC)**:
  - **ADMIN (Lead/Manager)**: Full access to master database upload, account administration, unmasked PII, and system configuration.
  - **STAFF (Operations Team)**: Daily case updates, inquiry, letter generation, physical filing, and management reports.
- **Privacy & PII Masking**: Customer CNIC numbers and postal addresses are masked (`42101-*******-1`, `House ***, Clifton, Karachi`) for staff operators to maintain regulatory compliance.
- **Server-Powered Multimodal AI Vision**: Parses scanned physical letters and transfer documents using Google Gemini 2.5 Flash without exposing credentials in client-side bundles.
- **Official Formal Letter Engine**:
  - 6 dedicated templates: Fast Letter, Various Folios, Physical Approval, Delivery of Shares, Delivery of Cheques, CDS Account.
  - Instant Word (`.docx`) file generation and crisp A4 browser printing (strictly no letterhead, designed for pre-printed corporate stationery).
- **Physical Filing Archive**: Tracks folder capacities (50 cases max per folder) and shelf location numbers.
- **PostgreSQL Ready (Prisma ORM)**: Includes enterprise schema (`User`, `Case`, `Shareholder`, `Company`, `DailyRegister`, `FilingRecord`, `AuditTrail`) with migration & seeding scripts.

---

## 👥 Default Operator Accounts

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Project Lead & Master Admin** | `admin` | `tcms@cdcsr2026` | Full Admin + User Management + Database Overwrite |
| **Team Lead** | `staff1` | `cdcsr@staff1` | Operations + Letter Generation + Case Master |
| **Senior Officer Transmission** | `staff2` | `cdcsr@staff2` | Operations + Letter Generation + Case Master |
| **Transmission Officer** | `staff3` | `cdcsr@staff3` | Operations + Letter Generation + Case Master |
| **Filing & Vault Officer** | `staff4` | `cdcsr@staff4` | Operations + Physical Filing Archive |

> **Note**: Passwords can be changed by the Administrator anytime directly via the **Administration** (`/admin`) panel.

---

## 🚀 Environment Variables

Create `.env.local` or configure in your Vercel Project Settings:

```env
# Server-only Gemini Vision API Key for OCR Letter Parsing
GEMINI_API_KEY=your_gemini_api_key_here

# 32+ character secret for HMAC session signature
SESSION_SECRET=your_secure_random_session_secret_min_32_chars

# Optional: PostgreSQL Database connection string
DATABASE_URL=postgresql://user:password@host:5432/tcms?sslmode=require
```

---

## 🛠 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ZaheerYounus/TCMS.git
   cd TCMS/stms-app
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000). You will be automatically redirected to `/login`.

---

## 🗄 Database Seeding (PostgreSQL)

When connecting a live PostgreSQL database:

```bash
# Push schema to database
npx prisma db push

# Seed users and cases from JSON
npx ts-node scripts/seed-database.ts
```

---

## 🔒 Security Best Practices

1. **Private Repository**: It is strongly recommended to set this GitHub repository to **Private** in GitHub Settings -> Danger Zone -> Change visibility -> Private.
2. **Scrubbing Past Git Commits**:
   To purge past commits that contained JSON files before untracking:
   ```bash
   # Using git-filter-repo
   git filter-repo --path src/data/misRecords.json --invert-paths --force
   git filter-repo --path src/data/shareholdersSample.json --invert-paths --force
   ```
3. **HTTP-Only Cookies**: User sessions use `SameSite=Lax`, `HttpOnly` and `Secure` cookies with PBKDF2 password hashes (100,000 iterations).

---

## 📄 License & Proprietary Notice

Proprietary software developed for **CDC Share Registrar Services Limited**. All rights reserved.
