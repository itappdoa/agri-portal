/**
 * ============================================================
 *  AGRI PORTAL — GOOGLE APPS SCRIPT BACKEND
 *  Agriculture Department IT Cell, Government of Kerala
 * ============================================================
 *
 *  SETUP INSTRUCTIONS:
 *  1. Go to script.google.com
 *  2. Create a new project named "AgriPortal"
 *  3. Paste this entire file as Code.gs
 *  4. Replace SHEET_ID below with your Google Sheet ID
 *  5. Deploy → New Deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone (for portal) or Anyone with Google Account (for admin)
 *  6. Copy the Web App URL
 *
 *  GOOGLE SHEET STRUCTURE:
 *  Sheet name: "Apps"
 *  Columns: id | name | desc | url | icon | category | date
 * ============================================================
 */

const SHEET_ID   = "YOUR_GOOGLE_SHEET_ID_HERE";   // ← REPLACE THIS
const SHEET_NAME = "Apps";
const ADMIN_SHEET = "Admins";

// ============================================================
//  WEB APP ENTRY POINTS
// ============================================================

function doGet(e) {
  const action = e.parameter.action || "home";

  if (action === "getApps") {
    return jsonResponse(getApps());
  }

  // Serve the portal HTML
  return HtmlService
    .createHtmlOutputFromFile("index")
    .setTitle("AgriTech Portal — Agriculture Department IT Cell")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // Auth check for write operations
    if (["addApp","updateApp","deleteApp","addAdmin","deleteAdmin"].includes(action)) {
      if (!isAuthorized(data.email, data.token)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    switch (action) {
      case "login":       return jsonResponse(handleLogin(data));
      case "getApps":     return jsonResponse(getApps());
      case "addApp":      return jsonResponse(addApp(data.app));
      case "updateApp":   return jsonResponse(updateApp(data.app));
      case "deleteApp":   return jsonResponse(deleteApp(data.id));
      case "addAdmin":    return jsonResponse(addAdmin(data.admin));
      case "deleteAdmin": return jsonResponse(deleteAdmin(data.email));
      default:            return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch(err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ============================================================
//  APPS CRUD
// ============================================================

function getApps() {
  const sheet = getSheet(SHEET_NAME);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length < 2) return { apps: [] };

  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const apps = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  }).filter(a => a.name || a.app_name);

  return { apps };
}

function addApp(app) {
  const sheet = getSheet(SHEET_NAME);
  ensureHeaders(sheet);
  const id = Date.now().toString();
  sheet.appendRow([
    id,
    app.name    || "",
    app.desc    || "",
    app.url     || "",
    app.icon    || "",
    app.category|| "",
    app.date    || new Date().toISOString().split("T")[0],
  ]);
  return { success: true, id };
}

function updateApp(app) {
  const sheet = getSheet(SHEET_NAME);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(app.id)) {
      sheet.getRange(i+1, 1, 1, 7).setValues([[
        app.id, app.name, app.desc, app.url, app.icon, app.category, app.date
      ]]);
      return { success: true };
    }
  }
  return { error: "App not found" };
}

function deleteApp(id) {
  const sheet = getSheet(SHEET_NAME);
  const rows  = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: "App not found" };
}

// ============================================================
//  AUTHENTICATION
// ============================================================

function handleLogin(data) {
  const adminSheet = getSheet(ADMIN_SHEET);
  const rows = adminSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const email = String(rows[i][0]).trim();
    const pass  = String(rows[i][1]).trim();
    if (email === data.email && pass === data.password) {
      // Generate simple session token
      const token = Utilities.base64Encode(email + ":" + Date.now());
      // Store token in sheet (col 3)
      adminSheet.getRange(i+1, 3).setValue(token);
      adminSheet.getRange(i+1, 4).setValue(new Date());
      return { success: true, token, name: rows[i][2] || email };
    }
  }
  return { error: "Invalid credentials" };
}

function isAuthorized(email, token) {
  if (!email || !token) return false;
  const adminSheet = getSheet(ADMIN_SHEET);
  const rows = adminSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === email && String(rows[i][2]).trim() === token) {
      return true;
    }
  }
  return false;
}

function addAdmin(admin) {
  const sheet = getSheet(ADMIN_SHEET);
  ensureAdminHeaders(sheet);
  sheet.appendRow([admin.email, admin.password, admin.name || "", "", ""]);
  return { success: true };
}

function deleteAdmin(email) {
  const sheet = getSheet(ADMIN_SHEET);
  const rows  = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).trim() === email) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: "Admin not found" };
}

// ============================================================
//  HELPERS
// ============================================================

function getSheet(name) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEET_NAME)  ensureHeaders(sheet);
    if (name === ADMIN_SHEET) ensureAdminHeaders(sheet);
  }
  return sheet;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id","name","desc","url","icon","category","date"]);
    sheet.getRange(1,1,1,7).setFontWeight("bold").setBackground("#1a3a2a").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 250);
  }
}

function ensureAdminHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["email","password","name","token","last_login"]);
    sheet.getRange(1,1,1,5).setFontWeight("bold").setBackground("#1a3a2a").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    // Add default super admin
    sheet.appendRow(["admin@agri.kerala.gov.in","AgriAdmin@2025","Super Admin","",""]);
  }
}

function jsonResponse(data, code) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * ONE-TIME SETUP: Run this manually to initialise the sheet
 */
function setupSheet() {
  const appsSheet  = getSheet(SHEET_NAME);
  const adminSheet = getSheet(ADMIN_SHEET);
  Logger.log("Setup complete. Sheets initialized.");

  // Add sample apps
  const samples = [
    ["1","Crop Disease Tracker","Monitor and report crop disease outbreaks","https://example.gov.in/crop","🌾","field","2025-06-10"],
    ["2","Farmer Registration MIS","Central MIS for farmer data and land records","https://example.gov.in/farmer","👨‍🌾","field","2025-05-22"],
    ["3","Subsidy Disbursement Portal","Track agricultural subsidy disbursements","https://example.gov.in/subsidy","💰","finance","2025-05-18"],
  ];
  if (appsSheet.getLastRow() === 1) {
    samples.forEach(row => appsSheet.appendRow(row));
    Logger.log("Sample apps added.");
  }
}
