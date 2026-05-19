# Welcome Onboarding — NCF Blockchain Grade Recording

Welcome! This guide walks you through the system in a simple, **step‑by‑step onboarding flow**.

---

## 1) Get started (first time opening the app)

1. Open the app in your browser: `http://localhost:3000`
2. On the left sidebar, choose your role:
   - **Dean** — full access
   - **Instructor** — only your assigned classes

> In production, the role buttons are replaced by a real login.

---

## 2) Your first task as an Instructor

### ✅ Step 1 — Go to “Upload grades”
Click **Upload grades** on the sidebar.

### ✅ Step 2 — Choose the subject and grading period
Select your **Subject** and **Grade period** (Prelim, Midterm, Semi‑Final, Final).

### ✅ Step 3 — Upload your grade file
The system accepts:
- **CSV / Excel** (best accuracy)
- **PDF / Word** (text extraction)
- **Photo / Scan** (OCR)

Accepted files:
`.csv`, `.xlsx`, `.xls`, `.pdf`, `.docx`, `.doc`, `.jpg`, `.jpeg`, `.png`

---

## 3) If you upload a photo/scan (OCR preview)

The system will:
- Read the text automatically (OCR)
- Highlight **grade columns** on the image
- Show a **confidence score** and warnings

✅ If confidence is low or warnings appear, review carefully before continuing.

---

## 4) Review the grades (before committing)

1. The system shows detected grades.
2. You can edit values manually.
3. When correct, click **Commit to blockchain**.

⚠️ After committing, grades **cannot be changed or deleted**.

---

## 5) Official grade sheet templates

The system checks if your file matches official formats.

### Official Template — v1 (default)
Required headers:
`student_id`, `name`, `prelim`, `midterm`, `semi`, `final`

### Official Template — v2
Required headers:
`student_id`, `name`, `prelim`, `midterm`, `final`

If you see **Template mismatch**, rename your columns to match.

---

## 6) What the Dean sees

The Dean can access:
- **All Grades** — full student grade list
- **Submissions** — upload history
- **Ledger** — blockchain records
- **Verify** — check if a record matches blockchain data

---

## 7) Common warnings (and quick fixes)

| Warning | What it means | What to do |
|--------|----------------|-----------|
| Header not detected | Column names not found | Use the official template headers |
| Missing Student ID | A row has no ID | Fill in `student_id` |
| Low OCR confidence | Scan quality is poor | Re‑scan or use CSV/Excel |
| Template mismatch | Columns don’t match | Rename columns to match |

---

## 8) OCR tips (to get better results)

- Use **clear, high‑resolution** photos
- Keep the paper **flat and straight**
- Avoid shadows and glare
- Use **CSV/Excel** whenever possible

---

## 9) Need help or customization?

For system setup and data files, see:
- `src/components/pages/Upload.jsx`
- `src/data/appData.js`
