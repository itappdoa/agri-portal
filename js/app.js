/**
 * AGRI PORTAL — MAIN APP JS (Fixed)
 */

let allApps = [];
let currentCat = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
  initCanvas();
  initHeader();
  initMobileMenu();
  initSearch();
  initFilters();
  await initApps();
});

async function initApps() {
  allApps = await loadApps();
  renderApps();
  renderRecent();
  animateStat();
}

/* ---- Render cards ---- */
function renderApps() {
  const grid    = document.getElementById("appsGrid");
  const noRes   = document.getElementById("noResults");
  const counter = document.getElementById("appsCount");

  const filtered = allApps.filter(app => {
    const q = searchQuery.toLowerCase();
    const name = (app.name || app.app_name || "").toLowerCase();
    const desc = (app.desc || app.description || "").toLowerCase();
    const cat  = (app.category || "").toLowerCase();
    const matchSearch = !q || name.includes(q) || desc.includes(q) || cat.includes(q);
    const matchCat    = currentCat === "all" || cat === currentCat;
    return matchSearch && matchCat;
  });

  if (counter) {
    counter.textContent = filtered.length === allApps.length
      ? `${allApps.length} app${allApps.length !== 1 ? "s" : ""}`
      : `${filtered.length} of ${allApps.length} apps`;
  }

  if (!filtered.length) {
    grid.innerHTML = "";
    if (noRes) noRes.style.display = "block";
    return;
  }
  if (noRes) noRes.style.display = "none";

  grid.innerHTML = filtered.map((app, i) => buildCard(app, i)).join("");
}

function buildCard(app, i) {
  const name = app.name || app.app_name || "Untitled App";
  const desc = app.desc || app.description || "No description available.";
  const url  = app.url || "#";
  const icon = app.icon || app.image || "";
  const cat  = app.category || "";
  const date = app.date || app.created_date || "";
  const catLabel = CAT_LABELS[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "");
  const dateStr  = date ? formatDate(date) : "";
  const delay    = Math.min(i * 0.05, 0.6);

  return `
  <div class="app-card" style="animation-delay:${delay}s">
    <div class="card-row-top">
      ${buildIcon(icon, name, "card-icon")}
      ${catLabel ? `<span class="card-cat">${esc(catLabel)}</span>` : ""}
    </div>
    <div class="card-name">${esc(name)}</div>
    <div class="card-desc">${esc(desc)}</div>
    <div class="card-footer">
      <span class="card-date">${dateStr}</span>
      <a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="card-btn">
        Open App →
      </a>
    </div>
  </div>`;
}

/* ---- Render recent strip ---- */
function renderRecent() {
  const strip = document.getElementById("recentScroll");
  if (!strip) return;

  const recent = [...allApps]
    .filter(a => a.date || a.created_date)
    .sort((a, b) => new Date(b.date || b.created_date) - new Date(a.date || a.created_date))
    .slice(0, 8);

  if (!recent.length) {
    strip.innerHTML = `<p style="color:var(--gray);font-size:13px;padding:8px 0;">No recent applications.</p>`;
    return;
  }

  strip.innerHTML = recent.map(app => {
    const name = app.name || app.app_name || "App";
    const url  = app.url || "#";
    const icon = app.icon || app.image || "";
    const date = app.date || app.created_date || "";
    return `
    <a class="recent-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
      ${buildIcon(icon, name, "recent-icon")}
      <div>
        <div class="recent-name">${esc(name)}</div>
        <div class="recent-date">${date ? formatDate(date) : ""}</div>
      </div>
    </a>`;
  }).join("");
}

/* ---- Icon builder ---- */
function buildIcon(icon, name, cssClass) {
  // Image URL
  if (icon && (icon.startsWith("http://") || icon.startsWith("https://"))) {
    return `<div class="${cssClass}"><img src="${esc(icon)}" alt="${esc(name)}" loading="lazy" onerror="this.parentNode.className='${cssClass} auto-icon';this.parentNode.style='${autoIconStyle(name)}';this.parentNode.textContent='${getInitials(name)}'"/></div>`;
  }
  // Emoji (single or multi-codepoint emoji)
  if (icon && icon.trim() && !icon.startsWith("http")) {
    // Check if it's likely an emoji (non-ASCII)
    if (/\p{Emoji}/u.test(icon)) {
      return `<div class="${cssClass}" style="font-size:24px;background:var(--cream);">${icon}</div>`;
    }
  }
  // Auto-generated initials icon
  const initials = getInitials(name);
  const style = autoIconStyle(name);
  return `<div class="${cssClass} auto-icon" style="${style}">${initials}</div>`;
}

function autoIconStyle(name) {
  const COLORS = [
    "background:linear-gradient(135deg,#1b3a2d,#2d6a4f)",
    "background:linear-gradient(135deg,#2d4a1b,#4f6a2d)",
    "background:linear-gradient(135deg,#7a4500,#c8790c)",
    "background:linear-gradient(135deg,#1b2d4a,#2d4f8a)",
    "background:linear-gradient(135deg,#4a1b2d,#8a2d4f)",
    "background:linear-gradient(135deg,#1b3a3a,#2d6a6a)",
    "background:linear-gradient(135deg,#3a2d1b,#6a4f2d)",
    "background:linear-gradient(135deg,#2a1b4a,#4f2d8a)",
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffff;
  return COLORS[Math.abs(hash) % COLORS.length] + ";color:#fff;";
}

/* ---- Stat counter animation ---- */
function animateStat() {
  const el = document.getElementById("statAppsNum");
  if (!el) return;
  const target = allApps.length;
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 25));
  const timer = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(timer);
  }, 55);
}

/* ---- Search ---- */
function initSearch() {
  const inp = document.getElementById("searchInput");
  if (!inp) return;
  inp.addEventListener("input", () => {
    searchQuery = inp.value.trim();
    renderApps();
  });
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      inp.focus();
    }
    if (e.key === "Escape" && document.activeElement === inp) inp.blur();
  });
}

/* ---- Filters ---- */
function initFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCat = btn.dataset.cat;
      renderApps();
    });
  });
}

/* ---- Header scroll effect ---- */
function initHeader() {
  const h = document.getElementById("mainHeader");
  if (!h) return;
  window.addEventListener("scroll", () => {
    h.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });
}

/* ---- Mobile hamburger ---- */
function initMobileMenu() {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("mobileNav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => nav.classList.toggle("open"));
  document.querySelectorAll(".mobile-nav a").forEach(a => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });
}

/* ---- Particle canvas background ---- */
function initCanvas() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, pts = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makePoint() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r:  Math.random() * 1.8 + 0.4,
      a:  Math.random() * 0.35 + 0.08,
      c:  Math.random() > 0.5 ? "#2d6a4f" : "#c8960c",
    };
  }

  function setup() {
    resize();
    pts = Array.from({ length: 70 }, makePoint);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.a;
      ctx.fill();

      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = "#2d6a4f";
          ctx.globalAlpha = 0.055 * (1 - dist / 110);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); }, { passive: true });
  setup();
  draw();
}

/* ---- Helpers ---- */
function getInitials(name) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(ds) {
  if (!ds) return "";
  try {
    return new Date(ds).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ds; }
}
