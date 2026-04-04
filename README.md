# 🌿 AgriTech Internal Portal
### Agriculture Department IT Cell — Government of Kerala

A professional, modern internal web portal for accessing all department applications from one secure gateway.

---

## 📁 Folder Structure

```
agri-portal/
│
├── index.html                  ← Main portal homepage
├── css/
│   └── style.css               ← All styles
├── js/
│   ├── data.js                 ← Data layer (config, sample data, helpers)
│   └── app.js                  ← Portal logic (search, filters, render, canvas)
├── admin/
│   ├── login.html              ← Admin login page
│   └── panel.html              ← Admin dashboard (CRUD)
└── google-apps-script/
    └── Code.gs                 ← Backend for Google Apps Script deployment
```

---

## 🚀 Quick Start (GitHub Pages — Easiest)

### Step 1 — Upload to GitHub
1. Go to [github.com](https://github.com) → New repository
2. Name it `agri-portal` → Public
3. Upload all files maintaining the folder structure above
4. Settings → Pages → Source: `main` branch, `/ (root)` folder → Save

Your portal will be live at:
`https://YOUR-USERNAME.github.io/agri-portal/`

---

## 🔐 Admin Login

**Default credentials** (change immediately after first login):
- Email: `admin@agri.kerala.gov.in`
- Password: `AgriAdmin@2025`

> ⚠️ To change: Open `js/data.js` → Edit `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### Admin Panel URL
`https://your-portal-url/admin/login.html`

---

## 📊 Connecting Google Sheets (Recommended)

### Option A — Published CSV (No-code, Easy)

1. Create a Google Sheet with these columns in Row 1:
   ```
   id | name | desc | url | icon | category | date
   ```

2. Add your apps in subsequent rows

3. **Publish the sheet:**
   - File → Share → Publish to web
   - Select your sheet tab → Comma-separated values (.csv)
   - Click **Publish** → Copy the URL

4. Open `js/data.js` → Paste the URL:
   ```javascript
   SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0",
   ```

5. Done! The portal will now load apps from your sheet.

---

### Option B — Google Apps Script (Full Backend)

1. Go to [script.google.com](https://script.google.com)
2. New Project → name it **AgriPortal Backend**
3. Paste the contents of `google-apps-script/Code.gs`
4. Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your Sheet ID
   - (Sheet ID is in the URL: `docs.google.com/spreadsheets/d/`**THIS_PART**`/edit`)
5. Click **Run → setupSheet()** (first time only, to initialise)
6. **Deploy → New Deployment:**
   - Type: Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the Web App URL

---

## ➕ Adding App Cards (Two Ways)

### Way 1 — Admin Panel (Recommended for staff)
1. Go to `your-portal/admin/login.html`
2. Sign in with admin credentials
3. Click **+ Add New App**
4. Fill in: App Name, Description, URL, Icon/Emoji, Category
5. Click **Save Application**

### Way 2 — Google Sheet (For bulk additions)
Open your Google Sheet and add a row:
| id | name | desc | url | icon | category | date |
|----|------|------|-----|------|----------|------|
| 13 | New App | Description here | https://example.gov.in | 🌿 | field | 2025-06-15 |

**Icon field accepts:**
- A single emoji: `🌾`
- A full image URL: `https://example.com/icon.png`
- Leave blank → auto-generates a coloured letter icon

**Category values:**
- `field` → Field Tools
- `finance` → Finance
- `monitoring` → Monitoring
- `hr` → HR & Admin
- `reports` → Reports

---

## 👤 Adding New Admin Users

### Via Admin Panel
1. Log in → Click **Manage Admins** in sidebar
2. Click **+ Add Admin**
3. Enter name, email, and password
4. Click **Add Admin**

### Via data.js (permanent backup)
Open `js/data.js` and modify the `ADMIN_EMAIL` / `ADMIN_PASSWORD` section. For multiple admins, the panel stores them in the browser's localStorage.

> **Note:** In the GitHub Pages version, admin data is stored in the browser's localStorage. For a shared team admin panel, use the Google Apps Script backend which stores everything in your Google Sheet.

---

## 🔧 Configuration Options

Open `js/data.js` to customize:

```javascript
const CONFIG = {
  SHEET_CSV_URL: "",              // Google Sheet published CSV URL
  ADMIN_EMAIL: "admin@agri.kerala.gov.in",
  ADMIN_PASSWORD: "AgriAdmin@2025",  // CHANGE THIS!
  DEPT_NAME: "Agriculture Department, Government of Kerala",
  PORTAL_TITLE: "AgriTech Internal Portal",
};
```

---

## 🌐 Deployment Options

| Method | Difficulty | Best For |
|--------|-----------|----------|
| GitHub Pages | ⭐ Easy | Static hosting, free, fast |
| Google Apps Script | ⭐⭐ Medium | Full backend, Google Workspace |
| Firebase Hosting | ⭐⭐ Medium | Scalable, fast CDN |
| Any web server | ⭐ Easy | Internal network hosting |

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project, set public dir to agri-portal/
firebase deploy
```

---

## 🎨 Customization

### Change Department Name & Colors
- Department name: Edit `js/data.js` → `DEPT_NAME`
- Colors: Edit `css/style.css` → `:root` variables at the top

### Add New Category
1. In `css/style.css` — no changes needed
2. In `index.html` → Add a filter button:
   ```html
   <button class="filter-btn" data-cat="seeds">Seed Division</button>
   ```
3. In `js/data.js` → Add to `CAT_LABELS`:
   ```javascript
   seeds: "Seed Division",
   ```

---

## 🔒 Security Notes

- Admin credentials in `data.js` are visible in browser source (adequate for internal networks)
- For internet-facing deployment, use Google Apps Script backend with proper auth
- Enable Google Workspace SSO for production use
- All sessions expire after 8 hours automatically
- Restrict admin URL access via `.htaccess` or network firewall for sensitive deployments

---

## 📞 Support

For IT Cell staff needing help:
1. Open the browser console (F12 → Console)
2. Check for any red error messages
3. Contact the IT Cell with the error details

---

## 📝 Change Log

| Version | Date | Change |
|---------|------|--------|
| 2.0 | Jun 2025 | Full rebuild with admin panel, animations, search |
| 1.0 | Jan 2025 | Initial release |

---

*Built for Agriculture Department IT Cell, Government of Kerala*
*For official use only. Unauthorized access is prohibited.*
