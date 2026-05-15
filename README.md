# NCF Blockchain Grade Recording System
### College of Engineering — React Web App

---

## 🚀 Setup in VS Code

### 1. Open the folder
```
File → Open Folder → select `ncf-blockchain-grades`
```

### 2. Open the terminal
```
Terminal → New Terminal
```

### 3. Install dependencies
```bash
npm install
```

### 4. Run the app
```bash
npm start
```
The app opens automatically at **http://localhost:3000**

---

## 📁 Folder Structure

```
ncf-blockchain-grades/
├── public/
│   └── index.html
├── src/
│   ├── data/
│   │   └── appData.js          ← All seed data (students, blocks, logs, roles)
│   ├── components/
│   │   ├── Shared.jsx          ← Reusable UI components (Badge, Notice, etc.)
│   │   ├── Sidebar.jsx         ← Navigation sidebar
│   │   ├── SuccessModal.jsx    ← Blockchain commit success modal
│   │   └── pages/
│   │       ├── Dashboard.jsx       ← Dean: overview
│   │       ├── AllGrades.jsx       ← Dean: all grades table
│   │       ├── AllStudents.jsx     ← Dean: all student lists
│   │       ├── Ledger.jsx          ← Blockchain ledger view
│   │       ├── Verify.jsx          ← Grade verification
│   │       ├── Submissions.jsx     ← Dean: full audit log
│   │       ├── Instructors.jsx     ← Dean: instructor management
│   │       ├── MyStudents.jsx      ← Instructor: own students
│   │       ├── Upload.jsx          ← Instructor: upload + commit grades
│   │       └── MySubmissions.jsx   ← Instructor: own logs + chain records
│   ├── App.jsx                 ← Root component (all state management)
│   ├── App.css                 ← All component styles
│   ├── index.js                ← React entry point
│   └── index.css               ← CSS variables + global reset
└── package.json
```

---

## 🔧 How to Edit

### Change student data
Edit `src/data/appData.js` → `INITIAL_STUDENTS` array.

### Add a new instructor
1. Add to `ROLES` in `appData.js`
2. Add their role button in `Sidebar.jsx`
3. Add a filter option in `AllGrades.jsx` and `AllStudents.jsx`

### Connect real file parsing
Edit `src/components/pages/Upload.jsx` → `handleListFile()` and `handleGradeFile()`:

**Excel (.xlsx):**
```bash
npm install xlsx
```
```js
import * as XLSX from 'xlsx';
const reader = new FileReader();
reader.onload = e => {
  const wb = XLSX.read(e.target.result, { type: 'binary' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  // rows = array of objects — map to your student format
};
reader.readAsBinaryString(file);
```

**Word (.docx):**
```bash
npm install mammoth
```
```js
import mammoth from 'mammoth';
const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
const text = result.value; // raw text — parse with regex
```

**CSV:**
```js
const text = await file.text();
const rows = text.split('\n').map(r => r.split(','));
```

**Photo OCR:**
```bash
npm install tesseract.js
```
```js
import Tesseract from 'tesseract.js';
const { data: { text } } = await Tesseract.recognize(file, 'eng');
// parse text with regex to extract names and grades
```

### Connect real blockchain
In `App.jsx` → `handleCommit()`, after generating the hash, send it to your blockchain:
```js
// Example: store hash in your MySQL database
await fetch('/api/commit', {
  method: 'POST',
  body: JSON.stringify({ hash, students: myS, subject, period })
});
```

---

## 👤 Role Switching (Prototype)
Use the buttons at the bottom of the sidebar:
- **Dean** — full access to all students, grades, submissions, instructors
- **E. Reyes** — Civil Engineering instructor (CE 401, CE 301 only)
- **E. Lim** — Electrical Engineering instructor (EE 301 only)

In production, replace role switching with a real **login system** (JWT or session-based auth).

---

## 📦 Dependencies
| Package | Purpose |
|---------|---------|
| react, react-dom | UI framework |
| react-scripts | Dev server + build tool |
| xlsx | Excel file parsing (optional) |
| mammoth | Word (.docx) parsing (optional) |
