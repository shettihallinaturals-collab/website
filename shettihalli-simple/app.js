// ═══════════════════════════════════════════════════════════════
//  SHETTIHALLI NATURALS — app.js
//  Single source of truth: Google Sheet ONLY. No fallbacks.
// ═══════════════════════════════════════════════════════════════

const WA_NUMBER     = "918073647211";
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTu_9vQWCquS52J_GrYcCLoGRwDCe9HUykCqqniSYNnuHj1Ge9a76H_M8j_uDNEdQ6xCiKIAB-WDY-X/pub?output=csv";

let allProducts  = [];
let activeFilter = "all";
let modalProduct = null;
let modalQty     = 1;

document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initCountdown();
    initFilters();
    initModal();
    initContactForm();
    loadProducts();
});

// ── NAVBAR ────────────────────────────────────────────────────
function initNavbar() {
    const nav   = document.getElementById("navbar");
    const ham   = document.getElementById("hamburger");
    const links = document.getElementById("navLinks");
    window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 50));
    ham.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
}

// ── COUNTDOWN ─────────────────────────────────────────────────
function initCountdown() {
    function tick() {
        const now = new Date();
        const end = new Date(now.getFullYear(), 6, 15);
        if (end < now) end.setFullYear(now.getFullYear() + 1);
        const diff = Math.max(0, end - now);
        document.getElementById("cd-days").textContent  = String(Math.floor(diff / 86400000)).padStart(2,"0");
        document.getElementById("cd-hours").textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,"0");
        document.getElementById("cd-mins").textContent  = String(Math.floor((diff % 3600000) / 60000)).padStart(2,"0");
        document.getElementById("cd-secs").textContent  = String(Math.floor((diff % 60000) / 1000)).padStart(2,"0");
    }
    tick(); setInterval(tick, 1000);
}

// ── LOAD PRODUCTS — Sheet only, no fallback ───────────────────
async function loadProducts() {
    const loading = document.getElementById("productsLoading");
    const empty   = document.getElementById("productsEmpty");
    loading.style.display = "flex";

    try {
        const res  = await fetch(SHEET_CSV_URL + "&t=" + Date.now());
        if (!res.ok) throw new Error("Sheet fetch failed: " + res.status);
        const text = await res.text();
        const rows = parseCSV(text);
        const parsed = rows.map(rowToProduct).filter(p => p.id && p.name);

        if (parsed.length === 0) throw new Error("No valid products in sheet");

        allProducts = parsed;
        loading.style.display = "none";
        renderProducts();
    } catch (err) {
        console.error("Failed to load products:", err);
        loading.style.display = "none";
        empty.style.display   = "block";
        empty.innerHTML = `
      <p style="font-size:40px">🥭</p>
      <p style="font-size:18px;color:#15803d;font-weight:600">Loading products...</p>
      <p style="color:#6b7280;margin-top:8px">Please refresh the page.</p>
      <button onclick="location.reload()" style="margin-top:16px;padding:12px 28px;background:#15803d;color:#fff;border:none;border-radius:50px;font-weight:700;cursor:pointer;font-size:15px">
        🔄 Refresh
      </button>`;
    }
}

// ── CSV PARSER ────────────────────────────────────────────────
function parseCSV(csv) {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").trim());
    return lines.slice(1).map(line => {
        // Handle quoted fields with commas inside
        const vals = [];
        let cur = "", inQ = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') { inQ = !inQ; continue; }
            if (line[i] === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
            cur += line[i];
        }
        vals.push(cur.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
        return obj;
    });
}

// ── ROW TO PRODUCT — strict validation ───────────────────────
function rowToProduct(row) {
    const VALID_CATS    = ["mango","jackfruit","seasonal","kitchen","assortment"];
    const VALID_STATUS  = ["active","coming_soon","sold_out"];

    // A valid text value must not be a boolean, number, or known non-text value
    function text(val, fallback = "") {
        if (!val) return fallback;
        const s = String(val).trim();
        if (!s || s === "TRUE" || s === "FALSE" || s === "true" || s === "false") return fallback;
        if (!isNaN(Number(s))) return fallback; // pure number in a text field = wrong column
        return s;
    }

    function num(val, fallback = 0) {
        const n = Number(String(val).trim());
        return isNaN(n) ? fallback : n;
    }

    const rawCat    = String(row.category || "").trim().toLowerCase();
    const rawStatus = String(row.status   || "").trim().toLowerCase();
    const rawStock  = String(row.inStock  || "true").trim().toUpperCase();

    const status  = VALID_STATUS.includes(rawStatus) ? rawStatus : "active";
    const inStock = rawStock === "TRUE" || rawStock === "1";

    return {
        id:            String(row.id || "").trim(),
        name:          text(row.name),
        category:      VALID_CATS.includes(rawCat) ? rawCat : "mango",
        price:         num(row.price),
        originalPrice: num(row.originalPrice) || undefined,
        unit:          text(row.unit, "per piece"),
        shortDesc:     text(row.shortDesc),
        image:         text(row.image),
        badge:         text(row.badge),
        inStock,
        status,
        stockQty:      num(row.stockQty),
        origin:        text(row.origin, "Shettihalli, Karnataka"),
        weight:        text(row.weight),
        harvest:       text(row.harvest),
        discount:      num(row.discount),
    };
}

// ── RENDER PRODUCTS ───────────────────────────────────────────
function renderProducts() {
    const grid  = document.getElementById("productsGrid");
    const empty = document.getElementById("productsEmpty");
    const list  = activeFilter === "all"
        ? allProducts
        : allProducts.filter(p => p.category === activeFilter);

    if (list.length === 0) {
        grid.innerHTML    = "";
        empty.style.display = "block";
        empty.innerHTML   = "<p>🔍 No products in this category.</p>";
        return;
    }
    empty.style.display = "none";
    grid.innerHTML = list.map(productCardHTML).join("");

    grid.querySelectorAll(".card-btn-cart").forEach(btn => {
        btn.addEventListener("click", e => {
            const p = allProducts.find(p => p.id === e.currentTarget.dataset.id);
            if (p && getStatus(p).canOrder) openModal(p);
        });
    });
    grid.querySelectorAll(".card-btn-wa").forEach(btn => {
        btn.addEventListener("click", e => {
            const p = allProducts.find(p => p.id === e.currentTarget.dataset.id);
            if (p && getStatus(p).canOrder) quickWhatsApp(p, 1);
        });
    });
    grid.querySelectorAll(".product-card").forEach(card => {
        card.addEventListener("click", e => {
            if (e.target.closest("button")) return;
            const p = allProducts.find(p => p.id === card.dataset.id);
            if (p && getStatus(p).canOrder) openModal(p);
        });
    });
}

function getStatus(p) {
    if (p.status === "coming_soon")
        return { label:"Coming Soon", cls:"badge-coming", canOrder: false };
    if (p.status === "sold_out" || !p.inStock || p.stockQty === 0)
        return { label:"Sold Out", cls:"badge-out", canOrder: false };
    if (p.stockQty <= 5)
        return { label:`Only ${p.stockQty} left!`, cls:"badge-low", canOrder: true };
    return { label:"In Stock", cls:"badge-instock", canOrder: true };
}

function productCardHTML(p) {
    const s = getStatus(p);
    return `
  <div class="product-card" data-id="${p.id}">
    <div class="card-img-wrap">
      ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />` : `<div style="width:100%;height:100%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:48px">🥭</div>`}
      <div class="card-badges">
        ${p.badge ? `<span class="badge badge-label">${p.badge}</span>` : ""}
        ${p.discount && s.canOrder ? `<span class="badge badge-discount">−${p.discount}%</span>` : ""}
      </div>
      <span class="badge-stock ${s.cls}">${s.label}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${p.name}</div>
      ${p.shortDesc ? `<div class="card-desc">${p.shortDesc}</div>` : ""}
      <div class="card-price">₹${p.price.toLocaleString("en-IN")}</div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:12px">
        ${p.originalPrice && s.canOrder ? `<span class="card-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
        <span class="card-unit">${p.unit}</span>
      </div>
      <div class="card-btns">
        <button class="card-btn-cart ${!s.canOrder ? "btn-disabled" : ""}"
          data-id="${p.id}" ${!s.canOrder ? "disabled" : ""}>
          ${s.canOrder ? "🛒 Order Now" : s.label === "Coming Soon" ? "🔔 Coming Soon" : "❌ Sold Out"}
        </button>
        ${s.canOrder ? `<button class="card-btn-wa" data-id="${p.id}" title="Quick WhatsApp">⚡</button>` : ""}
      </div>
      ${p.origin ? `<div class="card-origin">📍 ${p.origin}</div>` : ""}
    </div>
  </div>`;
}

// ── FILTERS ───────────────────────────────────────────────────
function initFilters() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = btn.dataset.cat;
            renderProducts();
        });
    });
}

// ── MODAL ─────────────────────────────────────────────────────
function initModal() {
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("productModal").addEventListener("click", e => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}

function openModal(p) {
    if (!p) return;
    modalProduct = p; modalQty = 1;
    renderModal();
    document.getElementById("productModal").classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    document.getElementById("productModal").classList.remove("open");
    document.body.style.overflow = "";
}

function renderModal() {
    const p = modalProduct;
    const total = (p.price * modalQty).toLocaleString("en-IN");
    document.getElementById("modalContent").innerHTML = `
    <div class="modal-img-wrap">
      ${p.image
        ? `<img src="${p.image}" alt="${p.name}" class="modal-img" />`
        : `<div style="width:100%;height:220px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:72px">🥭</div>`}
    </div>
    <div class="modal-body">
      <h2 class="modal-name">${p.name}</h2>
      <div class="modal-price-row">
        <span class="modal-price">₹${p.price.toLocaleString("en-IN")}</span>
        ${p.originalPrice ? `<span class="modal-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
        <span class="modal-unit">/ ${p.unit}</span>
      </div>
      ${p.shortDesc ? `<p class="modal-desc">${p.shortDesc}</p>` : ""}
      <div class="modal-meta">
        ${p.origin  ? `<div class="modal-meta-item"><small>📍 Origin</small><span>${p.origin}</span></div>` : ""}
        ${p.weight  ? `<div class="modal-meta-item"><small>⚖️ Weight</small><span>${p.weight}</span></div>` : ""}
        ${p.harvest ? `<div class="modal-meta-item"><small>🌸 Season</small><span>${p.harvest}</span></div>` : ""}
        <div class="modal-meta-item"><small>🌿 Farming</small><span>100% Organic</span></div>
      </div>
      <div class="modal-qty-row">
        <label>Quantity:</label>
        <div class="qty-control">
          <button class="qty-btn" id="qtyMinus">−</button>
          <span class="qty-val" id="qtyVal">${modalQty}</span>
          <button class="qty-btn" id="qtyPlus">+</button>
        </div>
        <span class="modal-total-label">= <strong id="qtyTotal">₹${total}</strong></span>
      </div>
      <div class="modal-btns">
        <a href="${buildWALink(p, modalQty)}" target="_blank" class="btn btn-wa btn-block" id="modalWABtn">
          💬 Order via WhatsApp — ₹<span id="modalBtnTotal">${total}</span>
        </a>
        <button class="btn btn-green btn-block" onclick="copyOrder()">📋 Copy Order Details</button>
      </div>
    </div>`;
    document.getElementById("qtyMinus").addEventListener("click", () => updateQty(-1));
    document.getElementById("qtyPlus").addEventListener("click",  () => updateQty(1));
}

function updateQty(d) {
    modalQty = Math.max(1, modalQty + d);
    document.getElementById("qtyVal").textContent      = modalQty;
    const total = (modalProduct.price * modalQty).toLocaleString("en-IN");
    document.getElementById("qtyTotal").textContent    = "₹" + total;
    document.getElementById("modalBtnTotal").textContent = total;
    document.getElementById("modalWABtn").href           = buildWALink(modalProduct, modalQty);
}

function buildWALink(p, qty) {
    const msg = `🥭 *Order — Shettihalli Naturals*\n\n📦 *${p.name}*\nQty: ${qty} ${p.unit}\nTotal: *₹${(p.price * qty).toLocaleString("en-IN")}*\n\nPlease confirm. Thank you! 🙏`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function quickWhatsApp(p, qty) { window.open(buildWALink(p, qty), "_blank"); }

function copyOrder() {
    const p = modalProduct;
    navigator.clipboard.writeText(`Order: ${p.name}\nQty: ${modalQty} ${p.unit}\nTotal: ₹${(p.price * modalQty).toLocaleString("en-IN")}\nWhatsApp: +${WA_NUMBER}`)
        .then(() => showToast("Copied! ✓"));
}

// ── CONTACT FORM ──────────────────────────────────────────────
function initContactForm() {
    document.getElementById("contactForm").addEventListener("submit", e => {
        e.preventDefault();
        const name  = document.getElementById("cf-name").value.trim();
        const phone = document.getElementById("cf-phone").value.trim();
        const email = document.getElementById("cf-email").value.trim();
        const msg   = document.getElementById("cf-msg").value.trim();
        const text  = `*Enquiry — Shettihalli Naturals*\n\nName: ${name}\nPhone: ${phone}${email ? "\nEmail: " + email : ""}\n\n${msg}`;
        window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
        e.target.reset();
        showToast("Opening WhatsApp... 🥭");
    });
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2800);
}
