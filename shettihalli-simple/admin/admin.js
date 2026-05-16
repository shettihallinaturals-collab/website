// ═══════════════════════════════════════════════════════════════
//  SHETTIHALLI NATURALS — Admin Panel JS
//  Products stored in localStorage (+ export JSON for Sheet)
// ═══════════════════════════════════════════════════════════════

const ADMIN_USER = "admin";
const ADMIN_PASS = "shettihalli2024";
const STORAGE_KEY = "sn_products";
const ORDERS_KEY  = "sn_orders";

let products = [];
let orders   = [];
let deletePendingId = null;

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("sn_admin") === "1") showDashboard();
  else document.getElementById("loginScreen").style.display = "flex";

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab, btn));
  });

  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);
  document.getElementById("exportBtn").addEventListener("click", exportJSON);
  document.getElementById("previewImgBtn").addEventListener("click", previewImg);

  document.getElementById("searchInput").addEventListener("input", renderProductsTable);
  document.getElementById("catFilter").addEventListener("change", renderProductsTable);

  document.getElementById("confirmYes").addEventListener("click", confirmDelete);
  document.getElementById("confirmNo").addEventListener("click",  () => closeDialog("confirmDialog"));

  document.getElementById("addOrderBtn").addEventListener("click", () => openDialog("orderDialog"));
  document.getElementById("closeOrderDialog").addEventListener("click", () => closeDialog("orderDialog"));
  document.getElementById("orderForm").addEventListener("submit", saveOrder);

  document.getElementById("pageDate").textContent = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
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
    err.textContent = "❌ Invalid username or password.";
    err.style.display = "block";
  }
}

function logout() {
  localStorage.removeItem("sn_admin");
  location.reload();
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").classList.remove("hidden");
  loadData();
  renderOverview();
  renderProductsTable();
  renderOrdersTable();
}

// ── DATA ──────────────────────────────────────────────────────
const DEFAULTS = [
  { id:"1", name:"Alphonso Mangoes",    category:"mango",      price:850,  originalPrice:1100, unit:"per dozen",       shortDesc:"The king of mangoes. Sun-ripened, handpicked.", image:"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80", badge:"Bestseller",       inStock:true, stockQty:48, rating:4.9, reviews:234, origin:"Shettihalli, Hassan, Karnataka", weight:"~2.5 kg", harvest:"April–June",  discount:23 },
  { id:"2", name:"Totapuri Mangoes",    category:"mango",      price:450,  originalPrice:580,  unit:"per dozen",       shortDesc:"Crisp and tangy. Perfect for chutneys.",       image:"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80",  badge:"Great Value",      inStock:true, stockQty:72, rating:4.7, reviews:156, origin:"Shettihalli, Hassan, Karnataka", weight:"~3 kg",   harvest:"May–July",    discount:22 },
  { id:"3", name:"Badami Mangoes",      category:"mango",      price:650,  originalPrice:800,  unit:"per dozen",       shortDesc:"Karnataka's pride — sweet, fiber-free, creamy.",image:"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80", badge:"Karnataka Special", inStock:true, stockQty:60, rating:4.8, reviews:189, origin:"Shettihalli, Hassan, Karnataka", weight:"~2.8 kg", harvest:"May–June",    discount:19 },
  { id:"4", name:"Malgova Mangoes",     category:"mango",      price:750,  originalPrice:950,  unit:"per dozen",       shortDesc:"Giant, pulpy, insanely sweet.",                 image:"https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80",  badge:"Giant Size",       inStock:true, stockQty:36, rating:4.7, reviews:98,  origin:"Shettihalli, Hassan, Karnataka", weight:"~4.5 kg", harvest:"June–July",   discount:21 },
  { id:"5", name:"Farm-Fresh Jackfruit",category:"jackfruit",  price:350,  originalPrice:450,  unit:"per piece",       shortDesc:"Heritage trees. Honey-golden bulbs.",           image:"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80", badge:"Heritage Trees",   inStock:true, stockQty:24, rating:4.8, reviews:127, origin:"Shettihalli, Hassan, Karnataka", weight:"4–6 kg",  harvest:"May–Aug",     discount:22 },
  { id:"6", name:"Mango Assortment Box",category:"assortment", price:1299, originalPrice:1800, unit:"per gift box",    shortDesc:"Alphonso + Badami + Totapuri gift-ready.",      image:"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80", badge:"Gift Box",         inStock:true, stockQty:20, rating:5.0, reviews:76,  origin:"Shettihalli, Hassan, Karnataka", weight:"~3 kg",   harvest:"May–June",    discount:28 },
  { id:"7", name:"Raw Jackfruit",       category:"jackfruit",  price:120,  originalPrice:160,  unit:"per kg",          shortDesc:"Cook-ready. Perfect for curries and biryani.",  image:"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80", badge:"Ready to Cook",    inStock:true, stockQty:50, rating:4.6, reviews:88,  origin:"Shettihalli, Hassan, Karnataka", weight:"1–5 kg",  harvest:"Mar–June",    discount:25 },
  { id:"8", name:"Seasonal Fruit Basket",category:"seasonal", price:599,  originalPrice:750,  unit:"per basket",      shortDesc:"Handpicked weekly basket from the farm.",       image:"https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80",  badge:"Weekly Fresh",     inStock:true, stockQty:15, rating:4.7, reviews:112, origin:"Shettihalli, Hassan, Karnataka", weight:"3–4 kg",  harvest:"Year-round",  discount:20 },
];

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  products = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULTS));
  const savedOrders = localStorage.getItem(ORDERS_KEY);
  orders = savedOrders ? JSON.parse(savedOrders) : [];
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function saveOrdersData() {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
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
  const total = products.length;
  const inStock = products.filter(p => p.inStock && p.stockQty > 5).length;
  const low     = products.filter(p => p.inStock && p.stockQty > 0 && p.stockQty <= 5).length;
  const out     = products.filter(p => !p.inStock || p.stockQty === 0).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-in").textContent    = inStock;
  document.getElementById("stat-low").textContent   = low;
  document.getElementById("stat-out").textContent   = out;

  // Low stock list
  const lowList = products.filter(p => p.stockQty <= 5);
  const ll = document.getElementById("lowStockList");
  ll.innerHTML = lowList.length === 0
    ? '<p class="empty-msg">✅ All products well stocked!</p>'
    : lowList.map(p => `<div class="low-stock-item"><span><strong>${p.name}</strong></span><span class="${p.stockQty === 0 ? "badge-pill pill-red" : "badge-pill pill-orange"}">${p.stockQty === 0 ? "Out of Stock" : `Only ${p.stockQty} left`}</span></div>`).join("");

  // Overview table
  document.getElementById("overviewTable").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
    <tbody>${products.map(p => `<tr>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge-pill pill-gray">${p.category}</span></td>
      <td>₹${p.price.toLocaleString("en-IN")} <small style="color:#9ca3af">/${p.unit}</small></td>
      <td>${p.stockQty}</td>
      <td>${stockPill(p)}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function stockPill(p) {
  if (!p.inStock || p.stockQty === 0) return '<span class="badge-pill pill-red">Out of Stock</span>';
  if (p.stockQty <= 5) return `<span class="badge-pill pill-orange">Only ${p.stockQty} left</span>`;
  return '<span class="badge-pill pill-green">In Stock</span>';
}

// ── PRODUCTS TABLE ────────────────────────────────────────────
function renderProductsTable() {
  const q   = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const cat = document.getElementById("catFilter")?.value || "all";
  let list  = products;
  if (cat !== "all") list = list.filter(p => p.category === cat);
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));

  const wrap = document.getElementById("productsTable");
  if (!wrap) return;

  if (list.length === 0) { wrap.innerHTML = '<p class="empty-msg" style="padding:20px">No products found.</p>'; return; }

  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Orig.</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${list.map(p => `<tr data-id="${p.id}">
      <td><strong>${p.name}</strong><br><small style="color:#9ca3af">${p.unit}</small></td>
      <td><span class="badge-pill pill-gray">${p.category}</span></td>
      <td><input type="number" class="inline-input" value="${p.price}" onchange="inlineUpdate('${p.id}','price',this.value)" style="width:80px" /></td>
      <td><input type="number" class="inline-input" value="${p.originalPrice||''}" onchange="inlineUpdate('${p.id}','originalPrice',this.value)" style="width:80px" /></td>
      <td><input type="number" class="inline-input" value="${p.stockQty}" onchange="inlineUpdate('${p.id}','stockQty',this.value)" style="width:70px" /></td>
      <td>${stockPill(p)}</td>
      <td><div class="tbl-actions">
        <button class="btn-toggle ${p.inStock ? '' : 'off'}" onclick="toggleStock('${p.id}')">${p.inStock ? "✅ In" : "❌ Out"}</button>
        <button class="btn-edit" onclick="editProduct('${p.id}')">✏️ Edit</button>
        <button class="btn-del"  onclick="askDelete('${p.id}')">🗑</button>
      </div></td>
    </tr>`).join("")}</tbody>
  </table></div>`;

  // Style inline inputs
  wrap.querySelectorAll(".inline-input").forEach(inp => {
    inp.style.cssText = "padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;outline:none;";
  });
}

function inlineUpdate(id, field, value) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  p[field] = field === "price" || field === "originalPrice" || field === "stockQty" ? Number(value) : value;
  if (field === "stockQty" && Number(value) === 0) p.inStock = false;
  saveData();
  renderOverview();
  toast("✅ Saved!");
}

function toggleStock(id) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  p.inStock = !p.inStock;
  if (p.inStock && p.stockQty === 0) p.stockQty = 1;
  saveData();
  renderProductsTable();
  renderOverview();
  toast(`${p.inStock ? "✅ Marked In Stock" : "❌ Marked Out of Stock"}`);
}

// ── ADD / EDIT PRODUCT ────────────────────────────────────────
function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById("editId").value;

  const data = {
    name:          document.getElementById("f-name").value.trim(),
    category:      document.getElementById("f-cat").value,
    price:         Number(document.getElementById("f-price").value),
    originalPrice: Number(document.getElementById("f-oprice").value) || undefined,
    unit:          document.getElementById("f-unit").value.trim(),
    stockQty:      Number(document.getElementById("f-stock").value),
    badge:         document.getElementById("f-badge").value.trim(),
    inStock:       document.getElementById("f-instock").value === "true",
    image:         document.getElementById("f-img").value.trim(),
    shortDesc:     document.getElementById("f-short").value.trim(),
    origin:        document.getElementById("f-origin").value.trim(),
    weight:        document.getElementById("f-weight").value.trim(),
    harvest:       document.getElementById("f-harvest").value.trim(),
    rating:        4.8,
    reviews:       0,
    discount:      data_discount(Number(document.getElementById("f-price").value), Number(document.getElementById("f-oprice").value)),
  };

  if (id) {
    // Edit existing
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) products[idx] = { ...products[idx], ...data };
    toast("✅ Product updated!");
  } else {
    // New product
    data.id = "p_" + Date.now();
    products.push(data);
    toast("✅ Product added!");
  }

  saveData();
  e.target.reset();
  document.getElementById("imgPreview").classList.add("hidden");
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").textContent = "➕ Add New Product";
  document.getElementById("saveBtn").textContent = "💾 Save Product";
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

  document.getElementById("editId").value     = p.id;
  document.getElementById("f-name").value     = p.name;
  document.getElementById("f-cat").value      = p.category;
  document.getElementById("f-price").value    = p.price;
  document.getElementById("f-oprice").value   = p.originalPrice || "";
  document.getElementById("f-unit").value     = p.unit;
  document.getElementById("f-stock").value    = p.stockQty;
  document.getElementById("f-badge").value    = p.badge || "";
  document.getElementById("f-instock").value  = String(p.inStock);
  document.getElementById("f-img").value      = p.image || "";
  document.getElementById("f-short").value    = p.shortDesc || "";
  document.getElementById("f-origin").value   = p.origin || "";
  document.getElementById("f-weight").value   = p.weight || "";
  document.getElementById("f-harvest").value  = p.harvest || "";

  if (p.image) {
    const prev = document.getElementById("imgPreview");
    prev.src = p.image;
    prev.classList.remove("hidden");
  }

  document.getElementById("formTitle").textContent   = "✏️ Edit Product";
  document.getElementById("saveBtn").textContent      = "💾 Update Product";
  document.getElementById("cancelEditBtn").style.display = "inline-flex";
}

function cancelEdit() {
  document.getElementById("productForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("imgPreview").classList.add("hidden");
  document.getElementById("formTitle").textContent = "➕ Add New Product";
  document.getElementById("saveBtn").textContent   = "💾 Save Product";
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
  saveData();
  closeDialog("confirmDialog");
  renderProductsTable();
  renderOverview();
  toast("🗑 Product deleted");
}

// ── ORDERS ────────────────────────────────────────────────────
function renderOrdersTable() {
  const wrap = document.getElementById("ordersTable");
  if (!wrap) return;
  if (orders.length === 0) { wrap.innerHTML = '<p class="empty-msg">No orders logged yet. Orders come via WhatsApp — log them here for tracking.</p>'; return; }

  const statusPill = s => {
    const map = { pending:"pill-orange", confirmed:"pill-blue", shipped:"pill-purple", delivered:"pill-green", cancelled:"pill-red" };
    return `<span class="badge-pill ${map[s]||'pill-gray'}">${s}</span>`;
  };

  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${orders.map((o,i) => `<tr>
      <td><strong>${orders.length - i}</strong></td>
      <td>${o.name}</td>
      <td>${o.phone}</td>
      <td style="max-width:160px;font-size:13px">${o.items}</td>
      <td><strong>₹${Number(o.total).toLocaleString("en-IN")}</strong></td>
      <td>
        <select onchange="updateOrderStatus(${i},this.value)" style="font-size:12px;padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px">
          ${["pending","confirmed","shipped","delivered","cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}
        </select>
      </td>
      <td style="font-size:12px;color:#9ca3af">${o.date}</td>
      <td>
        <a href="https://wa.me/${o.phone.replace(/\D/g,"")}?text=${encodeURIComponent("Hi "+o.name+"! Your order from Shettihalli Naturals: "+o.items)}" target="_blank" style="font-size:18px">📱</a>
        <button class="btn-del" onclick="deleteOrder(${i})" style="margin-left:6px">🗑</button>
      </td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function saveOrder(e) {
  e.preventDefault();
  orders.unshift({
    name:  document.getElementById("o-name").value.trim(),
    phone: document.getElementById("o-phone").value.trim(),
    items: document.getElementById("o-items").value.trim(),
    total: document.getElementById("o-total").value,
    status:document.getElementById("o-status").value,
    date:  new Date().toLocaleDateString("en-IN"),
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

// ── EXPORT JSON ───────────────────────────────────────────────
function exportJSON() {
  const json = JSON.stringify(products, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "shettihalli-products.json"; a.click();
  toast("📤 products.json downloaded!");
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
