/**
 * ============================================================
 *  AGRI PORTAL — GOOGLE APPS SCRIPT BACKEND (Fixed v2)
 *  Agriculture Department IT Cell, Government of Kerala
 * ============================================================
 *
 *  CHANGES IN THIS VERSION:
 *  1. Added setAdmins() — bulk sync admin users to Admins sheet
 *  2. Added "setAdmins" case in doPost switch (WRITE_KEY protected)
 *  3. setApps() added (from previous fix)
 *  4. WRITE_KEY added (from previous fix)
 *
 *  SETUP STEPS:
 *  1. Replace SHEET_ID with your actual Google Sheet ID
 *     (from URL: .../spreadsheets/d/SHEET_ID/edit)
 *  2. Keep WRITE_KEY identical to WRITE_KEY in data.js
 *  3. Deploy → Manage Deployments → Edit → New Version → Deploy
 *     Execute as: Me | Who has access: Anyone
 *  4. Run setupSheet() once manually to create sheet tabs + default admin
 * ============================================================
 */

// ⚠️ REPLACE with your actual Google Sheet ID
const SHEET_ID    = "1EHg04iUwlkE4cTzJYRlk4Hiwu2K-rCFjCYMlDyeeb8o";

const SHEET_NAME  = "Apps";
const ADMIN_SHEET = "Admins";

// ⚠️ Must match WRITE_KEY in data.js
const WRITE_KEY   = "agri-portal-write-2025";

// ============================================================
//  WEB APP ENTRY POINTS
// ============================================================

function doGet(e) {
  const action = e.parameter.action || "home";
  if (action === "getApps") return jsonResponse(getApps());
  return HtmlService
    .createHtmlOutputFromFile("index")
    .setTitle("AgriTech Portal — Agriculture Department IT Cell")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;

    // Token-based auth for individual CRUD operations
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

      // ✅ Bulk replace all apps (called by saveApps() in data.js)
      case "setApps": {
        if (data.key !== WRITE_KEY) return jsonResponse({ error: "Unauthorized" }, 401);
        return jsonResponse(setApps(data.apps));
      }

      // ✅ NEW: Bulk replace all admins (called by saveAdminList() in panel.html)
      case "setAdmins": {
        if (data.key !== WRITE_KEY) return jsonResponse({ error: "Unauthorized" }, 401);
        return jsonResponse(setAdmins(data.admins));
      }

      default: return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
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

// Bulk replace all apps
function setApps(apps) {
  const sheet = getSheet(SHEET_NAME);
  ensureHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  if (apps && apps.length > 0) {
    const rows = apps.map(function(app) {
      return [
        app.id        || Date.now().toString(),
        app.name      || "",
        app.desc      || app.description || "",
        app.url       || "",
        app.icon      || app.image       || "",
        app.category  || "",
        app.date      || new Date().toISOString().split("T")[0],
      ];
    });
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  return { success: true, count: apps ? apps.length : 0 };
}

function addApp(app) {
  const sheet = getSheet(SHEET_NAME);
  ensureHeaders(sheet);
  const id = Date.now().toString();
  sheet.appendRow([id, app.name||"", app.desc||"", app.url||"", app.icon||"", app.category||"", app.date||new Date().toISOString().split("T")[0]]);
  return { success: true, id };
}

function updateApp(app) {
  const sheet = getSheet(SHEET_NAME);
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(app.id)) {
      sheet.getRange(i+1, 1, 1, 7).setValues([[app.id, app.name, app.desc, app.url, app.icon, app.category, app.date]]);
      return { success: true };
    }
  }
  return { error: "App not found" };
}

function deleteApp(id) {
  const sheet = getSheet(SHEET_NAME);
  const rows  = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) { sheet.deleteRow(i+1); return { success: true }; }
  }
  return { error: "App not found" };
}

// ============================================================
//  ADMIN USERS CRUD
// ============================================================

// ✅ NEW: Bulk replace all admins in the Admins sheet
// Called every time an admin is added or deleted via panel.html
function setAdmins(admins) {
  const sheet = getSheet(ADMIN_SHEET);
  ensureAdminHeaders(sheet);

  // Clear all data rows, keep header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  if (admins && admins.length > 0) {
    const rows = admins.map(function(a) {
      return [
        a.email      || "",
        a.password   || "",
        a.name       || "",
        a.token      || "",
        a.last_login || "",
      ];
    });
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }

  return { success: true, count: admins ? admins.length : 0 };
}

function addAdmin(admin) {
  const sheet = getSheet(ADMIN_SHEET);
  ensureAdminHeaders(sheet);
  sheet.appendRow([admin.email, admin.password, admin.name||"", "", ""]);
  return { success: true };
}

function deleteAdmin(email) {
  const sheet = getSheet(ADMIN_SHEET);
  const rows  = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).trim() === email) { sheet.deleteRow(i+1); return { success: true }; }
  }
  return { error: "Admin not found" };
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
      const token = Utilities.base64Encode(email + ":" + Date.now());
      adminSheet.getRange(i+1, 4).setValue(token);
      adminSheet.getRange(i+1, 5).setValue(new Date());
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
    if (String(rows[i][0]).trim() === email && String(rows[i][2]).trim() === token) return true;
  }
  return false;
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
    // Default super admin row
    sheet.appendRow(["admin@agri.kerala.gov.in","AgriAdmin@2025","Super Admin","",""]);
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ONE-TIME SETUP — Run this manually in Apps Script editor
 * Extensions → Apps Script → select setupSheet → Run
 */
function setupSheet() {
  const appsSheet  = getSheet(SHEET_NAME);
  const adminSheet = getSheet(ADMIN_SHEET);
  Logger.log("✅ Setup complete. Apps + Admins sheets ready.");
  Logger.log("Default admin: admin@agri.kerala.gov.in / AgriAdmin@2025");
}
