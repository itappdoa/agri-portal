/**
 * AGRI PORTAL — DATA LAYER
 * ========================
 * Configure your Google Sheets published CSV URL below.
 * If left empty, the portal uses the sample data.
 * 
 * HOW TO GET YOUR SHEET URL:
 * 1. Open your Google Sheet
 * 2. File → Share → Publish to web
 * 3. Select "Comma-separated values (.csv)" for your data sheet
 * 4. Copy the URL and paste it below
 */

const CONFIG = {
  // Paste your Google Sheet published CSV URL here:
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQn5xVj61E_63PvxkFHfNfq3Pg-XpprcO2bEnonzQZv3OoQgvAscBWL_7wltvIsKRyI_WF85mk5Yrm4/pub?output=csv",   // e.g. "https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0"
  API_URL: "https://script.google.com/macros/s/AKfycbwTFslOra6l_N082o_aYOnKqTEEYeB0DiFtkAbz-QyPZ7qWRCBl8zeYocqQQmONGHAGpA/exec"
    
  // Admin credentials (stored locally for demo; use Google OAuth for production)
  ADMIN_EMAIL: "admin@agri.kerala.gov.in",
  ADMIN_PASSWORD: "AgriAdmin@2025",   // CHANGE THIS

  // Department info (shown in footer)
  DEPT_NAME: "Agriculture Department, Government of Kerala",
  PORTAL_TITLE: "AgriTech Internal Portal",
};

/**
 * SAMPLE APPLICATION DATA
 * Replace with Google Sheets data in production.
 * Fields: id, name, desc, url, icon, category, date
 */
const SAMPLE_APPS = [
  {
    id: "1",
    name: "Crop Disease Tracker",
    desc: "Monitor and report crop disease outbreaks across districts. AI-assisted identification and spread prediction.",
    url: "https://example.gov.in/crop-disease",
    icon: "🌾",
    category: "field",
    date: "2025-06-10",
  },
  {
    id: "2",
    name: "Farmer Registration MIS",
    desc: "Central Management Information System for farmer registration, land records, and beneficiary tracking.",
    url: "https://example.gov.in/farmer-mis",
    icon: "👨‍🌾",
    category: "field",
    date: "2025-05-22",
  },
  {
    id: "3",
    name: "Subsidy Disbursement Portal",
    desc: "Track and process agricultural subsidy disbursements. Real-time payment status and reconciliation reports.",
    url: "https://example.gov.in/subsidy",
    icon: "💰",
    category: "finance",
    date: "2025-05-18",
  },
  {
    id: "4",
    name: "Soil Health Dashboard",
    desc: "District-wise soil health card data, lab reports, nutrient deficiency maps, and remediation advisories.",
    url: "https://example.gov.in/soil-health",
    icon: "🌱",
    category: "monitoring",
    date: "2025-06-01",
  },
  {
    id: "5",
    name: "Weather & Agro Advisory",
    desc: "Real-time agrometeorological data integrated with IMD. Block-level weather alerts for farmers.",
    url: "https://example.gov.in/weather",
    icon: "🌤️",
    category: "monitoring",
    date: "2025-04-30",
  },
  {
    id: "6",
    name: "Staff Attendance System",
    desc: "Biometric attendance tracking for all field staff and office personnel across Kerala.",
    url: "https://example.gov.in/attendance",
    icon: "🕐",
    category: "hr",
    date: "2025-06-05",
  },
  {
    id: "7",
    name: "Budget & Expenditure MIS",
    desc: "Real-time budget utilisation reports, scheme-wise expenditure tracking, and treasury integration.",
    url: "https://example.gov.in/budget",
    icon: "📊",
    category: "finance",
    date: "2025-05-10",
  },
  {
    id: "8",
    name: "Irrigation Monitoring",
    desc: "Canal water level sensors, pump station status, and irrigation demand forecasting across districts.",
    url: "https://example.gov.in/irrigation",
    icon: "💧",
    category: "monitoring",
    date: "2025-06-08",
  },
  {
    id: "9",
    name: "Monthly Returns Portal",
    desc: "Submit and track monthly performance reports, field visit logs, and statistical returns online.",
    url: "https://example.gov.in/returns",
    icon: "📋",
    category: "reports",
    date: "2025-06-12",
  },
  {
    id: "10",
    name: "Market Price Intelligence",
    desc: "Live commodity price aggregation from APMC markets across Kerala with trend analysis.",
    url: "https://example.gov.in/market-price",
    icon: "📈",
    category: "monitoring",
    date: "2025-06-14",
  },
  {
    id: "11",
    name: "Pesticide License Tracker",
    desc: "Issue, renew, and track pesticide dealer licenses, inspections, and compliance certificates.",
    url: "https://example.gov.in/pesticide",
    icon: "🔬",
    category: "field",
    date: "2025-05-28",
  },
  {
    id: "12",
    name: "HR Service Book",
    desc: "Digital service records, leave management, transfers, and promotions for all department employees.",
    url: "https://example.gov.in/hr",
    icon: "👥",
    category: "hr",
    date: "2025-05-15",
  },
];

// ---- Icon Color Palette for auto-generated icons ----
const ICON_COLORS = [
  ["#2d6a4f","#52b788"],
  ["#1a3a2a","#95d5b2"],
  ["#a05c00","#e8b84b"],
  ["#3a6b1a","#8bc34a"],
  ["#1a5a4a","#48b89a"],
  ["#6b3a1a","#e89448"],
  ["#2a3a6b","#6a8be8"],
  ["#4a1a6b","#b86ae8"],
];

function getIconColor(name) {
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffff;
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
}

function getInitials(name) {
  return name.split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

// ---- Load apps from Google Sheet or localStorage fallback ----
async function loadApps() {
  // Check for admin-saved apps in localStorage
  const saved = localStorage.getItem("agri_portal_apps");
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }

  // Try Google Sheet CSV if configured
  if (CONFIG.SHEET_CSV_URL) {
    try {
      const res = await fetch(CONFIG.SHEET_CSV_URL);
      const text = await res.text();
      return parseSheetCSV(text);
    } catch (e) {
      console.warn("Sheet load failed, using sample data:", e);
    }
  }

  return SAMPLE_APPS;
}

// ---- Parse CSV from Google Sheet ----
function parseSheetCSV(csv) {
  const rows = csv.trim().split("\n");
  const headers = rows[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g,"_").replace(/['"]/g,""));
  return rows.slice(1).map((row, i) => {
    const cols = row.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,))/g) || [];
    const obj = { id: String(i + 1) };
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  }).filter(r => r.name || r.app_name);
}

// ---- Save apps (admin) ----
function saveApps(apps) {
  localStorage.setItem("agri_portal_apps", JSON.stringify(apps));
}

// ---- Category labels ----
const CAT_LABELS = {
  field:      "Field Tools",
  finance:    "Finance",
  monitoring: "Monitoring",
  hr:         "HR & Admin",
  reports:    "Reports",
};
