// ============================================================
// ui.js — All DOM/UI Rendering Lives Here
// This file never does data calculations — it only displays things.
// It calls functions from dataProcessor.js to get data.
// ============================================================

import {
  getSummaryStats,
  searchRecords,
  sortRecords,
  paginateRecords,
  filterByStatus,
  filterByCategory,
  memoizedCategoryReport,
  performanceComparison,
  batchRecords,
  dataStore,
  groupBy,
  uniqueValues,
  removeDuplicatesBy,
  getSymbolId,
  symbolDemo,
  totalRecords,
  averageValue,
  completionPercent,
  setMeta,
  getMeta,
  markViewed,
  isViewed,
  mapMethodsDemo,
  setMethodsDemo,
  factorial,
  allRecordsViaYieldStar,
  double,
  triple,
  makeCounter,
  mapRecords,
} from "./dataProcessor.js";

import { runExecutionDemo, callStackDemo, stackOverflowDemo, runIntervalDemo } from "./executionDemo.js";
import { runThisDemo } from "./thisDemo.js";

// ─────────────────────────────────────────────
// App State — tracks current UI state
// ─────────────────────────────────────────────
let state = {
  query:     "",
  status:    "",
  category:  "",
  sortField: "id",
  sortDir:   "asc",
  page:      1,
  pageSize:  10,
};

// ─────────────────────────────────────────────
// BOOT — called once the page loads
// ─────────────────────────────────────────────
export function init() {
  renderNav();
  showTab("dashboard");
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function renderNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showTab(btn.dataset.tab);
    });
  });
}

function showTab(tabName) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
  document.getElementById(`tab-${tabName}`).classList.remove("hidden");

  if (tabName === "dashboard") renderDashboard();
  if (tabName === "table")     renderTable();
  if (tabName === "execution") renderExecution();
  if (tabName === "this")      renderThisDemo();
  if (tabName === "concepts")  renderConcepts();
  if (tabName === "perf")      renderPerformance();
}

// ─────────────────────────────────────────────
// DASHBOARD TAB
// ─────────────────────────────────────────────
function renderDashboard() {
  const stats  = getSummaryStats();
  const area   = document.getElementById("dashboard-area");

  // Summary cards
  const cards = [
    { label: "Total Records",   value: stats.total,        icon: "📋", color: "blue" },
    { label: "Avg Value",       value: `\$${stats.avgValue}`, icon: "💰", color: "green" },
    { label: "Completed",       value: `${stats.completed}%`, icon: "✅", color: "purple" },
    { label: "Categories",      value: stats.categories.length, icon: "🏷️", color: "orange" },
    { label: "Team Members",    value: stats.users.length,    icon: "👥", color: "pink" },
  ];

  let html = `<div class="cards-row">
    ${cards.map(c => `
      <div class="card card-${c.color}">
        <div class="card-icon">${c.icon}</div>
        <div class="card-value">${c.value}</div>
        <div class="card-label">${c.label}</div>
      </div>`).join("")}
  </div>`;

  // Status distribution
  html += `<h3>📊 Status Distribution</h3><div class="status-bars">`;
  for (const status of stats.statuses) {
    const list  = filterByStatus(status);
    const pct   = Math.round((list.length / stats.total) * 100);
    html += `
      <div class="bar-row">
        <span class="bar-label">${status}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="bar-count">${list.length} (${pct}%)</span>
      </div>`;
  }
  html += `</div>`;

  // Category report (memoized)
  html += `<h3>🏷️ Category Reports (memoized)</h3><div class="category-grid">`;
  for (const cat of stats.categories) {
    const { result, fromCache } = memoizedCategoryReport(cat);
    html += `
      <div class="cat-card">
        <strong>${result.category}</strong>
        ${fromCache ? `<span class="badge cache">⚡ cached</span>` : `<span class="badge fresh">🆕 fresh</span>`}
        <div>Count: ${result.count}</div>
        <div>Avg Value: \$${result.avgValue}</div>
        <div>Completed: ${result.completed}%</div>
        <div>Total Value: \$${result.totalValue}</div>
      </div>`;
  }
  html += `</div>`;

  // Grouped by user (using Map)
  const byUser = groupBy("user");
  html += `<h3>👥 Records by User (Map)</h3><div class="user-grid">`;
  for (const [user, recs] of byUser) {
    html += `<div class="user-pill"><strong>${user}</strong>: ${recs.length} records</div>`;
  }
  html += `</div>`;

  // Unique values (Set)
  const uniqueCats = uniqueValues("category");
  html += `<h3>🔖 Unique Categories (Set)</h3>
    <p class="set-demo">${[...uniqueCats].join(" • ")}</p>`;

  // Symbol demo
  const firstRecord = [...dataStore][0];
  const symId = getSymbolId(firstRecord);
  const symData = symbolDemo();
  html += `<h3>🔑 Symbol Property Demo</h3>
    <p>Record #1 has a hidden Symbol ID: <code>${symId}</code></p>
    <p class="note">This Symbol key is invisible to <code>JSON.stringify()</code> and <code>for...in</code> loops — only code that holds the Symbol can access it.</p>
    <div class="concept-box" style="margin-top:8px">
      <strong>Symbol() — always unique:</strong> sym1 === sym2 → <code>${symData.areEqual}</code> (even with same description!)<br>
      <strong>Symbol.for() — global registry:</strong> Symbol.for("app.userId") === Symbol.for("app.userId") → <code>${symData.globalEqual}</code><br>
      <strong>Symbol.keyFor():</strong> keyFor(globalSym) → <code>"${symData.keyName}"</code><br>
      <strong>Well-known Symbols:</strong>
      <ul style="margin-top:6px">
        <li><code>${symData.wellKnown["Symbol.iterator"]}</code> — makes objects iterable (we used this in dataStore!)</li>
        <li><code>${symData.wellKnown["Symbol.toPrimitive"]}</code> — controls how objects convert to number/string</li>
        <li><code>${symData.wellKnown["Symbol.hasInstance"]}</code> — controls instanceof behaviour</li>
      </ul>
    </div>`;

  // WeakMap + WeakSet demo
  setMeta(firstRecord, { highlighted: true, viewedAt: new Date().toLocaleTimeString() });
  markViewed(firstRecord);
  const meta = getMeta(firstRecord);
  const viewed = isViewed(firstRecord);
  html += `<h3>🗂️ WeakMap + WeakSet Demo</h3>
    <p><strong>WeakMap:</strong> Attached metadata to record #1: <code>${JSON.stringify(meta)}</code></p>
    <p><strong>WeakSet:</strong> Marked record #1 as "viewed": <code>${viewed}</code></p>
    <p class="note">Both WeakMap and WeakSet hold weak references — if the object is no longer used anywhere else, JavaScript can garbage-collect it and the entry disappears automatically. This prevents memory leaks.</p>`;

  // Generator / batch demo
  html += `<h3>⚙️ Generator Batch Demo (10 at a time)</h3><div class="batch-demo">`;
  let batchNum = 0;
  for (const batch of batchRecords(10)) {
    batchNum++;
    if (batchNum > 3) { html += `<p class="note">… and ${12 - 3} more batches (showing first 3)</p>`; break; }
    html += `<div class="batch-box">
      <strong>Batch ${batchNum}</strong> (${batch.length} records):
      IDs ${batch[0].id}–${batch[batch.length - 1].id}
    </div>`;
  }
  html += `</div>`;

  // yield* demo
  let totalViaYieldStar = 0;
  for (const batch of allRecordsViaYieldStar()) {
    totalViaYieldStar += batch.length;
  }
  html += `<p><strong>yield* demo:</strong> <code>allRecordsViaYieldStar()</code> used <code>yield*</code> to delegate to <code>batchRecords()</code> — counted ${totalViaYieldStar} total records this way.</p>`;

  // Recursion demo
  html += `<h3>🔁 Recursion Demo</h3>
    <p><code>factorial(n)</code> calls itself with smaller values until n=1 (the base case).</p>
    <p>factorial(5) = ${factorial(5)} &nbsp;|&nbsp; factorial(8) = ${factorial(8)} &nbsp;|&nbsp; factorial(10) = ${factorial(10)}</p>`;

  // Iterable demo
  html += `<h3>🔄 Custom Iterable (for...of)</h3>`;
  let iterCount = 0;
  for (const r of dataStore) { iterCount++; if (iterCount >= 5) break; }
  html += `<p>Iterated through records using <code>for (const r of dataStore)</code>. First 5 IDs: ${
    [...dataStore].slice(0, 5).map(r => r.id).join(", ")
  }</p>`;

  area.innerHTML = html;

  // Trigger second visit to show caching — only if not already in a re-render
  if (!renderDashboard._cacheShown) {
    renderDashboard._cacheShown = true;
    setTimeout(() => {
      for (const cat of stats.categories) memoizedCategoryReport(cat);
      renderDashboard._cacheShown = false;
      renderDashboard();
    }, 80);
  }
}

// ─────────────────────────────────────────────
// TABLE TAB (search, filter, sort, paginate)
// ─────────────────────────────────────────────
function renderTable() {
  const area = document.getElementById("table-area");
  area.innerHTML = `
    <div class="controls-row">
      <input id="search-input" class="search-box" placeholder="🔍 Search title or user…" value="${state.query}">
      <select id="filter-status">
        <option value="">All Statuses</option>
        ${["Pending","In Progress","Completed","On Hold","Cancelled"]
          .map(s => `<option ${state.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <select id="filter-category">
        <option value="">All Categories</option>
        ${["Development","Design","Marketing","Testing","DevOps","Research"]
          .map(c => `<option ${state.category === c ? "selected" : ""}>${c}</option>`).join("")}
      </select>
      <select id="page-size">
        ${[5,10,20,50].map(n => `<option value="${n}" ${state.pageSize === n ? "selected" : ""}>${n} per page</option>`).join("")}
      </select>
    </div>
    <div id="table-output"></div>
    <div id="pagination-row" class="pagination-row"></div>`;

  document.getElementById("search-input").addEventListener("input", e => {
    state.query = e.target.value; state.page = 1; updateTable();
  });
  document.getElementById("filter-status").addEventListener("change", e => {
    state.status = e.target.value; state.page = 1; updateTable();
  });
  document.getElementById("filter-category").addEventListener("change", e => {
    state.category = e.target.value; state.page = 1; updateTable();
  });
  document.getElementById("page-size").addEventListener("change", e => {
    state.pageSize = Number(e.target.value); state.page = 1; updateTable();
  });

  updateTable();
}

function updateTable() {
  // 1. Search
  let list = searchRecords(state.query);
  // 2. Filter
  if (state.status)   list = list.filter(r => r.status   === state.status);
  if (state.category) list = list.filter(r => r.category === state.category);
  // 3. Sort
  list = sortRecords(list, state.sortField, state.sortDir);
  // 4. Paginate
  const { items, totalPages, total } = paginateRecords(list, state.page, state.pageSize);

  // Build table
  const fields = ["id","title","category","status","user","priority","date","value"];
  const headerHtml = fields.map(f => {
    const isSorted = state.sortField === f;
    const arrow    = isSorted ? (state.sortDir === "asc" ? " ▲" : " ▼") : "";
    return `<th class="sortable ${isSorted ? "sorted" : ""}" data-field="${f}">${f}${arrow}</th>`;
  }).join("");

  const rowsHtml = items.length === 0
    ? `<tr><td colspan="${fields.length}" class="empty">No records found</td></tr>`
    : items.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>${r.title}</td>
          <td><span class="badge cat">${r.category}</span></td>
          <td><span class="badge status-${r.status.replace(/\s/g,"-")}">${r.status}</span></td>
          <td>${r.user}</td>
          <td><span class="badge priority-${r.priority}">${r.priority}</span></td>
          <td>${r.date}</td>
          <td>\$${r.value}</td>
        </tr>`).join("");

  document.getElementById("table-output").innerHTML = `
    <p class="result-count">Showing ${items.length} of ${total} record(s)</p>
    <table class="data-table">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;

  // Sort click handlers
  document.querySelectorAll(".sortable").forEach(th => {
    th.addEventListener("click", () => {
      if (state.sortField === th.dataset.field) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortField = th.dataset.field;
        state.sortDir   = "asc";
      }
      updateTable();
    });
  });

  // Pagination
  let pagHtml = "";
  if (totalPages > 1) {
    pagHtml += `<button ${state.page === 1 ? "disabled" : ""} data-page="${state.page - 1}">◀ Prev</button>`;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - state.page) <= 2) {
        pagHtml += `<button class="${p === state.page ? "active-page" : ""}" data-page="${p}">${p}</button>`;
      } else if (Math.abs(p - state.page) === 3) {
        pagHtml += `<span>…</span>`;
      }
    }
    pagHtml += `<button ${state.page === totalPages ? "disabled" : ""} data-page="${state.page + 1}">Next ▶</button>`;
  }
  const pagRow = document.getElementById("pagination-row");
  pagRow.innerHTML = pagHtml;
  pagRow.querySelectorAll("button[data-page]").forEach(btn => {
    btn.addEventListener("click", () => { state.page = Number(btn.dataset.page); updateTable(); });
  });
}

// ─────────────────────────────────────────────
// EXECUTION ORDER TAB
// ─────────────────────────────────────────────
function renderExecution() {
  const area = document.getElementById("execution-area");

  const callSteps   = callStackDemo();
  const overflowRes = stackOverflowDemo();

  area.innerHTML = `
    <h3>⚙️ Call Stack Demo</h3>
    <p>When you call <code>a()</code> which calls <code>b()</code> which calls <code>c()</code>, here's what happens:</p>
    <div class="log-box">
      ${callSteps.map(s => `<div class="log-line log-sync">${s}</div>`).join("")}
    </div>

    <h3>💥 Stack Overflow Demo</h3>
    <div class="log-box">
      <div class="log-line ${overflowRes.overflowed ? "log-error" : "log-sync"}">${overflowRes.message}</div>
    </div>

    <h3>⏱️ Execution Order: Sync → Microtask → Macrotask</h3>
    <p>Click the button to run the demo and watch the order things happen:</p>
    <button id="run-exec-btn" class="btn-primary">▶ Run Execution Order Demo</button>
    <div id="exec-log" class="log-box" style="margin-top:12px">
      <div class="log-line log-info">Click the button above to start…</div>
    </div>

    <h3>⏰ setInterval Demo</h3>
    <p>setInterval runs a callback repeatedly on a timer. Click to see 3 ticks then auto-stop.</p>
    <button id="run-interval-btn" class="btn-primary">▶ Run setInterval Demo</button>
    <div id="interval-log" class="log-box" style="margin-top:12px">
      <div class="log-line log-info">Click the button above to start…</div>
    </div>

    <div class="concept-box">
      <h4>How it works:</h4>
      <ul>
        <li><strong>Synchronous</strong> code runs first — it's on the Call Stack</li>
        <li><strong>Microtasks</strong> (Promise.then, queueMicrotask) run next — before the browser can render or run timers</li>
        <li><strong>Macrotasks</strong> (setTimeout, setInterval) run last — after microtasks are all done</li>
        <li><strong>setInterval</strong> keeps firing on its delay until you call clearInterval()</li>
      </ul>
      <p>This is the <strong>Event Loop</strong>: it keeps pulling tasks from the queues and running them one at a time.</p>
    </div>

    <h3>🖼️ Rendering Opportunities & Browser Runtime</h3>
    <div class="concept-box">
      <p>The browser gets a chance to <strong>repaint the screen (render)</strong> only between event loop ticks — specifically after all microtasks are drained and before the next macrotask starts.</p>
      <ul>
        <li><strong>JavaScript Engine</strong> (e.g. V8) — executes your JS code, one thread</li>
        <li><strong>Browser APIs</strong> (Web APIs) — handle timers, fetch, DOM events outside the JS engine</li>
        <li><strong>Render step</strong> — happens roughly every 16ms (60fps). If JS runs for too long, rendering is blocked and the page freezes</li>
      </ul>
      <pre>
// This blocks rendering for 2 seconds — the page FREEZES:
const start = Date.now();
while (Date.now() - start &lt; 2000) {} // ← never give browser a chance to render

// Better: break work into small pieces using setTimeout or requestAnimationFrame
// so the browser can render between each piece
setTimeout(() =&gt; doNextChunk(), 0); // yields back to event loop → browser can render
      </pre>
      <p>⚠️ This is why <strong>long synchronous loops block the UI</strong> — the browser can only repaint when the call stack is empty.</p>
    </div>`;

  document.getElementById("run-exec-btn").addEventListener("click", () => {
    const logBox = document.getElementById("exec-log");
    logBox.innerHTML = `<div class="log-line log-info">Running…</div>`;

    const { entries } = runExecutionDemo();

    // Show sync entries immediately
    logBox.innerHTML = entries.map(e => `
      <div class="log-line log-${e.source.toLowerCase()}">
        Step ${e.step}: [${e.source}] ${e.message}
      </div>`).join("");

    // The async entries arrive via the callback set in executionDemo.js
    window._executionDemoReady = (allEntries) => {
      logBox.innerHTML = allEntries.map(e => `
        <div class="log-line log-${e.source.toLowerCase()}">
          Step ${e.step}: [${e.source}] ${e.message}
        </div>`).join("");
    };
  });

  // setInterval demo button
  document.getElementById("run-interval-btn").addEventListener("click", () => {
    const intervalLog = document.getElementById("interval-log");
    intervalLog.innerHTML = `<div class="log-line log-info">Starting setInterval(500ms)…</div>`;
    document.getElementById("run-interval-btn").disabled = true;
    runIntervalDemo((msg) => {
      intervalLog.innerHTML += `<div class="log-line log-macrotask">⏰ ${msg}</div>`;
      if (msg.includes("stopped")) {
        document.getElementById("run-interval-btn").disabled = false;
      }
    });
  });
}

// ─────────────────────────────────────────────
// THIS DEMO TAB
// ─────────────────────────────────────────────
function renderThisDemo() {
  const area    = document.getElementById("this-area");
  const results = runThisDemo();

  area.innerHTML = `
    <h3>🔍 How "this" Changes in JavaScript</h3>
    <div class="log-box">
      ${results.map(r => `
        <div class="this-row">
          <span class="this-label">${r.label}</span>
          <span class="this-output">${r.output}</span>
        </div>`).join("")}
    </div>
    <div class="concept-box">
      <h4>Key Rules:</h4>
      <ul>
        <li><strong>Regular function</strong>: "this" = whoever called it</li>
        <li><strong>Arrow function</strong>: "this" = inherited from surrounding code (lexical)</li>
        <li><strong>Detached callback</strong>: "this" is lost — becomes undefined or window</li>
        <li><strong>.bind()</strong>: permanently locks "this" to a specific object</li>
        <li><strong>.call() / .apply()</strong>: set "this" for one specific call</li>
      </ul>
    </div>`;
}

// ─────────────────────────────────────────────
// CONCEPTS TAB — All data structures explained
// ─────────────────────────────────────────────
function renderConcepts() {
  const area = document.getElementById("concepts-area");

  // Duplicate removal demo
  const uniqueByCategory = removeDuplicatesBy("category");
  const pureFnResults = {
    total:      totalRecords(),
    avg:        averageValue(),
    completion: completionPercent(),
  };
  const mapDemo = mapMethodsDemo();
  const setDemo = setMethodsDemo();

  // Live demos for new concepts
  const counter   = makeCounter(0);
  counter.increment(); counter.increment(); counter.increment();
  const counterVal = counter.value(); // 3

  const titlesDoubled = mapRecords(r => r.value * 2).slice(0, 3); // higher-order fn demo

  area.innerHTML = `
    <h3>🗺️ Map vs Plain Object</h3>
    <div class="concept-box">
      <p>A <strong>Map</strong> can use any value as a key (even objects!). A plain object only uses strings.</p>
      <pre>
const map = new Map();
map.set(someObject, "metadata");  // object as key! ✅
map.get(someObject);              // "metadata"
      </pre>
      <p><strong>Map methods demo (live results):</strong></p>
      <ul>
        <li><code>map.set("a",1) + set("b",2) + set("c",3)</code> → map has 3 entries</li>
        <li><code>map.has("b")</code> → <strong>${mapDemo.hasB}</strong></li>
        <li><code>map.get("a")</code> → <strong>${mapDemo.getA}</strong></li>
        <li><code>map.delete("b")</code> → size is now <strong>${mapDemo.afterDelete}</strong></li>
        <li><code>[...map]</code> → <strong>${JSON.stringify(mapDemo.entries)}</strong></li>
        <li><code>map.clear()</code> → size is now <strong>${mapDemo.afterClear}</strong></li>
      </ul>
      <p>Grouped records by user using Map: 
        ${[...groupBy("user")].map(([u, r]) => `<strong>${u}</strong>:${r.length}`).join(" | ")}
      </p>
    </div>

    <h3>🧮 Set — Unique Values</h3>
    <div class="concept-box">
      <p>A <strong>Set</strong> automatically removes duplicates. Add the same value twice — it only appears once.</p>
      <pre>
const s = new Set();
s.add("apple"); s.add("banana"); s.add("apple"); // only 2 items!
      </pre>
      <p><strong>Set methods demo (live results):</strong></p>
      <ul>
        <li><code>set.has("apple")</code> → <strong>${setDemo.hasApple}</strong></li>
        <li><code>set.size</code> after adding "apple" twice → <strong>${setDemo.size}</strong> (not 3!)</li>
        <li><code>set.delete("banana")</code> → size is now <strong>${setDemo.afterDel}</strong></li>
        <li><code>Array.from(set)</code> → <strong>${JSON.stringify(setDemo.asArray)}</strong></li>
        <li><code>new Set([1,2,2,3,3,4])</code> → <strong>${JSON.stringify(setDemo.unique)}</strong> (duplicates gone!)</li>
        <li><code>set.clear()</code> → size is now <strong>${setDemo.afterClear}</strong></li>
      </ul>
      <p>After removeDuplicatesBy("category"): ${uniqueByCategory.length} unique-category records (from 120)</p>
    </div>

    <h3>👻 WeakMap &amp; WeakSet</h3>
    <div class="concept-box">
      <p><strong>WeakMap/WeakSet</strong> hold <em>weak references</em>. If the object it references is no longer used anywhere else, JavaScript can garbage-collect it automatically — the WeakMap won't prevent cleanup.</p>
      <p>Use case: caching metadata for record objects without causing memory leaks.</p>
      <pre>
const meta = new WeakMap();
meta.set(recordObject, { viewed: true });
// When recordObject is garbage-collected, the entry disappears too
      </pre>
    </div>

    <h3>🔑 Symbol</h3>
    <div class="concept-box">
      <p>Every <code>Symbol()</code> is 100% unique. Great for hidden or internal properties that nothing else can accidentally overwrite.</p>
      <pre>
const SECRET = Symbol("id");
record[SECRET] = "hidden-value";
// JSON.stringify(record) → won't include SECRET
// for..in loop → won't see SECRET
      </pre>
    </div>

    <h3>🔄 Iterator Protocol</h3>
    <div class="concept-box">
      <p>An object is <strong>iterable</strong> if it has a <code>[Symbol.iterator]()</code> method that returns an iterator.</p>
      <p>An <strong>iterator</strong> has a <code>next()</code> method that returns <code>{ value, done }</code>.</p>
      <pre>
const dataStore = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next() {
        if (i &lt; records.length) return { value: records[i++], done: false };
        return { value: undefined, done: true };
      }
    };
  }
};
for (const r of dataStore) { /* works! */ }
      </pre>
    </div>

    <h3>⚙️ Generator</h3>
    <div class="concept-box">
      <p>A <strong>generator</strong> (<code>function*</code>) is a function that can pause (<code>yield</code>) and resume. Perfect for processing large datasets in batches.</p>
      <pre>
function* batchRecords(size = 10) {
  for (let i = 0; i &lt; records.length; i += size) {
    yield records.slice(i, i + size); // pause here, return batch
  }
}
for (const batch of batchRecords(10)) { /* 10 at a time */ }
      </pre>
    </div>

    <h3>🧹 Pure Functions</h3>
    <div class="concept-box">
      <p>A <strong>pure function</strong>: same input → always same output, no side effects, never modifies external state.</p>
      <pre>
// Pure ✅
function totalRecords(list) { return list.length; }

// Impure ❌ — modifies external state
function addRecord(r) { globalArray.push(r); }
      </pre>
      <p>Results: Total=${pureFnResults.total} | Avg=\$${pureFnResults.avg} | Completed=${pureFnResults.completion}%</p>
    </div>

    <h3>🍛 Currying</h3>
    <div class="concept-box">
      <p><strong>Currying</strong> breaks a function that takes multiple arguments into a chain of functions that each take one argument.</p>
      <pre>
// filterBy is curried:
const filterBy = key => value => records.filter(r => r[key] === value);

const filterByStatus = filterBy("status");     // returns a function
const completed = filterByStatus("Completed"); // now call it with the value
      </pre>
    </div>

    <h3>🧩 Partial Application</h3>
    <div class="concept-box">
      <p><strong>Partial application</strong> pre-fills some arguments of a function to create a simpler, more specific version. Similar to currying but you fix multiple args at once.</p>
      <pre>
// multiply(factor) pre-fills the "factor" argument
function multiply(factor) {
  return (value) => value * factor;
}
const double = multiply(2); // "2" is now locked in
const triple = multiply(3); // "3" is now locked in
      </pre>
      <p>Live results: double(10) = <strong>${double(10)}</strong> | triple(10) = <strong>${triple(10)}</strong> | double(55) = <strong>${double(55)}</strong></p>
    </div>

    <h3>🏆 Higher-Order Functions</h3>
    <div class="concept-box">
      <p>A <strong>higher-order function</strong> either takes a function as an argument OR returns a function. Built-in examples: <code>map()</code>, <code>filter()</code>, <code>reduce()</code>, <code>forEach()</code>.</p>
      <pre>
// mapRecords takes a function (transformFn) as argument → higher-order
function mapRecords(transformFn) {
  return records.map(transformFn); // map() is also higher-order!
}

// Usage: double every record's value
const doubled = mapRecords(r => r.value * 2);
      </pre>
      <p>Live results (first 3 record values doubled): <strong>${titlesDoubled.join(", ")}</strong></p>
    </div>

    <h3>🔐 Closures in Functional Utilities</h3>
    <div class="concept-box">
      <p>A <strong>closure</strong> is a function that "remembers" variables from its outer scope even after that outer function has finished running. This is how <code>makeCounter</code>, <code>multiply</code>, and <code>memoize</code> all work.</p>
      <pre>
function makeCounter(start = 0) {
  let count = start; // ← this variable is "closed over"
  return {
    increment: () => ++count, // these arrow functions remember "count"
    value:     () => count,   // even after makeCounter() has returned!
    reset:     () => { count = start; },
  };
}
const c = makeCounter(0);
c.increment(); c.increment(); c.increment();
c.value(); // 3 — "count" persists privately inside the closure
      </pre>
      <p>Live counter test: after 3 increments → <strong>${counterVal}</strong></p>
    </div>

    <h3>🔑 Well-Known Symbols</h3>
    <div class="concept-box">
      <p>JavaScript has built-in <strong>well-known symbols</strong> that control special language behaviours:</p>
      <ul>
        <li><code>Symbol.iterator</code> — makes an object iterable with <code>for...of</code> (we used this in <code>dataStore</code>!)</li>
        <li><code>Symbol.toPrimitive</code> — controls how an object converts to a number or string</li>
        <li><code>Symbol.hasInstance</code> — controls how <code>instanceof</code> works</li>
        <li><code>Symbol.toStringTag</code> — customises the output of <code>Object.prototype.toString()</code></li>
      </ul>
      <pre>
// Example: Symbol.toPrimitive
const money = {
  amount: 42,
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.amount;
    if (hint === "string") return "\$" + this.amount;
    return this.amount;
  }
};
+money;      // 42  (number hint)
\`\${money}\`; // "\$42" (string hint)
      </pre>
    </div>

    <h3>🌍 JavaScript Execution Context</h3>
    <div class="concept-box">
      <p>Every time JavaScript runs code, it creates an <strong>Execution Context</strong>. There are two types:</p>
      <ul>
        <li><strong>Global Execution Context</strong> — created once when the page loads. Sets up the global object (<code>window</code>) and <code>this</code>.</li>
        <li><strong>Function Execution Context</strong> — created every time a function is called.</li>
      </ul>
      <p>Each context has two phases:</p>
      <ol>
        <li><strong>Creation Phase</strong> — sets up memory space for variables and functions. Variables are hoisted as <code>undefined</code>. Functions are fully hoisted.</li>
        <li><strong>Execution Phase</strong> — runs the code line by line, assigning real values.</li>
      </ol>
      <p>Each context also has:</p>
      <ul>
        <li><strong>Lexical Environment</strong> — where variables/functions are physically written in the code (determines scope and closures)</li>
        <li><strong>Variable Environment</strong> — stores <code>var</code> declarations (similar to lexical environment but for <code>var</code>)</li>
      </ul>
      <pre>
// Creation phase: x is hoisted as undefined, greet is fully hoisted
console.log(x);     // undefined (not error!) — hoisted
console.log(greet); // [Function: greet] — fully hoisted
var x = 5;
function greet() { return "hello"; }
// Execution phase: x is now assigned 5
      </pre>
    </div>`;

  // append remaining sections separately
  area.innerHTML += `
    <h3>🔗 Function Composition</h3>
    <div class="concept-box">
      <p><strong>Composition</strong> chains functions together: the output of one becomes the input of the next.</p>
      <pre>
// compose(f, g)(x) = f(g(x))
const avgCompletedValue = compose(averageValue, filterByStatus("Completed"));
// First filters to completed records, then calculates the average value
      </pre>
    </div>

    <h3>🧠 Memoization</h3>
    <div class="concept-box">
      <p><strong>Memoization</strong> caches the result of a function call. If called again with the same input, returns the cached result instantly.</p>
      <pre>
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key); // ⚡ instant!
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
      </pre>
    </div>

    <h3>🔒 Immutability</h3>
    <div class="concept-box">
      <p><strong>Immutability</strong> means never changing original data — always return a new copy with changes applied.</p>
      <pre>
// Mutable ❌ — changes original
function updateStatus(record, status) { record.status = status; }

// Immutable ✅ — returns new object, original untouched
function updateStatus(record, status) { return { ...record, status }; }
      </pre>
    </div>

    <h3>🗑️ Memory Management</h3>
    <div class="concept-box">
      <p>JavaScript uses <strong>garbage collection</strong> — it frees memory for objects no longer referenced. Common causes of memory leaks:</p>
      <ul>
        <li>Global variables that grow forever</li>
        <li>Event listeners never removed</li>
        <li>Circular references (A references B, B references A)</li>
        <li>Closures holding large data longer than needed</li>
      </ul>
      <p>WeakMap/WeakSet help by not preventing garbage collection of their keys.</p>
    </div>

    <h3>🛡️ Empty Dataset & Invalid Input Handling</h3>
    <div class="concept-box">
      <p>All data functions guard against bad input so the app never crashes:</p>
      <pre>
// averageValue([]) → returns 0 instead of dividing by zero
function averageValue(list = records) {
  if (list.length === 0) return 0;  // ← guard clause
  return list.reduce((s, r) => s + r.value, 0) / list.length;
}

// searchRecords("") → returns all records instead of crashing
function searchRecords(query = "") {
  const q = query.toLowerCase().trim();
  if (!q) return records;  // ← early return for empty input
  ...
}

// paginateRecords handles 0 results gracefully
// sortRecords handles undefined fields safely
      </pre>
      <p><strong>Live test:</strong> averageValue([]) = <strong>${averageValue([])}</strong> | completionPercent([]) = <strong>${completionPercent([])}</strong>%</p>
    </div>`;
}

// ─────────────────────────────────────────────
// PERFORMANCE TAB
// ─────────────────────────────────────────────
function renderPerformance() {
  const area = document.getElementById("perf-area");
  area.innerHTML = `<p class="note">Running performance comparison (10,000 iterations each)…</p>`;

  setTimeout(() => {
    const result = performanceComparison();
    area.innerHTML = `
      <h3>⚡ Performance: Array.find() vs Map.get()</h3>
      <div class="perf-cards">
        <div class="perf-card perf-slow">
          <h4>🐢 Array.find()</h4>
          <div class="perf-time">${result.arrayTime}</div>
          <p>Scans each element one by one until it finds a match.<br><strong>O(n)</strong> — gets slower as data grows.</p>
        </div>
        <div class="perf-card perf-fast">
          <h4>🚀 Map.get()</h4>
          <div class="perf-time">${result.mapTime}</div>
          <p>Looks up by key directly — no scanning needed.<br><strong>O(1)</strong> — constant time regardless of size.</p>
        </div>
      </div>
      <p><strong>Runs:</strong> ${result.runs.toLocaleString()} iterations each</p>
      <div class="concept-box">
        <h4>⚠️ Limitations of this comparison:</h4>
        <p>${result.note}</p>
        <p>Also: JavaScript engines (V8) are very good at optimizing small arrays, so differences may be small for 120 records. The benefit of Map becomes much larger with thousands or millions of records.</p>
      </div>`;
  }, 10);
}
