// ═══════════════════════════════════════════════════════════════
//  SHETTIHALLI NATURALS — app.js
// ═══════════════════════════════════════════════════════════════

const WA_NUMBER     = "918073647211";
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTu_9vQWCquS52J_GrYcCLoGRwDCe9HUykCqqniSYNnuHj1Ge9a76H_M8j_uDNEdQ6xCiKIAB-WDY-X/pub?output=csv";
const STORAGE_KEY   = "sn_products";
const STORAGE_VER   = "v4"; // bump to force-refresh all browsers

const FALLBACK_PRODUCTS = [
  { id:"1",  name:"Totapuri Mangoes",            category:"mango",     price:450,  originalPrice:580,  unit:"per dozen",         shortDesc:"Crisp and tangy. Perfect for chutneys, pickles and raw mango recipes.",          image:"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80",  badge:"Great Value",       inStock:true, status:"active",      stockQty:72, rating:4.7, reviews:156, origin:"Shettihalli, Hassan, Karnataka", weight:"~3 kg",    harvest:"May–July",   discount:22 },
  { id:"2",  name:"Badami Mangoes",              category:"mango",     price:650,  originalPrice:800,  unit:"per dozen",         shortDesc:"Karnataka's own pride — sweet, fiber-free and creamy. The Alphonso of the South.", image:"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80", badge:"Karnataka Special", inStock:true, status:"active",      stockQty:60, rating:4.8, reviews:189, origin:"Shettihalli, Hassan, Karnataka", weight:"~2.8 kg",  harvest:"May–June",   discount:19 },
  { id:"3",  name:"Malgova Mangoes",             category:"mango",     price:750,  originalPrice:950,  unit:"per dozen",         shortDesc:"Giant, pulpy and insanely sweet. The heavyweight champion of South Indian mangoes.", image:"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80", badge:"Giant Size",        inStock:true, status:"active",      stockQty:36, rating:4.7, reviews:98,  origin:"Shettihalli, Hassan, Karnataka", weight:"~4.5 kg",  harvest:"June–July",  discount:21 },
  { id:"4",  name:"Raspuri Mangoes",             category:"mango",     price:550,  originalPrice:700,  unit:"per dozen",         shortDesc:"The queen of Karnataka mangoes — juicy, fibre-free, with a royal golden hue.",    image:"https://images.unsplash.com/photo-1582655122842-8b9f0e2d0e3e?w=600&q=80", badge:"Queen of Mangoes",  inStock:true, status:"active",      stockQty:45, rating:4.8, reviews:112, origin:"Shettihalli, Hassan, Karnataka", weight:"~2.5 kg",  harvest:"April–June", discount:21 },
  { id:"5",  name:"Mallika Mangoes",             category:"mango",     price:600,  originalPrice:780,  unit:"per dozen",         shortDesc:"A delightful hybrid — intensely sweet with a hint of citrus. No fibres, pure joy.", image:"https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80", badge:"Hybrid Delight",    inStock:true, status:"active",      stockQty:40, rating:4.7, reviews:87,  origin:"Shettihalli, Hassan, Karnataka", weight:"~2.6 kg",  harvest:"May–June",   discount:23 },
  { id:"6",  name:"Sendhura Mangoes",            category:"mango",     price:500,  originalPrice:650,  unit:"per dozen",         shortDesc:"Deep red-blushed skin, rich sweet pulp. A Karnataka classic loved for generations.", image:"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80", badge:"Farm Favourite",    inStock:true, status:"active",      stockQty:50, rating:4.6, reviews:76,  origin:"Shettihalli, Hassan, Karnataka", weight:"~2.7 kg",  harvest:"May–July",   discount:23 },
  { id:"7",  name:"Neelam Mangoes",              category:"mango",     price:420,  originalPrice:550,  unit:"per dozen",         shortDesc:"Small, golden, intensely fragrant. The last mango of the season — worth the wait.", image:"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80",  badge:"Season Ender",      inStock:true, status:"active",      stockQty:55, rating:4.6, reviews:94,  origin:"Shettihalli, Hassan, Karnataka", weight:"~2 kg",    harvest:"June–August",discount:24 },
  { id:"8",  name:"Farm-Fresh Jackfruit (whole)",category:"jackfruit", price:350,  originalPrice:450,  unit:"per piece (~5 kg)", shortDesc:"60-year-old heritage trees. Honey-golden bulbs with intense tropical sweetness.",  image:"https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80", badge:"Heritage Trees",    inStock:true, status:"active",      stockQty:24, rating:4.8, reviews:127, origin:"Shettihalli, Hassan, Karnataka", weight:"4–6 kg",   harvest:"May–Aug",    discount:22 },
  { id:"9",  name:"Jackfruit Peeled",            category:"jackfruit", price:180,  originalPrice:240,  unit:"per kg",            shortDesc:"Ready-to-eat sweet jackfruit bulbs — cleaned, peeled and packed fresh.",           image:"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80", badge:"Ready to Eat",      inStock:true, status:"active",      stockQty:30, rating:4.7, reviews:88,  origin:"Shettihalli, Hassan, Karnataka", weight:"500g, 1 kg, 2 kg", harvest:"May–Aug",   discount:25 },
  { id:"10", name:"Raw Jackfruit (For Curry)",   category:"jackfruit", price:120,  originalPrice:160,  unit:"per kg",            shortDesc:"Cook-ready raw jackfruit pieces. Firm, meaty texture for curries and biryani.",   image:"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80", badge:"Ready to Cook",     inStock:true, status:"active",      stockQty:50, rating:4.6, reviews:88,  origin:"Shettihalli, Hassan, Karnataka", weight:"1–5 kg",   harvest:"Mar–June",   discount:25 },
  { id:"11", name:"Kiru Nallikayi / Amla",       category:"seasonal",  price:80,   originalPrice:110,  unit:"per kg",            shortDesc:"Fresh Indian gooseberries — tangy, nutrient-packed, straight from the farm.",     image:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80", badge:"Superfood",         inStock:true, status:"active",      stockQty:40, rating:4.7, reviews:62,  origin:"Shettihalli, Hassan, Karnataka", weight:"500g / 1 kg / 2 kg", harvest:"Oct–Feb", discount:27 },
  { id:"12", name:"Nerale Hannu / Jamun",        category:"seasonal",  price:120,  originalPrice:160,  unit:"per kg",            shortDesc:"Dark, juicy jamun berries — sweet-tart, deeply flavourful, seasonal and rare.",   image:"https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80", badge:"Rare & Seasonal",   inStock:true, status:"active",      stockQty:20, rating:4.8, reviews:48,  origin:"Shettihalli, Hassan, Karnataka", weight:"500g / 1 kg", harvest:"June–July",  discount:25 },
  { id:"13", name:"Mango Pickle",                category:"kitchen",   price:220,  originalPrice:280,  unit:"per 500g jar",      shortDesc:"Traditional spiced mango pickle — made from farm-fresh raw mangoes, aged to perfection.", image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80", badge:"Home Recipe",  inStock:true, status:"active",      stockQty:35, rating:4.9, reviews:143, origin:"Shettihalli, Hassan, Karnataka", weight:"500g jar",  harvest:"Year-round", discount:21 },
  { id:"14", name:"Puliyogare Gojju",            category:"kitchen",   price:180,  originalPrice:230,  unit:"per 300g jar",      shortDesc:"Authentic tamarind-spice paste for instant puliyogare rice. Zero preservatives.", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80", badge:"Authentic Recipe",  inStock:true, status:"active",      stockQty:28, rating:4.8, reviews:97,  origin:"Shettihalli, Hassan, Karnataka", weight:"300g jar",  harvest:"Year-round", discount:22 },
  { id:"15", name:"Maavinkaayi Chitranna Gojju", category:"kitchen",   price:160,  originalPrice:210,  unit:"per 300g jar",      shortDesc:"Raw mango gojju for chitranna (lemon rice) — tangy, spicy and utterly Karnataka.", image:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80", badge:"Karnataka Special", inStock:true, status:"active",      stockQty:25, rating:4.8, reviews:74,  origin:"Shettihalli, Hassan, Karnataka", weight:"300g jar",  harvest:"Year-round", discount:24 },
  { id:"16", name:"Mango Assortment Box",        category:"assortment",price:1299, originalPrice:1800, unit:"per gift box",       shortDesc:"Badami + Raspuri + Totapuri — curated and beautifully gift-packed.",             image:"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80", badge:"Gift Box",          inStock:true, status:"active",      stockQty:20, rating:5.0, reviews:76,  origin:"Shettihalli, Hassan, Karnataka", weight:"~3 kg mix", harvest:"May–June",   discount:28 },
];

// ── STATE ─────────────────────────────────────────────────────
let allProducts  = [];
let activeFilter = "all";
let modalProduct = null;
let modalQty     = 1;

// ── INIT ──────────────────────────────────────────────────────
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

// ── LOAD PRODUCTS — single source of truth ────────────────────
async function loadProducts() {
  const loading = document.getElementById("productsLoading");
  loading.style.display = "flex";

  // Version check — clears stale cache across all browsers
  const storedVer = localStorage.getItem("sn_products_ver");
  if (storedVer !== STORAGE_VER) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem("sn_products_ver", STORAGE_VER);
  }

  if (SHEET_CSV_URL) {
    // Google Sheet is master — always fetch fresh, cache locally
    try {
      const res  = await fetch(SHEET_CSV_URL + "&t=" + Date.now());
      const text = await res.text();
      const rows = csvToObjects(text);
      if (rows.length > 0) {
        allProducts = rows.map(sheetRowToProduct).filter(p => p.name);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allProducts));
      } else {
        allProducts = getLocalOrFallback();
      }
    } catch {
      allProducts = getLocalOrFallback();
    }
  } else {
    // No sheet — use localStorage (admin saves here) or fallback defaults
    allProducts = getLocalOrFallback();
  }

  loading.style.display = "none";
  renderProducts();
}

function getLocalOrFallback() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { try { return JSON.parse(saved); } catch {} }
  return JSON.parse(JSON.stringify(FALLBACK_PRODUCTS));
}

// ── CSV HELPERS ───────────────────────────────────────────────
function csvToObjects(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g,""));
  return lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const obj  = {};
    headers.forEach((h,i) => { obj[h] = (vals[i]||"").replace(/^"|"$/g,"").trim(); });
    return obj;
  });
}

function sheetRowToProduct(row) {
  return {
    id:            row.id || String(Math.random()),
    name:          row.name || "",
    category:      (row.category || "mango").toLowerCase(),
    price:         Number(row.price || 0),
    originalPrice: Number(row.originalPrice || 0) || undefined,
    unit:          row.unit || "per piece",
    shortDesc:     row.shortDesc || row.description || "",
    image:         row.image || "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80",
    badge:         row.badge || "",
    inStock:       (row.inStock || "true").toLowerCase() !== "false",
    status:        (row.status || "active").toLowerCase(),
    stockQty:      Number(row.stockQty || 99),
    rating:        Number(row.rating || 4.8),
    reviews:       Number(row.reviews || 0),
    origin:        row.origin || "Shettihalli, Karnataka",
    weight:        row.weight || "",
    harvest:       row.harvest || "",
    discount:      Number(row.discount || 0),
  };
}

// ── RENDER PRODUCTS ───────────────────────────────────────────
function renderProducts() {
  const grid  = document.getElementById("productsGrid");
  const empty = document.getElementById("productsEmpty");
  const list  = activeFilter === "all" ? allProducts : allProducts.filter(p => p.category === activeFilter);

  if (list.length === 0) { grid.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  grid.innerHTML = list.map(p => productCardHTML(p)).join("");

  grid.querySelectorAll(".card-btn-cart").forEach(btn => {
    btn.addEventListener("click", e => {
      const p = allProducts.find(p => p.id === e.currentTarget.dataset.id);
      if (p && p.inStock && p.status === "active") openModal(p);
    });
  });
  grid.querySelectorAll(".card-btn-wa").forEach(btn => {
    btn.addEventListener("click", e => {
      const p = allProducts.find(p => p.id === e.currentTarget.dataset.id);
      if (p && p.inStock && p.status === "active") quickWhatsApp(p, 1);
    });
  });
  grid.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      const p = allProducts.find(p => p.id === card.dataset.id);
      if (p && p.inStock && p.status === "active") openModal(p);
    });
  });
}

function getStatusInfo(p) {
  if (p.status === "coming_soon" || p.status === "coming soon")
    return { label:"Coming Soon", cls:"badge-coming", canOrder: false };
  if (!p.inStock || p.stockQty === 0)
    return { label:"Sold Out", cls:"badge-out", canOrder: false };
  if (p.stockQty <= 5)
    return { label:`Only ${p.stockQty} left!`, cls:"badge-low", canOrder: true };
  return { label:"In Stock", cls:"badge-instock", canOrder: true };
}

function productCardHTML(p) {
  const s     = getStatusInfo(p);
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));

  return `
  <div class="product-card" data-id="${p.id}">
    <div class="card-img-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="card-badges">
        ${p.badge ? `<span class="badge badge-label">${p.badge}</span>` : ""}
        ${p.discount && s.canOrder ? `<span class="badge badge-discount">−${p.discount}%</span>` : ""}
      </div>
      <span class="badge-stock ${s.cls}">${s.label}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${p.name}</div>
      <div class="card-desc">${p.shortDesc}</div>
      <div class="card-rating">
        <span class="stars-filled">${stars}</span>
        <small>${p.rating} (${p.reviews} reviews)</small>
      </div>
      <div class="card-price-row">
        <div>
          <div class="card-price">₹${p.price.toLocaleString("en-IN")}</div>
          <div style="display:flex;gap:6px;align-items:center">
            ${p.originalPrice && s.canOrder ? `<span class="card-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
            <span class="card-unit">${p.unit}</span>
          </div>
        </div>
      </div>
      <div class="card-btns">
        <button class="card-btn-cart ${!s.canOrder ? 'btn-disabled' : ''}"
          data-id="${p.id}" ${!s.canOrder ? "disabled" : ""}>
          ${s.canOrder ? "🛒 Order Now" : s.label === "Coming Soon" ? "🔔 Coming Soon" : "❌ Sold Out"}
        </button>
        ${s.canOrder ? `<button class="card-btn-wa" data-id="${p.id}" title="Quick WhatsApp order">⚡</button>` : ""}
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

function openModal(product) {
  if (!product) return;
  modalProduct = product; modalQty = 1;
  renderModal();
  document.getElementById("productModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("productModal").classList.remove("open");
  document.body.style.overflow = "";
}

function renderModal() {
  const p     = modalProduct;
  const total = (p.price * modalQty).toLocaleString("en-IN");
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-img-wrap">
      <img src="${p.image}" alt="${p.name}" class="modal-img" />
    </div>
    <div class="modal-body">
      <h2 class="modal-name">${p.name}</h2>
      <div class="modal-price-row">
        <span class="modal-price">₹${p.price.toLocaleString("en-IN")}</span>
        ${p.originalPrice ? `<span class="modal-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
        <span class="modal-unit">/ ${p.unit}</span>
      </div>
      <p class="modal-desc">${p.shortDesc}</p>
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
        <button class="btn btn-green btn-block" onclick="copyOrderToClipboard()">📋 Copy Order Details</button>
      </div>
    </div>`;

  document.getElementById("qtyMinus").addEventListener("click", () => updateQty(-1));
  document.getElementById("qtyPlus").addEventListener("click",  () => updateQty(1));
}

function updateQty(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById("qtyVal").textContent       = modalQty;
  const total = (modalProduct.price * modalQty).toLocaleString("en-IN");
  document.getElementById("qtyTotal").textContent     = "₹" + total;
  document.getElementById("modalBtnTotal").textContent = total;
  document.getElementById("modalWABtn").href           = buildWALink(modalProduct, modalQty);
}

function buildWALink(product, qty) {
  const msg = `🥭 *Order — Shettihalli Naturals*\n\n`
      + `📦 *${product.name}*\n`
      + `Quantity: ${qty} ${product.unit}\n`
      + `Price: ₹${product.price.toLocaleString("en-IN")} × ${qty} = *₹${(product.price * qty).toLocaleString("en-IN")}*\n\n`
      + `Please confirm availability and delivery details. Thank you! 🙏`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function quickWhatsApp(product, qty) { window.open(buildWALink(product, qty), "_blank"); }

function copyOrderToClipboard() {
  const p    = modalProduct;
  const text = `Order: ${p.name}\nQty: ${modalQty} ${p.unit}\nTotal: ₹${(p.price * modalQty).toLocaleString("en-IN")}\nPhone: +${WA_NUMBER}`;
  navigator.clipboard.writeText(text).then(() => showToast("Order details copied! ✓"));
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
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
