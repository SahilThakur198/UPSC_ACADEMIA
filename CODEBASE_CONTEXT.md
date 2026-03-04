# 🧠 Codebase Context
> Auto-maintained by AI. Last updated: 2026-03-04

---

## 🎯 Project Purpose

UPSC Academia is a **static marketing + functional web app** for a civil services coaching institute in Pune, India. It serves as both the public-facing website (courses, facilities, contact) and an operational backend system for student lead capture, admitted student registration, a staff portal, and study notes distribution.

**Status**: Active Development

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | HTML5, Vanilla JavaScript (ES6+), Google Apps Script |
| Styling | Vanilla CSS3 (custom properties, grid, flexbox) |
| Backend | Google Apps Script (Code.gs) deployed as a Web App |
| Database | Google Sheets (via Spreadsheet API in Apps Script) |
| File Storage | Google Drive (via DriveApp in Apps Script) |
| Hosting | GitHub Pages (via `.github/workflows/static.yml`) |
| Fonts | Google Fonts (Inter, Kalam) |
| Icons | Font Awesome 6 |

---

## 🏗 Architecture

**Pattern**: Multi-Page Static Site + Serverless Backend (Google Apps Script)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (GitHub Pages)                     │
│                                                                  │
│  index.html  enroll.html  login.html  admitted-registration.html │
│  view_notes.html                                                 │
│          │                    │                                  │
│    script.js             login.html (inline JS)                  │
│    (shared logic)                                                │
│          │                    │                                  │
│      config.js ──────────────────────────────────────────────── ▶│
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS fetch (GET/POST)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              Google Apps Script (Code.gs)                        │
│  doGet / doPost ──▶ handleApiRequest ──▶ switch(action)          │
│                                                                  │
│  Actions: signup, login, enroll, getLeads, upload, deleteFile,   │
│           getFiles, download, forgotPassword, verifyOTP,         │
│           verifyMahajyoti, registerAdmitted, getRegistrations    │
│                    │                    │                        │
│             Google Sheets        Google Drive                    │
│             (SPREADSHEET_ID)      (FOLDER_ID)                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Module Map

```
project-root/
├── index.html                  # Main public website (hero, about, services, facilities, FAQ, contact)
├── enroll.html                 # Demo class booking / enrollment form
├── login.html                  # Staff portal (auth + dashboard: leads + registrations tabs)
├── admitted-registration.html  # 3-step online registration flow for admitted Mahajyoti students
├── view_notes.html             # Students' study notes viewer (fetches from Google Drive)
├── header.html                 # Shared reusable navbar component (injected via JS fetch)
├── footer.html                 # Shared reusable footer component (injected via JS fetch)
├── style.css                   # Global stylesheet (~52KB) — all page styles, variables, animations
├── script.js                   # Shared JS (~37KB) — routing, all page init, API calls
├── config.js                   # Single source of truth for the Apps Script Web App URL
├── Code.gs                     # Google Apps Script backend — full API + Sheets + Drive + Mail
├── sitemap.xml                 # SEO sitemap
├── robots.txt                  # SEO robots file
├── img/                        # Images: logo, director photo, app logos, whatsapp icon
├── .github/workflows/
│   └── static.yml              # GitHub Actions: deploys to GitHub Pages on push to main
└── .agent/
    ├── workflows/              # Agent workflows (debug, seo)
    └── Skills/                 # Agent skills (code-docs, codebase-context)
```

**Critical Modules** (touch with care):
- `Code.gs` — single backend file; all API logic lives here. Redeploy required after any change.
- `config.js` — changing `SCRIPT_URL` affects ALL pages simultaneously.
- `style.css` — global CSS; changes affect all 5 HTML pages.
- `script.js` — page routing by `document.body.id`; wrong body IDs will silently break pages.

---

## 🔄 Data Flow

### 1. Demo Class Enrollment Flow
```
User fills enroll.html form
    ↓ script.js: initEnrollSubmission()
POST to APPS_SCRIPT_URL { action: 'enroll', data: {...} }
    ↓ Code.gs: processEnrollment()
Google Sheets 'Leads' tab ← appended row
Google MailApp → confirmation email (Marathi + HTML) sent to student
    ↓ response: { success: true }
script.js: showPopup("Enrollment submitted successfully!")
```

### 2. Admitted Student Registration Flow (3-Step)
```
Step 1: Student enters Mahajyoti Reg ID
    ↓ GET ?action=verifyMahajyoti&mid=XXX
    ↓ Code.gs: verifyMahajyotiId() → checks student_registration sheet
    ↓ Returns: { exists, already_registered, data: {...student fields} }
Step 2: Student fills WhatsApp, email, address form (pre-filled readonly fields from Step 1)
    ↓ POST { action: 'registerAdmitted', data: {...} }
    ↓ Code.gs: processAdmittedRegistration() → updates row in sheet
Step 3: Join WhatsApp + Telegram group links displayed
```

### 3. Staff Portal Flow
```
Staff opens login.html
    ↓ Signup/Login → POST { action: 'signup'/'login' }
    ↓ Code.gs: processSignup() / processLogin()
    ↓ google Sheets 'Users' tab — Admin_consent must = '1' to allow login
Staff Dashboard (post-login)
    ↓ GET ?action=getLeads → displays Leads table
    ↓ GET ?action=getRegistrations → displays student_registration table
File Upload: POST { action: 'upload', base64Data, fileName }
    → DriveApp.createFile() → FOLDER_ID
```

### 4. Notes Page Flow
```
User visits view_notes.html
    ↓ script.js: initNotesPage()
    ↓ GET ?action=getFiles → Code.gs: getFilesFromDrive()
    ↓ Returns file list from FOLDER_ID
Notes rendered with View + Download buttons
Download: GET ?action=download&id=FILE_ID → returns base64 blob → browser download
```

---

## ⚙️ Key Functions & Classes

| Name | Location | Purpose | Called By |
|------|----------|---------|-----------| 
| `handleApiRequest` | `Code.gs:42` | Routes all API calls via switch(action) | `doGet`, `doPost` |
| `verifyMahajyotiId` | `Code.gs:678` | Validates Reg ID, checks duplicate registration | `processAdmittedRegistration`, frontend |
| `processAdmittedRegistration` | `Code.gs:748` | Updates student row with online reg data | API router |
| `getRegistrationsFromSheet` | `Code.gs:601` | Returns online-registered students for staff | API router |
| `sendEnrollmentConfirmation` | `Code.gs:429` | Sends Marathi HTML email after enrollment | `processEnrollment` |
| `initAdmittedRegistration` | `script.js:732` | Drives the 3-step registration UI | DOMContentLoaded |
| `initEnrollSubmission` | `script.js:670` | Handles enroll form submit + validation | DOMContentLoaded |
| `initNotesPage` | `script.js:416` | Fetches and renders notes from Drive | DOMContentLoaded |
| `loadLayoutComponents` | `script.js:47` | Fetches header.html + footer.html via fetch() | DOMContentLoaded |
| `showPopup` | `script.js:642` | Toast notification (success/error) | Many |
| `validatePhoneNumber` | `script.js:626` | Validates 10-digit Indian mobile (starts 6-9) | `initEnrollSubmission` |
| `throttle` | `script.js:229` | Throttle utility for scroll/mouse events | `initScrollEffects`, `initParticleAnimation` |
| `optimizeForMobile` | `script.js:359` | Android-specific viewport and performance fixes | DOMContentLoaded |

---

## 🔌 External Integrations

| Service | How It's Used | Auth Method | Config Key |
|---------|--------------|-------------|------------|
| Google Apps Script | Main backend API (doGet/doPost) | Public Web App URL | `config.js: SCRIPT_URL` |
| Google Sheets | All data storage (Leads, Users, student_registration) | GAS service (no key needed serverside) | `Code.gs: SPREADSHEET_ID` |
| Google Drive | Study notes file storage + retrieval | GAS service | `Code.gs: FOLDER_ID` |
| Google MailApp | Enrollment confirmation + OTP emails | GAS service (Gmail of deployer) | Hardcoded BCC: sahiluselessfellow@gmail.com |
| Google Maps Embed | Contact section map | Public embed (no key) | Hardcoded iframe src |
| Google Fonts | Inter, Kalam typography | Public CDN | Hardcoded `<link>` |
| Font Awesome 6 | Icons throughout | Public CDN | Hardcoded `<link>` |
| Play Store | URS Academia App + Optional Hub App links | Public URL | Hardcoded `<a href>` |
| YouTube | Study with Academia channel | Public URL | Hardcoded `<a href>` |
| Telegram | UPSC_Academia_Pune community | Public URL | Hardcoded `<a href>` |
| WhatsApp Channel | Official announcements | Public URL | Hardcoded `<a href>` |

---

## 🧩 Conventions & Patterns

- **Page routing**: Each HTML page sets `<body id="X-page">`. `script.js` reads `document.body.id` in `DOMContentLoaded` and calls the matching `initXPage()` function.
- **API calls**: All backend calls use `fetch(APPS_SCRIPT_URL, {...})`. URL comes from `CONFIG.SCRIPT_URL` via `config.js`.
- **API shape (backend)**: Every Code.gs function returns `{ success: boolean, message?: string, data?: any }`.
- **Error handling**: All GAS functions wrapped in try/catch returning `{ success: false, message: err.toString() }`.
- **Naming**: camelCase for JS functions/variables, kebab-case for CSS classes, snake_case for Google Sheet column headers.
- **CSS variables**: All brand colors defined as `--primary-blue`, `--accent-red` etc. in `:root` in `style.css`.
- **Layout injection**: `header.html` and `footer.html` are fetched and injected via `loadLayoutComponents()` — NOT server-side includes.
- **Mobile optimization**: Android-specific class `android-device` added to `<body>`; `--vh` CSS variable set dynamically; particles disabled on very small screens.
- **Security**: honeypot field `website` checked on `processAdmittedRegistration`. All inputs sanitized with `sanitize()` (strips HTML tags, limits 500 chars).

---

## ⚠️ Known Issues & Tech Debt

- [ ] **Passwords stored in plaintext** in Google Sheets 'Users' tab — no hashing.
- [ ] **OTP returned in verify response** (`password: data[i][2]`) — minor security concern.
- [ ] **No rate limiting** on the GAS API — could be abused for spam enrollment.
- [ ] **BCC email hardcoded** (`sahiluselessfellow@gmail.com`) in `sendEnrollmentConfirmation`.
- [ ] **CORS**: GAS API is fully public — no authentication required for `getLeads`, `getRegistrations`.
- [ ] **`console.log` statements** still present in production `script.js` (e.g., `[v0]` prefix logs).
- [ ] **Particles on desktop only** — reasonable, but particle lifecycle relies on `setTimeout` recursion which is fragile.

---

## 📐 Structural Guidelines

When adding a **new page**:
1. Create `page-name.html` at project root
2. Set `<body id="page-name-page">` with a unique ID
3. Add the corresponding `initPageNamePage()` function in `script.js`
4. Add the `else if (bodyId === 'page-name-page')` branch in the routing block (lines ~29-44 of `script.js`)
5. Include `<script src="config.js">` and `<script src="script.js" defer>` in the HTML
6. Add the page to `sitemap.xml`

When adding a **new API action**:
1. Add a `case 'actionName':` in `handleApiRequest`'s switch statement (`Code.gs:64`)
2. Create the handler function below, returning `{ success: boolean, ... }`
3. Deploy a new version of the GAS Web App (Deploy > Manage Deployments)
4. Test with `?action=actionName` appended to the Script URL

When touching **`style.css`**:
- Check `--primary-blue`, `--accent-red`, `--text-primary` CSS variables before adding new hardcoded colors
- All new page sections should use `.section` and `.container` wrapper pattern

---

## 📜 Changelog

| Date | Change | Affected Modules |
|------|--------|-----------------| 
| 2026-03-04 | Initial CODEBASE_CONTEXT.md created | All |
| 2026-03-02 | Fixed Mahajyoti column header mismatch in staff portal | `Code.gs`, `login.html` |
| 2026-03-01 | Fixed invisible text in readonly admitted-registration fields | `admitted-registration.html` |
| 2026-03-01 | Updated sitemap, fixed SEO issues, replaced placeholder group links | `sitemap.xml`, `admitted-registration.html` |
| 2026-02-28 | Added duplicate registration prevention (already_registered check) | `Code.gs`, `admitted-registration.html` |
| 2026-02-28 | Added 'Registrations' tab to staff portal dashboard | `login.html`, `script.js`, `Code.gs` |
