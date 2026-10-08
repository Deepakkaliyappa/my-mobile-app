const LOGO_SRC = "logo.jpeg";

let rowCtr = 0;
let currentFormat = "plain";

function onHeadingChange() {
  const sel = document.getElementById("headingSelect");
  const custom = document.getElementById("headingCustom");
  const hidden = document.getElementById("heading");

  if (sel.value === "__custom__") {
    custom.style.display = "block";
    custom.focus();
    hidden.value = custom.value.trim();
  } else {
    custom.style.display = "none";
    custom.value = "";
    hidden.value = sel.value;
  }
}

function capitalizeFirst(input) {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const val = input.value;
  if (val.length > 0) {
    input.value = val.charAt(0).toUpperCase() + val.slice(1);
  }
  input.setSelectionRange(start, end);
}

function capitalizeName(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const DEFAULT_ITEMS = [
  "LED Par Lights",
  "Sharpy Moving Head Lights",
  "JBL Sound System Set",
  "Mikes (Cordless/Collar)",
  "Podium Microphone",
  "Stage Monitors",
  "Audio Mixer 16-Channel",
  "Focus Lights (Halogen)",
  "Serial Lights Set",
  "T-Stand / Trussing System",
  "Generator Hire",
  "Main Distribution Board",
  "Power Extension Board",
  "Heavy Cabling Set",
  "Smoke Machine / Fogger",
];

let itemsArray = [];

function loadSuggestions() {
  let savedItems = localStorage.getItem("sd_billing_items");
  if (!savedItems) {
    savedItems = JSON.stringify(DEFAULT_ITEMS);
    localStorage.setItem("sd_billing_items", savedItems);
  }
  itemsArray = JSON.parse(savedItems);
  itemsArray.sort();
}

function filterSuggestions(val) {
  const box = document.getElementById("suggestBox");
  box.innerHTML = "";
  if (!val.trim()) {
    box.style.display = "none";
    return;
  }

  const matches = itemsArray.filter((item) =>
    item.toLowerCase().includes(val.toLowerCase())
  );
  if (matches.length === 0) {
    box.style.display = "none";
    return;
  }

  matches.forEach((match) => {
    const div = document.createElement("div");
    div.className = "suggest-item";

    const textSpan = document.createElement("span");
    textSpan.className = "suggest-text";
    textSpan.textContent = match;
    textSpan.onpointerdown = function (e) {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById("p_name").value = match;
      box.style.display = "none";
      document.getElementById("p_name").focus();
    };

   const removeBtn = document.createElement("button");
    removeBtn.className = "suggest-remove";
    removeBtn.type = "button";
    removeBtn.innerHTML = "&times;";
    removeBtn.onpointerdown = function (e) {
      e.preventDefault();
      e.stopPropagation();
      removeSuggestion(match);
    };

    div.appendChild(textSpan);
    div.appendChild(removeBtn);
    box.appendChild(div);
  });
  box.style.display = "block";
}

function removeSuggestion(itemName) {
  let savedItems = localStorage.getItem("sd_billing_items");
  let arr = savedItems ? JSON.parse(savedItems) : [...DEFAULT_ITEMS];
  arr = arr.filter((i) => i.toLowerCase() !== itemName.toLowerCase());
  localStorage.setItem("sd_billing_items", JSON.stringify(arr));
  loadSuggestions();
  filterSuggestions(document.getElementById("p_name").value);
}

function rememberNewItem(itemName) {
  if (!itemName) return;
  let savedItems = localStorage.getItem("sd_billing_items");
  let arr = savedItems ? JSON.parse(savedItems) : [...DEFAULT_ITEMS];
  if (!arr.some((i) => i.toLowerCase() === itemName.toLowerCase())) {
    arr.push(itemName);
    localStorage.setItem("sd_billing_items", JSON.stringify(arr));
    loadSuggestions();
  }
}

function setFormat(fmt) {
  currentFormat = fmt;
  document
    .getElementById("fmt-preprinted")
    .classList.toggle("active", fmt === "preprinted");
  document
    .getElementById("fmt-plain")
    .classList.toggle("active", fmt === "plain");
  updatePageSizeStyle(fmt);
  if (window._B) renderBill(window._B, fmt);
}

// Non Pre-Printed = physical pre-printed letterhead sheet -> custom small size.
// Pre-Printed = app-drawn header on ordinary paper -> standard A4.
function updatePageSizeStyle(fmt) {
  const pageSize = fmt === "plain" ? "142mm 203mm" : "A4";
  let styleTag = document.getElementById("dynamicPageSize");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "dynamicPageSize";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent =
    "@media print{ @page{ size:" + pageSize + " portrait; margin:0; } }";
}

function openModal(rowId) {
  loadSuggestions();
  const isEdit = !!rowId;
  document.getElementById("modalTitle").textContent = isEdit
    ? "Edit Item"
    : "Add New Item";
  document.getElementById("modalSaveBtn").textContent = isEdit
    ? "Update Item"
    : "Add to Bill";
  document.getElementById("edit_id").value = rowId || "";
  document.getElementById("suggestBox").style.display = "none";

  if (isEdit) {
    const row = document.getElementById(rowId);
    document.getElementById("p_name").value = row.children[0].value;
    document.getElementById("p_qty").value = row.children[1].value;
    document.getElementById("p_days").value = row.children[2].value;
    document.getElementById("p_price").value = row.children[3].value;
  } else {
    document.getElementById("p_name").value = "";
    document.getElementById("p_qty").value = "";
    document.getElementById("p_days").value = "";
    document.getElementById("p_price").value = "";
  }
  document.getElementById("itemModal").style.display = "flex";
  document.body.style.overflow = "hidden"; // lock page scroll behind popup
  setTimeout(() => document.getElementById("p_name").focus(), 50);
}

function closeModal() {
  document.getElementById("itemModal").style.display = "none";
  document.body.style.overflow = "";
  document.getElementById("suggestBox").style.display = "none";
}

function saveModal() {
  const name = document.getElementById("p_name").value.trim();
  const qty = document.getElementById("p_qty").value.trim();
  const days = document.getElementById("p_days").value.trim();
  const priceRaw = document.getElementById("p_price").value.trim();
  const price = priceRaw === "" ? "" : Math.round(parseFloat(priceRaw) || 0);

  const editId = document.getElementById("edit_id").value;
  if (!name) {
    alert("Please enter an item name.");
    return;
  }

  rememberNewItem(name);

  if (editId) {
    const row = document.getElementById(editId);
    row.children[0].value = name;
    row.children[1].value = qty;
    row.children[2].value = days;
    row.children[3].value = price;
    calcTot();
  } else {
    rowCtr++;
    addItemRow("ir_" + rowCtr, name, qty, days, price);
  }
  closeModal();
}

function addItemRow(id, n, q, dy, p) {
  const w = document.getElementById("itemsWrap");
  const r = document.createElement("div");
  r.className = "ir";
  r.id = id;
  r.innerHTML =
    '<input value="' +
    esc(n) +
    '" readonly>' +
    '<input value="' +
    esc(q) +
    '" readonly>' +
    '<input value="' +
    esc(dy) +
    '" readonly>' +
    '<input type="number" value="' +
    p +
    '" readonly>' +
    '<span class="ir-l">Qty</span><span class="ir-l">Days</span><span class="ir-l">Rate ₹</span>' +
    '<div class="actions-cell">' +
    '<button class="xbtn x-edit" onclick="openModal(\'' +
    id +
    "')\">✏️</button>" +
    '<button class="xbtn x-del" onclick="document.getElementById(\'' +
    id +
    "').remove();calcTot()\">×</button>" +
    "</div>";
  w.appendChild(r);
  calcTot();
}

function calcTot() {
  let s = 0;
  document.querySelectorAll(".ir").forEach((r) => {
    const v = r.children[3].value;
    if (v === "") return;
    s += parseFloat(v) || 0;
  });
  const di = parseFloat(document.getElementById("disc").value) || 0;
  const ad = parseFloat(document.getElementById("adv").value) || 0;
  const bl = Math.max(0, s - di - ad);
  document.getElementById("s_sub").textContent = "₹" + Math.round(s);
  document.getElementById("s_disc").textContent = "₹" + Math.round(di);
  document.getElementById("s_adv").textContent = "₹" + Math.round(ad);
  document.getElementById("s_bal").textContent = "₹" + Math.round(bl);
  const bt = document.getElementById("barTotal");
  if (bt) bt.textContent = "₹" + Math.round(bl);
}

function fd(v) {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return d + "/" + m + "/" + y;
}

async function generate() {
  calcTot();
  const items = [];
  document.querySelectorAll(".ir").forEach((r) => {
    const nm = r.children[0].value.trim();
    if (!nm) return;
    const priceVal = r.children[3].value;
    items.push({
      name: nm,
      qty: r.children[1].value,
      days: r.children[2].value,
      price: priceVal === "" ? "" : Math.round(parseFloat(priceVal) || 0),
    });
  });
  window._B = {
    heading: document.getElementById("heading").value.trim() || "BILL",
    place: document.getElementById("place").value.trim(),
    customer: capitalizeName(document.getElementById("cust").value.trim()),
    phone: document.getElementById("phon").value.trim(),
    phone2: document.getElementById("phon2").value.trim(),
    address: capitalizeName(document.getElementById("addr").value.trim()),
    date: document.getElementById("bdate").value,
    sub: document.getElementById("s_sub").textContent,
    disc: document.getElementById("s_disc").textContent,
    adv: document.getElementById("s_adv").textContent,
    bal: document.getElementById("s_bal").textContent,
    numDisc: parseFloat(document.getElementById("disc").value) || 0,
    numAdv: parseFloat(document.getElementById("adv").value) || 0,
    items,
  };
  await renderBill(window._B, currentFormat);
  document.getElementById("appUi").style.display = "none";
  document.getElementById("printPage").style.display = "block";
  fitPreview();
  window.scrollTo(0, 0);
}

/* ═══════════════════════════════════════════════════════════════════
   PAGINATION ENGINE  (measure-based, line-by-line)
   -------------------------------------------------------------------
   Instead of guessing "12 or 13 items per page", every page is built at
   its REAL paper size in an invisible sandbox. Rows are added one at a
   time and the real rendered height is checked after each one:
     - a row that wraps to 2-3 lines simply uses more space
     - when the next row would overflow, it starts a new page
     - the totals block (Subtotal / Discount / Advance / Balance Due +
       signature) is kept together; if it does not fit under the last
       row, it moves to the next page as one block
   The SAME page elements are used for preview, print and PDF, so all
   three always match.
   ═══════════════════════════════════════════════════════════════════ */

// Paper sizes in mm.
//  plain      = Non Pre-Printed (your pre-printed letterhead sheet)
//  preprinted = Pre-Printed (app draws header) on normal A4
const PAPER = {
  plain: { w: 142, h: 203 },
  preprinted: { w: 210, h: 297 },
};

// Pages are made 1mm shorter than the sheet. This stops browsers/PDF
// engines from adding a blank page because of rounding.
const PAGE_TRIM_MM = 0.5;

// If the totals block does not fit under the last row, also move the last
// N item rows to the next page so the totals are never alone on a page.
// Set to 0 if you want totals alone on the next page.
const CARRY_ROWS_WITH_TOTALS = 0;

// Row limits per page (measured height can still lower these, never raise them).
const MAX_ROWS_PER_PAGE = 11;       // a page that continues to the next one
const ROWS_BOTH_ADJ = 10;           // totals group has Discount AND Advance
const ROWS_ONE_ADJ = 11;            // only one of Discount / Advance entered
const ROWS_NO_ADJ = 11;             // neither entered (Subtotal + Balance only)

// How many item rows may share a page with the totals group.
function rowsWithTotals(d) {
  const n = (d.numDisc > 0 ? 1 : 0) + (d.numAdv > 0 ? 1 : 0);
  return n === 2 ? ROWS_BOTH_ADJ : n === 1 ? ROWS_ONE_ADJ : ROWS_NO_ADJ;
}

let renderSeq = 0;

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function buildRowEl(it, i) {
  const tr = document.createElement("tr");
  tr.innerHTML =
    '<td style="padding:4px 4px;font-size:12px">' + (i + 1) + "</td>" +
    '<td style="padding:4px 4px;font-size:12px">' + esc(it.name) + "</td>" +
    '<td style="padding:4px 4px;text-align:right;white-space:nowrap">' + esc(it.qty) + "</td>" +
    '<td style="padding:4px 4px;text-align:right;white-space:nowrap">' + esc(it.days) + "</td>" +
    '<td style="padding:4px 4px;text-align:right;white-space:nowrap">' +
    (it.price === "" ? "" : "₹" + it.price) + "</td>";
  return tr;
}

function buildHeaderHTML(showHeader) {
  return showHeader
    ? '<div class="ph">' +
        '<div class="ph-top">' +
        '<div class="ph-lbox"><img src="' + LOGO_SRC + '"></div>' +
        '<div class="ph-mob">Mob : 9964668846<br>9742619525<br>9449663267</div>' +
        "</div>" +
        '<div class="ph-sn">Sri Durga Electrical &amp; Sounds</div>' +
        '<div class="ph-ss">Near Sathyashri Kalyana Mantapa</div>' +
        '<div class="ph-sa">Panemangalore, Bantwal Taluk, D.K. – 574 231</div>' +
        "</div>"
    : '<div class="no-header-spacer"></div>';
}

function buildTopHTML(d) {
  const heading = (d.heading || "BILL").toUpperCase();
  return (
    '<div class="doc-top-row">' +
    '<span class="doc-heading-center">' + esc(heading) + "</span>" +
    '<span class="doc-date">' + fd(d.date) + "</span>" +
    "</div>" +
    '<div class="cust-block">' +
    '<p class="meta-name">' + esc(d.customer || "—") + "</p>" +
    "<p>" + esc(d.phone || "—") + (d.phone2 ? ", " + esc(d.phone2) : "") + "</p>" +
    "<p>" + esc(d.address || "—") + "</p>" +
    (d.place ? '<p class="place-left">📍 ' + esc(d.place) + "</p>" : "") +
    "</div>" +
    '<hr class="dv">'
  );
}

function buildTotalsHTML(d) {
  let rows =
    '<div class="trow"><span class="tl">Subtotal</span><span class="tv">' + d.sub + "</span></div>";
  if (d.numDisc > 0)
    rows += '<div class="trow"><span class="tl">Discount</span><span class="tv">' + d.disc + "</span></div>";
  if (d.numAdv > 0)
    rows += '<div class="trow"><span class="tl">Advance Paid</span><span class="tv">' + d.adv + "</span></div>";
  // Left: "Authorized Signature" (short line above it, same level as the
  // Balance Due line). Right: the Balance Due row.
  return (
    '<div class="totals-wrap">' +
    '<div class="tblk">' + rows + "</div>" +
    '<div class="bal-row">' +
    '<div class="sig-left">Authorized Signature</div>' +
    '<div class="brow"><span>Balance Due</span><span>' + d.bal + "</span></div>" +
    "</div>" +
    "</div>"
  );
}

const CONTINUE_HTML = '<div class="continue-note">Continued on next page →</div>';

function createPage(d, fmt, pageIndex) {
  const paper = PAPER[fmt] || PAPER.plain;
  const page = document.createElement("div");
  page.className = "bill-page";
  page.style.width = paper.w + "mm";
  page.style.height = paper.h - PAGE_TRIM_MM + "mm";
  page.innerHTML =
    buildHeaderHTML(fmt !== "plain") +
    '<div class="pb">' +
    (pageIndex === 0 ? buildTopHTML(d) : "") +
    '<table class="itbl">' +
    '<colgroup><col class="c-no"><col class="c-name"><col class="c-qty"><col class="c-days"><col class="c-amt"></colgroup>' +
    '<thead><tr><th>#</th><th>Item Description</th><th class="r">Qty</th><th class="r">Days</th><th class="r">Amount</th></tr></thead>' +
    "<tbody></tbody></table>" +
    '<div class="pg-foot">' + CONTINUE_HTML + "</div>" +
    "</div>" +
    '<div class="pg-credit">Designed by ❤️ Durga Team</div>' +
    '<div class="pg-num"></div>';
  return page;
}

// True when everything inside the page body (down to the bottom block)
// stays inside the page's usable area.
function pageFits(page) {
  const pb = page.querySelector(".pb");
  const foot = page.querySelector(".pg-foot");
  const limit =
    pb.getBoundingClientRect().bottom - parseFloat(getComputedStyle(pb).paddingBottom || 0);
  return foot.getBoundingClientRect().bottom <= limit + 0.5;
}

function paginate(d, fmt, sandbox) {
  const items = d.items;
  const pages = [];
  let i = 0;

  while (true) {
    const page = createPage(d, fmt, pages.length);
    sandbox.appendChild(page);
    const tbody = page.querySelector("tbody");
    const foot = page.querySelector(".pg-foot");
    let count = 0;

    // 1) Fill rows one by one (a "Continued" note is reserved at the bottom)
    while (i < items.length && count < MAX_ROWS_PER_PAGE) {
      const tr = buildRowEl(items[i], i);
      tbody.appendChild(tr);
      if (count > 0 && !pageFits(page)) {
        tbody.removeChild(tr);
        break;
      }
      i++;
      count++;
    }

    let isLast = false;

    // 2) All items placed -> try to put the totals block on this page
    if (i >= items.length) {
      foot.innerHTML = buildTotalsHTML(d);
      if ((pageFits(page) && count <= rowsWithTotals(d)) || count === 0) {
        isLast = true;
      } else {
        // Totals don't fit here. Move them (and optionally the last row(s)) to the next page.
        const carry = Math.min(CARRY_ROWS_WITH_TOTALS, count - 1);
        for (let k = 0; k < carry; k++) {
          tbody.removeChild(tbody.lastElementChild);
          i--;
          count--;
        }
        foot.innerHTML = CONTINUE_HTML;
      }
    }

    // 3) Empty table (page with no rows) -> remove it
    if (!tbody.children.length) page.querySelector(".itbl").remove();

    pages.push(page);
    if (isLast) break;
  }

  // Page numbers
  if (pages.length > 1) {
    pages.forEach(function (p, idx) {
      p.querySelector(".pg-num").textContent = "Page " + (idx + 1) + " / " + pages.length;
    });
  }
  pages.forEach(function (p) { p.remove(); });
  return pages;
}

// Builds fresh page elements for the given bill (waits for fonts first so
// measured heights are the real ones).
async function buildPages(d, fmt) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* ignore */ }
  }
  const sandbox = document.createElement("div");
  sandbox.style.cssText =
    "position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;";
  document.body.appendChild(sandbox);
  try {
    return paginate(d, fmt, sandbox);
  } finally {
    sandbox.remove();
  }
}

// Shows the pages in the preview, each scaled to fit the phone screen.
async function renderBill(d, fmt) {
  const seq = ++renderSeq;
  const pages = await buildPages(d, fmt);
  if (seq !== renderSeq) return; // a newer render started; drop this one
  const holder = document.getElementById("billPage");
  holder.innerHTML = "";
  pages.forEach(function (p) {
    const scaler = document.createElement("div");
    scaler.className = "page-scaler";
    scaler.appendChild(p);
    holder.appendChild(scaler);
  });
  fitPreview();
}

// Scales real-size pages down to the screen width (preview only).
// Print and PDF always use the real, unscaled size.
function fitPreview() {
  document.querySelectorAll("#billPage .page-scaler").forEach(function (sc) {
    const page = sc.firstElementChild;
    if (!page || !sc.clientWidth) return;
    const s = sc.clientWidth / page.offsetWidth;
    page.style.transform = "scale(" + s + ")";
    sc.style.height = page.offsetHeight * s + "px";
  });
}
window.addEventListener("resize", fitPreview);
window.addEventListener("orientationchange", fitPreview);

function goBack() {
  document.getElementById("printPage").style.display = "none";
  document.getElementById("appUi").style.display = "block";
  window.scrollTo(0, 0);
}

async function doPrint() {
  if (!window._B) {
    alert("Generate the bill first.");
    return;
  }
  updatePageSizeStyle(currentFormat);
  await renderBill(window._B, currentFormat);
  setTimeout(() => window.print(), 250);
}

/* ══ DYNAMIC VISUAL PDF DOWNLOAD ENGINE ══ */
async function doPDF() {
  if (!window._B) {
    alert("Generate the bill first.");
    return;
  }
  if (pdfBusy) return;
  setPdfBusy(true);
  try {
    await ensureHtml2pdf();
  } catch (e) {
    setPdfBusy(false);
    alert(
      "PDF library is missing.\n\nPut the file html2pdf.bundle.min.js in the same folder as index.html " +
        "(or connect to the internet) and refresh the page."
    );
    return;
  }

  // Non Pre-Printed (letterhead sheet) -> custom small size. Pre-Printed -> A4.
  const paper = PAPER[currentFormat] || PAPER.plain;

  const opt = {
    margin: 0,
    filename: "SriDurga-Bill.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: "mm", format: [paper.w, paper.h], orientation: "portrait" },
  };

  try {
    // Fresh, unscaled, real-size pages -> exactly one PDF page each.
    const pages = await buildPages(window._B, currentFormat);

    let worker = html2pdf().set(opt).from(pages[0]).toPdf();
    for (let k = 1; k < pages.length; k++) {
      (function (el) {
        worker = worker
          .get("pdf")
          .then(function (pdf) { pdf.addPage(); })
          .from(el)
          .toContainer()
          .toCanvas()
          .toPdf();
      })(pages[k]);
    }
    const blob = await worker.output("blob");
    finishPdf(blob, "SriDurga-Bill.pdf");
  } catch (err) {
    alert(
      "Could not generate the PDF. Please try again.\n" +
        (err && err.message ? err.message : "")
    );
  } finally {
    setPdfBusy(false);
  }
}

// Makes sure the html2pdf library is loaded. If the local file is missing
// (html2pdf.bundle.min.js next to index.html) it tries the internet copy.
function ensureHtml2pdf() {
  if (typeof html2pdf !== "undefined") return Promise.resolve();
  return new Promise(function (resolve, reject) {
    const srcs = [
      "html2pdf.bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js",
    ];
    (function next(i) {
      if (typeof html2pdf !== "undefined") return resolve();
      if (i >= srcs.length) return reject(new Error("html2pdf not available"));
      const sc = document.createElement("script");
      sc.src = srcs[i];
      sc.onload = function () { typeof html2pdf !== "undefined" ? resolve() : next(i + 1); };
      sc.onerror = function () { next(i + 1); };
      document.head.appendChild(sc);
    })(0);
  });
}

// Download button feedback + double-tap guard while the PDF is being made.
let pdfBusy = false;
function setPdfBusy(on) {
  pdfBusy = on;
  const btn = document.querySelector(".act-btn.tbd");
  if (!btn) return;
  if (on) {
    btn.dataset.label = btn.innerHTML;
    btn.innerHTML = "⏳ Preparing PDF…";
    btn.disabled = true;
  } else {
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    btn.disabled = false;
  }
}

// PDF is ready -> save it straight to the device (no popup, no share sheet).
function finishPdf(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
}

// Robust save/share for Android WebView / APK environments, where a plain
// <a download> click can silently fail. Tries the native share sheet first,
// falls back to a normal download, then to opening the PDF in a new tab.
function savePdfBlob(blob, fileName) {
  const blobUrl = URL.createObjectURL(blob);

  if (navigator.canShare && window.File) {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.canShare({ files: [file] })) {
        navigator
          .share({ files: [file], title: fileName })
          .then(() => URL.revokeObjectURL(blobUrl))
          .catch(() => triggerBlobDownload(blobUrl, fileName));
        return;
      }
    } catch (e) {
      /* fall through to download */
    }
  }

  triggerBlobDownload(blobUrl, fileName);
}

function triggerBlobDownload(blobUrl, fileName) {
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    /* ignore, fallback below still runs */
  }

  // Extra fallback: many WebView-to-APK wrappers intercept window.open /
  // target=_blank navigation and hand it to the system download manager
  // or browser, even when the <a download> click above does nothing.
  setTimeout(function () {
    window.open(blobUrl, "_blank");
  }, 400);
  setTimeout(function () {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
}

document.addEventListener("pointerdown", function (e) {
  const box = document.getElementById("suggestBox");
  if (!box) return;
  if (
    e.target.id !== "p_name" &&
    !e.target.closest(".custom-suggest-panel") &&
    !e.target.closest(".suggest-item")
  ) {
    box.style.display = "none";
  }
});

document.getElementById("headingCustom").addEventListener("input", function () {
  document.getElementById("heading").value = this.value.trim();
});

document.getElementById("bdate").valueAsDate = new Date();
loadSuggestions();


/* ── Light / Dark theme toggle (saved on the device) ── */
function applyThemeUi() {
  const t = document.documentElement.dataset.theme;
  const b = document.getElementById("themeBtn");
  if (b) b.textContent = t === "dark" ? "🌙" : "☀️";
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === "dark" ? "#232838" : "#e6ebf4";
}
function toggleTheme() {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch (e) { /* ignore */ }
  applyThemeUi();
}
applyThemeUi();
