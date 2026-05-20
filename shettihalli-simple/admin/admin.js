// ═══════════════════════════════════════════════════════════════
//  SHETTIHALLI NATURALS — Admin Panel JS
// ═══════════════════════════════════════════════════════════════

const ADMIN_USER      = "admin";
const ADMIN_PASS      = "shettihalli2024";
const STORAGE_KEY     = "sn_products";
const STORAGE_VER     = "v5";
const ORDERS_KEY      = "sn_orders";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyUwJ2I3kJxIxnf_fExlt7SPg6Wz-FnIdVnGoJUOH29D6CuwOwj1gUPW0_N-JU6w-EPQA/exec";

let products        = [];
let orders          = [];
let deletePendingId = null;

document.addEventListener("DOMContentLoaded", () => {
  const storedVer = localStorage.getItem("sn_products_ver");
  if (storedVer !== STORAGE_VER) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem("sn_products_ver", STORAGE_VER);
  }

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
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value;
  const err = document.getElementById("loginError");
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    localStorage.setItem("sn_admin", "1");
    err.style.display = "none";
    showDashboard();
  } else {
    err.textContent   = "❌ Invalid username or password.";
    err.style.display = "block";
  }
}

function logout() { localStorage.removeItem("sn_admin"); location.reload(); }

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").classList.remove("hidden");
  loadData(); renderOverview(); renderProductsTable(); renderOrdersTable();
}

// ── DEFAULTS ──────────────────────────────────────────────────
const DEFAULTS = [
  { id:"1",  name:"Totapuri Mangoes",            category:"mango",     price:450,  originalPrice:580,  unit:"per dozen",         shortDesc:"Crisp and tangy. Perfect for chutneys, pickles and raw mango recipes.",          image:"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80",  badge:"Great Value",       inStock:true, status:"active", stockQty:72, rating:4.7, reviews:156, origin:"Shettihalli, Hassan, Karnataka", weight:"~3 kg",    harvest:"May–July",   discount:22 },
  { id:"2",  name:"Badami Mangoes",              category:"mango",     price:650,  originalPrice:800,  unit:"per dozen",         shortDesc:"Karnataka's own pride — sweet, fiber-free and creamy.",                           image:"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80", badge:"Karnataka Special", inStock:true, status:"active", stockQty:60, rating:4.8, reviews:189, origin:"Shettihalli, Hassan, Karnataka", weight:"~2.8 kg",  harvest:"May–June",   discount:19 },
  { id:"3",  name:"Malgova Mangoes",             category:"mango",     price:750,  originalPrice:950,  unit:"per dozen",         shortDesc:"Giant, pulpy and insanely sweet. The heavyweight champion.",                      image:"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80", badge:"Giant Size",        inStock:true, status:"active", stockQty:36, rating:4.7, reviews:98,  origin:"Shettihalli, Hassan, Karnataka", weight:"~4.5 kg",  harvest:"June–July",  discount:21 },
  { id:"4",  name:"Raspuri Mangoes",             category:"mango",     price:550,  originalPrice:700,  unit:"per dozen",         shortDesc:"The queen of Karnataka mangoes — juicy, fibre-free, with a royal golden hue.",    image:"https://images.unsplash.com/photo-1582655122842-8b9f0e2d0e3e?w=600&q=80", badge:"Queen of Mangoes",  inStock:true, status:"active", stockQty:45, rating:4.8, reviews:112, origin:"Shettihalli, Hassan, Karnataka", weight:"~2.5 kg",  harvest:"April–June", discount:21 },
  { id:"5",  name:"Mallika Mangoes",             category:"mango",     price:600,  originalPrice:780,  unit:"per dozen",         shortDesc:"Intensely sweet with a hint of citrus. No fibres, pure joy.",                    image:"https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80", badge:"Hybrid Delight",    inStock:true, status:"active", stockQty:40, rating:4.7, reviews:87,  origin:"Shettihalli, Hassan, Karnataka", weight:"~2.6 kg",  harvest:"May–June",   discount:23 },
  { id:"6",  name:"Sendhura Mangoes",            category:"mango",     price:500,  originalPrice:650,  unit:"per dozen",         shortDesc:"Deep red-blushed skin, rich sweet pulp. A Karnataka classic.",                   image:"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80", badge:"Farm Favourite",    inStock:true, status:"active", stockQty:50, rating:4.6, reviews:76,  origin:"Shettihalli, Hassan, Karnataka", weight:"~2.7 kg",  harvest:"May–July",   discount:23 },
  { id:"7",  name:"Neelam Mangoes",              category:"mango",     price:420,  originalPrice:550,  unit:"per dozen",         shortDesc:"Small, golden, intensely fragrant. The last mango of the season.",                image:"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80",  badge:"Season Ender",      inStock:true, status:"active", stockQty:55, rating:4.6, reviews:94,  origin:"Shettihalli, Hassan, Karnataka", weight:"~2 kg",    harvest:"June–Aug",   discount:24 },
  { id:"8",  name:"Farm-Fresh Jackfruit (whole)",category:"jackfruit", price:350,  originalPrice:450,  unit:"per piece (~5 kg)", shortDesc:"60-year-old heritage trees. Honey-golden bulbs with intense sweetness.",          image:"https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80", badge:"Heritage Trees",    inStock:true, status:"active", stockQty:24, rating:4.8, reviews:127, origin:"Shettihalli, Hassan, Karnataka", weight:"4–6 kg",   harvest:"May–Aug",    discount:22 },
  { id:"9",  name:"Jackfruit Peeled",            category:"jackfruit", price:180,  originalPrice:240,  unit:"per kg",            shortDesc:"Ready-to-eat sweet jackfruit bulbs — cleaned, peeled and packed fresh.",           image:"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80", badge:"Ready to Eat",      inStock:true, status:"active", stockQty:30, rating:4.7, reviews:88,  origin:"Shettihalli, Hassan, Karnataka", weight:"500g–2 kg", harvest:"May–Aug",    discount:25 },
  { id:"10", name:"Raw Jackfruit (For Curry)",   category:"jackfruit", price:120,  originalPrice:160,  unit:"per kg",            shortDesc:"Cook-ready raw jackfruit pieces. Firm, meaty texture for curries.",               image:"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80", badge:"Ready to Cook",     inStock:true, status:"active", stockQty:50, rating:4.6, reviews:88,  origin:"Shettihalli, Hassan, Karnataka", weight:"1–5 kg",   harvest:"Mar–June",   discount:25 },
  { id:"11", name:"Kiru Nallikayi / Amla",       category:"seasonal",  price:80,   originalPrice:110,  unit:"per kg",            shortDesc:"Fresh Indian gooseberries — tangy, nutrient-packed, straight from the farm.",     image:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80", badge:"Superfood",         inStock:true, status:"active", stockQty:40, rating:4.7, reviews:62,  origin:"Shettihalli, Hassan, Karnataka", weight:"500g / 1 kg / 2 kg", harvest:"Oct–Feb", discount:27 },
  { id:"12", name:"Nerale Hannu / Jamun",        category:"seasonal",  price:120,  originalPrice:160,  unit:"per kg",            shortDesc:"Dark, juicy jamun berries — sweet-tart, deeply flavourful, seasonal and rare.",   image:"https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80", badge:"Rare & Seasonal",   inStock:true, status:"active", stockQty:20, rating:4.8, reviews:48,  origin:"Shettihalli, Hassan, Karnataka", weight:"500g / 1 kg", harvest:"June–July",  discount:25 },
  { id:"13", name:"Mango Pickle",                category:"kitchen",   price:220,  originalPrice:280,  unit:"per 500g jar",      shortDesc:"Traditional spiced mango pickle — made from farm-fresh raw mangoes.",             image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80", badge:"Home Recipe",       inStock:true, status:"active", stockQty:35, rating:4.9, reviews:143, origin:"Shettihalli, Hassan, Karnataka", weight:"500g jar",  harvest:"Year-round", discount:21 },
  { id:"14", name:"Puliyogare Gojju",            category:"kitchen",   price:180,  originalPrice:230,  unit:"per 300g jar",      shortDesc:"Authentic tamarind-spice paste for instant puliyogare rice. Zero preservatives.", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80", badge:"Authentic Recipe",  inStock:true, status:"active", stockQty:28, rating:4.8, reviews:97,  origin:"Shettihalli, Hassan, Karnataka", weight:"300g jar",  harvest:"Year-round", discount:22 },
  { id:"15", name:"Maavinkaayi Chitranna Gojju", category:"kitchen",   price:160,  originalPrice:210,  unit:"per 300g jar",      shortDesc:"Raw mango gojju for chitranna — tangy, spicy and utterly Karnataka.",            image:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80", badge:"Karnataka Special", inStock:true, status:"active", stockQty:25, rating:4.8, reviews:74,  origin:"Shettihalli, Hassan, Karnataka", weight:"300g jar",  harvest:"Year-round", discount:24 },
  { id:"16", name:"Mango Assortment Box",        category:"assortment",price:1299, originalPrice:1800, unit:"per gift box",       shortDesc:"Badami + Raspuri + Totapuri — curated and beautifully gift-packed.",             image:"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80", badge:"Gift Box",          inStock:true, status:"active", stockQty:20, rating:5.0, reviews:76,  origin:"Shettihalli, Hassan, Karnataka", weight:"~3 kg mix", harvest:"May–June",   discount:28 },
];

// ── DATA ──────────────────────────────────────────────────────
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  products    = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULTS));
  products    = products.map(p => ({ status:"active", ...p })); // migrate old data
  const savedOrders = localStorage.getItem(ORDERS_KEY);
  orders = savedOrders ? JSON.parse(savedOrders) : [];
}

// ── SINGLE saveData — sends ALL products to replace sheet ─────
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  if (!APPS_SCRIPT_URL) return;
  fetch(APPS_SCRIPT_URL, {
    method:  "POST",
    mode:    "no-cors",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ action: "deleteAll", products }),
  }).catch(() => {});
}

function saveOrdersData() { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }

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
  document.getElementById("stat-low").textContent   = products.filter(p => p.inStock && p.stockQty > 0 && p.stockQty <= 5).length;
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

  document.getElementById("overviewTable").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
    <tbody>${products.map(p => `<tr>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge-pill pill-gray">${p.category}</span></td>
      <td>₹${p.price.toLocaleString("en-IN")} <small style="color:#9ca3af">/${p.unit}</small></td>
      <td>${p.stockQty}</td>
      <td>${statusPill(p)}</td>
    </tr>`).join("")}</tbody></table></div>`;
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
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));

  const wrap = document.getElementById("productsTable");
  if (!wrap) return;
  if (list.length === 0) { wrap.innerHTML = '<p class="empty-msg" style="padding:20px">No products found.</p>'; return; }

  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${list.map(p => `<tr>
      <td><strong>${p.name}</strong><br><small style="color:#9ca3af">${p.unit}</small></td>
      <td><span class="badge-pill pill-gray">${p.category}</span></td>
      <td><input type="number" class="inline-input" value="${p.price}" onchange="inlineUpdate('${p.id}','price',this.value)" style="width:80px" /></td>
      <td><input type="number" class="inline-input" value="${p.stockQty}" onchange="inlineUpdate('${p.id}','stockQty',this.value)" style="width:65px" /></td>
      <td>
        <select onchange="inlineUpdate('${p.id}','status',this.value)" class="inline-select">
          <option value="active" ${(p.status || "active") === "active" ? "selected" : ""}>✅ Active</option>
          <option value="coming_soon" ${p.status === "coming_soon" ? "selected" : ""}>🔔 Coming Soon</option>
          <option value="sold_out" ${p.status === "sold_out" ? "selected" : ""}>❌ Sold Out</option>
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

function inlineUpdate(id, field, value) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  if (field === "price" || field === "stockQty") {
    p[field] = Number(value);
    if (field === "stockQty" && Number(value) === 0) { p.inStock = false; p.status = "sold_out"; }
    if (field === "stockQty" && Number(value) > 0 && p.status === "sold_out") { p.inStock = true; p.status = "active"; }
  } else if (field === "status") {
    p.status  = value;
    p.inStock = (value === "active");
  } else {
    p[field] = value;
  }
  saveData();
  renderOverview();
  toast("✅ Saved & synced to Sheet!");
}

// ── ADD / EDIT ────────────────────────────────────────────────
function saveProduct(e) {
  e.preventDefault();
  const id     = document.getElementById("editId").value;
  const status = document.getElementById("f-status").value;
  const data   = {
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
    origin:        document.getElementById("f-origin").value.trim(),
    weight:        document.getElementById("f-weight").value.trim(),
    harvest:       document.getElementById("f-harvest").value.trim(),
    rating:  4.8,
    reviews: 0,
    discount: data_discount(
        Number(document.getElementById("f-price").value),
        Number(document.getElementById("f-oprice").value)
    ),
  };

  if (id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) products[idx] = { ...products[idx], ...data };
    toast("✅ Product updated & synced!");
  } else {
    data.id = "p_" + Date.now();
    products.push(data);
    toast("✅ Product added & synced!");
  }

  saveData();
  e.target.reset();
  document.getElementById("imgPreview").classList.add("hidden");
  document.getElementById("editId").value              = "";
  document.getElementById("formTitle").textContent     = "➕ Add New Product";
  document.getElementById("saveBtn").textContent       = "💾 Save Product";
  document.getElementById("cancelEditBtn").style.display = "none";
  renderOverview();
  renderProductsTable();
}

function data_discount(price, orig) {
  if (!orig || orig <= price) return 0;
  return Math.round((orig - price) / orig * 100);
}

function editProduct(id) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  switchTab("add", document.querySelector('[data-tab="add"]'));
  document.getElementById("editId").value    = p.id;
  document.getElementById("f-name").value   = p.name;
  document.getElementById("f-cat").value    = p.category;
  document.getElementById("f-price").value  = p.price;
  document.getElementById("f-oprice").value = p.originalPrice || "";
  document.getElementById("f-unit").value   = p.unit;
  document.getElementById("f-stock").value  = p.stockQty;
  document.getElementById("f-badge").value  = p.badge || "";
  document.getElementById("f-status").value = p.status || "active";
  document.getElementById("f-img").value    = p.image || "";
  document.getElementById("f-short").value  = p.shortDesc || "";
  document.getElementById("f-origin").value = p.origin || "";
  document.getElementById("f-weight").value = p.weight || "";
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
  const url  = document.getElementById("f-img").value.trim();
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
  saveData(); // sends deleteAll with remaining products — Sheet is fully replaced
  closeDialog("confirmDialog");
  renderProductsTable();
  renderOverview();
  toast("🗑 Deleted & Sheet updated!");
}

// ── ORDERS ────────────────────────────────────────────────────
function renderOrdersTable() {
  const wrap = document.getElementById("ordersTable");
  if (!wrap) return;
  if (orders.length === 0) {
    wrap.innerHTML = '<p class="empty-msg">No orders logged yet.</p>';
    return;
  }
  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${orders.map((o, i) => `<tr>
      <td><strong>${orders.length - i}</strong></td>
      <td>${o.name}</td>
      <td>${o.phone}</td>
      <td style="max-width:160px;font-size:13px">${o.items}</td>
      <td><strong>₹${Number(o.total).toLocaleString("en-IN")}</strong></td>
      <td>
        <select onchange="updateOrderStatus(${i},this.value)" style="font-size:12px;padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px">
          ${["pending","confirmed","shipped","delivered","cancelled"].map(s =>
      `<option ${o.status === s ? "selected" : ""}>${s}</option>`
  ).join("")}
        </select>
      </td>
      <td style="font-size:12px;color:#9ca3af">${o.date}</td>
      <td>
        <a href="https://wa.me/${o.phone.replace(/\D/g,"")}?text=${encodeURIComponent("Hi " + o.name + "! Your Shettihalli Naturals order: " + o.items)}" target="_blank" style="font-size:18px">📱</a>
        <button class="btn-del" onclick="deleteOrder(${i})" style="margin-left:6px">🗑</button>
      </td>
    </tr>`).join("")}</tbody></table></div>`;
}

function saveOrder(e) {
  e.preventDefault();
  orders.unshift({
    name:   document.getElementById("o-name").value.trim(),
    phone:  document.getElementById("o-phone").value.trim(),
    items:  document.getElementById("o-items").value.trim(),
    total:  document.getElementById("o-total").value,
    status: document.getElementById("o-status").value,
    date:   new Date().toLocaleDateString("en-IN"),
  });
  saveOrdersData();
  closeDialog("orderDialog");
  document.getElementById("orderForm").reset();
  renderOrdersTable();
  toast("✅ Order logged!");
}

function updateOrderStatus(i, status) {
  orders[i].status = status;
  saveOrdersData();
  toast("✅ Status updated");
}

function deleteOrder(i) {
  orders.splice(i, 1);
  saveOrdersData();
  renderOrdersTable();
  toast("🗑 Order removed");
}

// ── EXPORT ────────────────────────────────────────────────────
function exportJSON() {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = "shettihalli-products.json";
  a.click();
  toast("📤 Downloaded!");
}

// ── HELPERS ───────────────────────────────────────────────────
function openDialog(id)  { document.getElementById(id).classList.add("open"); }
function closeDialog(id) { document.getElementById(id).classList.remove("open"); }

function toast(msg) {
  const t = document.getElementById("adminToast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}
