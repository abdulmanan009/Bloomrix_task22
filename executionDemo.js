// ============================================================
// executionDemo.js — Shows JavaScript Execution Order
// This module powers the "Execution Order" tab.
// It demonstrates: sync code → microtasks → macrotasks
// Also shows: setInterval, call stack, stack overflow
// ============================================================

// We'll collect log entries and display them in the UI
let logEntries = [];
let stepCounter = 0;

function addEntry(source, message) {
  stepCounter++;
  logEntries.push({ step: stepCounter, source, message });
}

export function runExecutionDemo() {
  logEntries   = [];
  stepCounter  = 0;

  // ── SYNCHRONOUS code runs first, immediately ──
  addEntry("Sync", "1️⃣  Synchronous: console.log('Start') — runs right now");

  // ── PROMISE (.then) → Microtask Queue ──
  // Microtasks run BEFORE the next macrotask (setTimeout etc.)
  Promise.resolve().then(() => {
    addEntry("Microtask", "3️⃣  Promise.then() — microtask, runs after all sync code");
  });

  // ── queueMicrotask() → also Microtask Queue ──
  queueMicrotask(() => {
    addEntry("Microtask", "4️⃣  queueMicrotask() — also a microtask, runs after Promise.then");
  });

  // ── setTimeout(0) → Macrotask (Task) Queue ──
  // Even with 0ms delay, it runs AFTER all microtasks are done
  setTimeout(() => {
    addEntry("Macrotask", "5️⃣  setTimeout(0) — macrotask, runs after ALL microtasks");
    // Notify UI to render the results
    window._executionDemoReady && window._executionDemoReady(logEntries);
  }, 0);

  // ── Another synchronous line ──
  addEntry("Sync", "2️⃣  Synchronous: console.log('End') — still sync, runs before anything async");

  // Return current entries (the async ones aren't ready yet)
  return { pending: true, entries: logEntries };
}

// setInterval demo — fires repeatedly until cleared
// Returns a function you call to stop it, plus a log array
export function runIntervalDemo(onTick) {
  let count = 0;
  const id = setInterval(() => {
    count++;
    onTick(`⏰ setInterval tick #${count} — runs every 500ms until cleared`);
    if (count >= 3) {
      clearInterval(id);
      onTick("🛑 clearInterval() called — interval stopped after 3 ticks");
    }
  }, 500);
}

// Call stack / overflow demo
export function callStackDemo() {
  const steps = [];

  function a() {
    steps.push("→ a() pushed onto call stack");
    b();
    steps.push("← a() popped off call stack");
  }

  function b() {
    steps.push("  → b() pushed onto call stack");
    c();
    steps.push("  ← b() popped off call stack");
  }

  function c() {
    steps.push("    → c() pushed onto call stack");
    steps.push("    ← c() done and popped off");
  }

  a();
  return steps;
}

// Stack overflow demo — deliberately recurse too deep
export function stackOverflowDemo() {
  try {
    function infinite() { return infinite(); }
    infinite();
    return { overflowed: false, message: "No overflow happened (unexpected)" };
  } catch (e) {
    return {
      overflowed: true,
      message: `✅ Stack overflow caught! Error: "${e.message}" — JavaScript limits how deep function calls can nest.`,
    };
  }
}
