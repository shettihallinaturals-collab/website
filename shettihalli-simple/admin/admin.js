// ═══════════════════════════════════════════════════════════════
//  SHETTIHALLI NATURALS — Admin Panel JS
//  Source of truth: Google Sheet ONLY. No default products.
// ═══════════════════════════════════════════════════════════════

const ADMIN_USER      = "admin";
const ADMIN_PASS      = "shettihalli2024";
const ORDERS_KEY      = "sn_orders";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyUwJ2I3kJxIxnf_fExlt7SPg6Wz-FnIdVnGoJUOH29D6CuwOwj1gUPW0_N-JU6w-EPQA/exec";
const SHEET_CSV_URL   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTu_9vQWCquS52J_GrYcCLoGRwDCe9HUykCqqniSYNnuHj1Ge9a76H_M8j_uDNEdQ6xCiKIAB-WDY-X/pub?output=csv";

let products        = [];
let orders          = [];
let deletePendingId = null;
let syncTimer       = null;

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("sn_admin") === "1") showDashboard();
  else document.getElementById("loginScreen").style.display = "flex";

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("mobileMenuBtn").addEventListener("click", () =>
      document.getElementById("sidebar").classList.toggle("open")
  );
  document.querySelectorAll(".nav-item").forEach(btn =>
      btn.addEventListener("click", () => switchTab(btn.dataset.tab, btn))
  );
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);
  document.getElementById("exportBtn").addEventListener("click", exportJSON);
  document.getElementById("previewImgBtn").addEventListener("click", previewImg);
  document.getElementById("searchInput").addEventListener("input", renderProductsTable);
  document.getElementById("catFilter").addEventListener("change", renderProductsTable);
  document.getElementById("confirmYes").addEventListener("click", confirmDelete);
  document.getElementById("confirmNo").addEventListener("click", () => closeDialog("confirmDialog"));
  document.getElementById("addOrderBtn").addEventListener("click", () => openDialog("orderDialog"));
  document.getElementById("closeOrderDialog").addEventListener("click", () => closeDialog("orderDialog"));
  document.getElementById("orderForm").addEventListener("submit", saveOrder);
  document.getElementById("pageDate").textContent = new Date().toLocaleDateString("en-IN", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });
});

// ── AUTH ──────────────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const u   = document.getElementById("loginUser").value.trim();
  const p   = document.getElementById("loginPass").value;
  const err = document.getElementById("loginError");
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    localStorage.setItem("sn_admin", "1");
    err.style.display = "none";
    showDashboard();
  } else {
    err.textContent = "❌ Invalid username or password.";
    err.style.display = "block";
  }
}

function logout() { localStorage.removeItem("sn_admin"); location.reload(); }

async function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").classList.remove("hidden");
  await loadFromSheet();
  const savedOrders = localStorage.getItem(ORDERS_KEY);
  orders = savedOrders ? JSON.parse(savedOrders) : [];
  renderOverview();
  renderProductsTable();
  renderOrdersTable();
}

// ── LOAD FROM SHEET — always, no fallback to defaults ─────────
async function loadFromSheet() {
  setLoading(true);
  try {
    const res  = await fetch(SHEET_CSV_URL + "&t=" + Date.now());
    const text = await res.text();
    const rows = parseCSV(text);
    const parsed = rows.map(rowToProduct).filter(p => p.id && p.name);
    if (parsed.length > 0) {
      products = parsed;
      console.log("✅ Loaded", products.length, "products from Sheet");
    } else {
      products = [];
      toast("⚠️ Sheet is empty. Add products below.");
    }
  } catch (err) {
    console.error("Sheet load failed:", err);
    products = [];
    toast("⚠️ Could not load Sheet. Check connection.");
  }
  setLoading(false);
}

function setLoading(on) {
  const el = document.getElementById("productsTable");
  if (!el) return;
  if (on) el.innerHTML = '<p class="empty-msg" style="padding:30px;text-align:center">⏳ Loading from Google Sheet...</p>';
}

// ── CSV PARSER ────────────────────────────────────────────────
function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").trim());
  return lines.slice(1).map(line => {
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

function rowToProduct(row) {
  const VALID_CATS   = ["mango","jackfruit","seasonal","kitchen","assortment"];
  const VALID_STATUS = ["active","coming_soon","sold_out"];

  function text(val, fallback = "") {
    if (!val) return fallback;
    const s = String(val).trim();
    if (!s || s === "TRUE" || s === "FALSE" || s === "true" || s === "false") return fallback;
    if (!isNaN(Number(s))) return fallback;
    return s;
  }

  function num(val, fallback = 0) {
    const n = Number(String(val).trim());
    return isNaN(n) ? fallback : n;
  }

  const rawCat    = String(row.category || "").trim().toLowerCase();
  const rawStatus = String(row.status   || "").trim().toLowerCase();
  const rawStock  = String(row.inStock  || "true").trim().toUpperCase();

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
    inStock:       rawStock === "TRUE" || rawStock === "1",
    status:        VALID_STATUS.includes(rawStatus) ? rawStatus : "active",
    stockQty:      num(row.stockQty),
    origin:        text(row.origin, "Shettihalli, Karnataka"),
    weight:        text(row.weight),
    harvest:       text(row.harvest),
    discount:      num(row.discount),
  };
}

// ── SYNC TO SHEET — debounced 1.5s ────────────────────────────
function syncToSheet() {
  if (!APPS_SCRIPT_URL) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      mode:    "no-cors",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "deleteAll", products }),
    })
        .then(() => { toast("✅ Sheet synced!"); })
        .catch(() => { toast("⚠️ Sync failed — check Apps Script"); });
  }, 1500);
}

// ── TABS ──────────────────────────────────────────────────────
const TAB_TITLES = { overview:"Overview", products:"Products", add:"Add Product", orders:"Orders" };

function switchTab(tab, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  if (btn) btn.classList.add("active");
  document.getElementById("pageTitle").textContent = TAB_TITLES[tab] || tab;
  document.getElementById("sidebar").classList.remove("open");
  if (tab === "overview") renderOverview();
  if (tab === "products") renderProductsTable();
  if (tab === "orders")   renderOrdersTable();
}

// ── OVERVIEW ──────────────────────────────────────────────────
function renderOverview() {
  document.getElementById("stat-total").textContent = products.length;
  document.getElementById("stat-in").textContent    = products.filter(p => p.inStock && p.stockQty > 5 && p.status === "active").length;
  document.getElementById("stat-low").textContent   = products.filter(p => p.stockQty > 0 && p.stockQty <= 5).length;
  document.getElementById("stat-out").textContent   = products.filter(p => !p.inStock || p.stockQty === 0).length;

  const lowList = products.filter(p => p.stockQty <= 5);
  document.getElementById("lowStockList").innerHTML = lowList.length === 0
      ? '<p class="empty-msg">✅ All products well stocked!</p>'
      : lowList.map(p => `<div class="low-stock-item">
        <span><strong>${p.name}</strong></span>
        <span class="${p.stockQty === 0 ? "badge-pill pill-red" : "badge-pill pill-orange"}">
          ${p.stockQty === 0 ? "Out of Stock" : "Only " + p.stockQty + " left"}
        </span>
      </div>`).join("");

  document.getElementById("overviewTable").innerHTML = products.length === 0
      ? '<p class="empty-msg" style="padding:20px">No products yet. Add them in the Add Product tab.</p>'
      : `<div class="table-wrap"><table>
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
        <tbody>${products.map(p => `<tr>
          <td><strong>${p.name}</strong></td>
          <td><span class="badge-pill pill-gray">${p.category}</span></td>
          <td>₹${p.price.toLocaleString("en-IN")} <small style="color:#9ca3af">/${p.unit}</small></td>
          <td>${p.stockQty}</td>
          <td>${statusPill(p)}</td>
        </tr>`).join("")}</tbody>
      </table></div>`;
}

function statusPill(p) {
  if (p.status === "coming_soon") return '<span class="badge-pill pill-blue">🔔 Coming Soon</span>';
  if (!p.inStock || p.stockQty === 0) return '<span class="badge-pill pill-red">Out of Stock</span>';
  if (p.stockQty <= 5) return `<span class="badge-pill pill-orange">Only ${p.stockQty} left</span>`;
  return '<span class="badge-pill pill-green">In Stock</span>';
}

// ── PRODUCTS TABLE ────────────────────────────────────────────
function renderProductsTable() {
  const q   = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const cat = document.getElementById("catFilter")?.value || "all";
  let list  = cat === "all" ? products : products.filter(p => p.category === cat);
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q));

  const wrap = document.getElementById("productsTable");
  if (!wrap) return;

  if (products.length === 0) {
    wrap.innerHTML = '<p class="empty-msg" style="padding:20px">⏳ Loading products from Sheet...</p>';
    return;
  }
  if (list.length === 0) {
    wrap.innerHTML = '<p class="empty-msg" style="padding:20px">No products match your search.</p>';
    return;
  }

  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${list.map(p => `<tr>
      <td><strong>${p.name}</strong><br><small style="color:#9ca3af">${p.unit}</small></td>
      <td><span class="badge-pill pill-gray">${p.category}</span></td>
      <td><input type="number" class="inline-input" value="${p.price}"
            onchange="inlineUpdate('${p.id}','price',this.value)" style="width:80px" /></td>
      <td><input type="number" class="inline-input" value="${p.stockQty}"
            onchange="inlineUpdate('${p.id}','stockQty',this.value)" style="width:65px" /></td>
      <td>
        <select onchange="inlineUpdate('${p.id}','status',this.value)" class="inline-select">
          <option value="active"      ${p.status === "active"      ? "selected" : ""}>✅ Active</option>
          <option value="coming_soon" ${p.status === "coming_soon" ? "selected" : ""}>🔔 Coming Soon</option>
          <option value="sold_out"    ${p.status === "sold_out"    ? "selected" : ""}>❌ Sold Out</option>
        </select>
      </td>
      <td><div class="tbl-actions">
        <button class="btn-edit" onclick="editProduct('${p.id}')">✏️ Edit</button>
        <button class="btn-del"  onclick="askDelete('${p.id}')">🗑</button>
      </div></td>
    </tr>`).join("")}</tbody></table></div>`;

  wrap.querySelectorAll(".inline-input").forEach(inp => {
    inp.style.cssText = "padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;outline:none;";
  });
  wrap.querySelectorAll(".inline-select").forEach(sel => {
    sel.style.cssText = "padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;outline:none;background:#fff;cursor:pointer;";
  });
}

// onchange fires on blur — not on every keystroke
function inlineUpdate(id, field, value) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  if (field === "price" || field === "stockQty") {
    p[field] = Number(value);
    if (field === "stockQty" && Number(value) === 0) { p.inStock = false; p.status = "sold_out"; }
    if (field === "stockQty" && Number(value) > 0  && p.status === "sold_out") { p.inStock = true; p.status = "active"; }
  } else if (field === "status") {
    p.status  = value;
    p.inStock = (value === "active");
  }
  renderOverview();
  toast("💾 Saving...");
  syncToSheet(); // debounced 1.5s
}

// ── ADD / EDIT ────────────────────────────────────────────────
function saveProduct(e) {
  e.preventDefault();
  const id     = document.getElementById("editId").value;
  const status = document.getElementById("f-status").value;
  const data = {
    name:          document.getElementById("f-name").value.trim(),
    category:      document.getElementById("f-cat").value,
    price:         Number(document.getElementById("f-price").value),
    originalPrice: Number(document.getElementById("f-oprice").value) || undefined,
    unit:          document.getElementById("f-unit").value.trim(),
    stockQty:      Number(document.getElementById("f-stock").value),
    badge:         document.getElementById("f-badge").value.trim(),
    status,
    inStock:       status === "active",
    image:         document.getElementById("f-img").value.trim(),
    shortDesc:     document.getElementById("f-short").value.trim(),
    origin:        document.getElementById("f-origin").value.trim() || "Shettihalli, Karnataka",
    weight:        document.getElementById("f-weight").value.trim(),
    harvest:       document.getElementById("f-harvest").value.trim(),
    discount:      calcDiscount(Number(document.getElementById("f-price").value), Number(document.getElementById("f-oprice").value)),
  };

  if (id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) products[idx] = { ...products[idx], ...data };
    toast("✅ Updated!");
  } else {
    data.id = "p_" + Date.now();
    products.push(data);
    toast("✅ Added!");
  }

  syncToSheet();
  e.target.reset();
  document.getElementById("imgPreview").classList.add("hidden");
  document.getElementById("editId").value              = "";
  document.getElementById("formTitle").textContent     = "➕ Add New Product";
  document.getElementById("saveBtn").textContent       = "💾 Save Product";
  document.getElementById("cancelEditBtn").style.display = "none";
  renderOverview();
  renderProductsTable();
}

function calcDiscount(price, orig) {
  if (!orig || orig <= price) return 0;
  return Math.round((orig - price) / orig * 100);
}

function editProduct(id) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  switchTab("add", document.querySelector('[data-tab="add"]'));
  document.getElementById("editId").value     = p.id;
  document.getElementById("f-name").value    = p.name;
  document.getElementById("f-cat").value     = p.category;
  document.getElementById("f-price").value   = p.price;
  document.getElementById("f-oprice").value  = p.originalPrice || "";
  document.getElementById("f-unit").value    = p.unit;
  document.getElementById("f-stock").value   = p.stockQty;
  document.getElementById("f-badge").value   = p.badge || "";
  document.getElementById("f-status").value  = p.status || "active";
  document.getElementById("f-img").value     = p.image || "";
  document.getElementById("f-short").value   = p.shortDesc || "";
  document.getElementById("f-origin").value  = p.origin || "";
  document.getElementById("f-weight").value  = p.weight || "";
  document.getElementById("f-harvest").value = p.harvest || "";
  if (p.image) {
    const prev = document.getElementById("imgPreview");
    prev.src = p.image;
    prev.classList.remove("hidden");
  }
  document.getElementById("formTitle").textContent       = "✏️ Edit Product";
  document.getElementById("saveBtn").textContent         = "💾 Update Product";
  document.getElementById("cancelEditBtn").style.display = "inline-flex";
}

function cancelEdit() {
  document.getElementById("productForm").reset();
  document.getElementById("editId").value              = "";
  document.getElementById("imgPreview").classList.add("hidden");
  document.getElementById("formTitle").textContent     = "➕ Add New Product";
  document.getElementById("saveBtn").textContent       = "💾 Save Product";
  document.getElementById("cancelEditBtn").style.display = "none";
}

function previewImg() {
  const url = document.getElementById("f-img").value.trim();
  const prev = document.getElementById("imgPreview");
  if (url) { prev.src = url; prev.classList.remove("hidden"); }
  else toast("⚠️ Paste an image URL first");
}

// ── DELETE ────────────────────────────────────────────────────
function askDelete(id) {
  deletePendingId = id;
  const p = products.find(p => p.id === id);
  document.getElementById("confirmMsg").textContent = `Delete "${p?.name}"? This cannot be undone.`;
  openDialog("confirmDialog");
}

function confirmDelete() {
  products = products.filter(p => p.id !== deletePendingId);
  syncToSheet();
  closeDialog("confirmDialog");
  renderProductsTable();
  renderOverview();
  toast("🗑 Deleted!");
}

// ── ORDERS ────────────────────────────────────────────────────
function renderOrdersTable() {
  const savedOrders = localStorage.getItem(ORDERS_KEY);
  orders = savedOrders ? JSON.parse(savedOrders) : [];
  const wrap = document.getElementById("ordersTable");
  if (!wrap) return;
  if (orders.length === 0) { wrap.innerHTML = '<p class="empty-msg">No orders logged yet.</p>'; return; }
  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${orders.map((o, i) => `<tr>
      <td><strong>${orders.length - i}</strong></td>
      <td>${o.name}</td><td>${o.phone}</td>
      <td style="max-width:160px;font-size:13px">${o.items}</td>
      <td><strong>₹${Number(o.total).toLocaleString("en-IN")}</strong></td>
      <td><select onchange="updateOrderStatus(${i},this.value)" style="font-size:12px;padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px">
        ${["pending","confirmed","shipped","delivered","cancelled"].map(s => `<option ${o.status===s?"selected":""}>${s}</option>`).join("")}
      </select></td>
      <td style="font-size:12px;color:#9ca3af">${o.date}</td>
      <td>
        <a href="https://wa.me/${o.phone.replace(/\D/g,"")}?text=${encodeURIComponent("Hi "+o.name+"! Your order: "+o.items)}" target="_blank" style="font-size:18px">📱</a>
        <button class="btn-del" onclick="deleteOrder(${i})" style="margin-left:6px">🗑</button>
      </td>
    </tr>`).join("")}</tbody></table></div>`;
}

function saveOrder(e) {
  e.preventDefault();
  const savedOrders = localStorage.getItem(ORDERS_KEY);
  orders = savedOrders ? JSON.parse(savedOrders) : [];
  orders.unshift({
    name:   document.getElementById("o-name").value.trim(),
    phone:  document.getElementById("o-phone").value.trim(),
    items:  document.getElementById("o-items").value.trim(),
    total:  document.getElementById("o-total").value,
    status: document.getElementById("o-status").value,
    date:   new Date().toLocaleDateString("en-IN"),
  });
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  closeDialog("orderDialog");
  document.getElementById("orderForm").reset();
  renderOrdersTable();
  toast("✅ Order logged!");
}

function updateOrderStatus(i, status) {
  orders[i].status = status;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  toast("✅ Updated");
}

function deleteOrder(i) {
  orders.splice(i, 1);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  renderOrdersTable();
  toast("🗑 Removed");
}

// ── EXPORT ────────────────────────────────────────────────────
function exportJSON() {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "products.json"; a.click();
  toast("📤 Downloaded!");
}

// ── HELPERS ───────────────────────────────────────────────────
function openDialog(id)  { document.getElementById(id).classList.add("open"); }
function closeDialog(id) { document.getElementById(id).classList.remove("open"); }

function toast(msg) {
  const t = document.getElementById("adminToast");
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}
