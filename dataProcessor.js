// ============================================================
// dataProcessor.js — All Data Logic Lives Here
// No DOM touching — just pure JavaScript functions.
// Every function that changes data returns a NEW copy so the
// original records are never accidentally changed (immutability).
// ============================================================

import rawRecords, { INTERNAL_ID } from "./data.js";

// ─────────────────────────────────────────────
// 1. IMMUTABLE LOAD
//    We freeze a copy of the data so nothing
//    can accidentally change the original array.
// ─────────────────────────────────────────────
let records = rawRecords.map(r => Object.freeze({ ...r })); // freeze each record

// ─────────────────────────────────────────────
// 2. MAP  — group records by any key
//    Map is better than a plain object because
//    keys can be anything (even other objects).
// ─────────────────────────────────────────────
export function groupBy(key) {
  const map = new Map(); // Map<string, Record[]>
  for (const record of records) {
    const groupKey = record[key];
    if (!map.has(groupKey)) map.set(groupKey, []);
    map.get(groupKey).push(record);
  }
  return map;
}

// ─────────────────────────────────────────────
// 3. SET  — unique values for any field
//    Set only keeps one copy of each value,
//    so duplicates are automatically removed.
// ─────────────────────────────────────────────
export function uniqueValues(key) {
  return new Set(records.map(r => r[key]));
}

// Remove duplicate records based on a property
// Returns a NEW array — original is untouched.
export function removeDuplicatesBy(key) {
  const seen = new Set();
  return records.filter(r => {
    if (seen.has(r[key])) return false;
    seen.add(r[key]);
    return true;
  });
}

// ─────────────────────────────────────────────
// 4. WEAKMAP + WEAKSET  — temporary metadata for objects
//    WeakMap lets us attach extra info to an
//    object without preventing garbage collection.
//    WeakSet lets us mark/tag objects without preventing GC.
// ─────────────────────────────────────────────
const recordMetaCache = new WeakMap();

// WeakSet: track which records have been "viewed"
const viewedRecords = new WeakSet();

export function setMeta(recordObj, meta) {
  recordMetaCache.set(recordObj, meta);
}
export function getMeta(recordObj) {
  return recordMetaCache.get(recordObj) || null;
}
export function markViewed(recordObj) {
  viewedRecords.add(recordObj);
}
export function isViewed(recordObj) {
  return viewedRecords.has(recordObj);
}

// Map methods demo — set, get, has, delete, clear, iteration
export function mapMethodsDemo() {
  const m = new Map();
  m.set("a", 1);           // add key-value
  m.set("b", 2);
  m.set("c", 3);
  const hasB  = m.has("b");  // true
  const getA  = m.get("a");  // 1
  m.delete("b");             // removes "b"
  const afterDelete = m.size; // 2
  const entries = [...m];    // [["a",1],["c",3]]
  m.clear();                 // remove all
  const afterClear = m.size; // 0
  return { hasB, getA, afterDelete, entries, afterClear };
}

// Set methods demo — add, has, delete, clear, array conversion
export function setMethodsDemo() {
  const s = new Set();
  s.add("apple");
  s.add("banana");
  s.add("apple");   // duplicate — ignored
  const hasApple  = s.has("apple");   // true
  const size      = s.size;           // 2 (not 3!)
  s.delete("banana");
  const afterDel  = s.size;           // 1
  const asArray   = Array.from(s);    // ["apple"]
  // Convert array to Set to remove duplicates
  const nums      = new Set([1, 2, 2, 3, 3, 4]); // {1,2,3,4}
  const unique    = [...nums];
  s.clear();
  const afterClear = s.size; // 0
  return { hasApple, size, afterDel, asArray, unique, afterClear };
}

// ─────────────────────────────────────────────
// 5. SYMBOL  — demo that Symbol is truly unique
//    Symbol()       → always a new unique symbol
//    Symbol.for()   → looks up/creates a GLOBAL symbol by name
//    Symbol.keyFor()→ finds the name of a global symbol
// ─────────────────────────────────────────────
export function getSymbolId(record) {
  return record[INTERNAL_ID]; // only readable via our exported Symbol
}

// Symbol.for() / Symbol.keyFor() demo
export function symbolDemo() {
  // Symbol() — always brand new, never equal to anything else
  const sym1 = Symbol("myId");
  const sym2 = Symbol("myId");
  const areEqual = sym1 === sym2; // false — always unique!

  // Symbol.for() — looks up a GLOBAL registry by name
  // calling it twice with the same name returns the SAME symbol
  const globalSym1 = Symbol.for("app.userId");
  const globalSym2 = Symbol.for("app.userId");
  const globalEqual = globalSym1 === globalSym2; // true!

  // Symbol.keyFor() — get back the name of a global symbol
  const keyName = Symbol.keyFor(globalSym1); // "app.userId"

  // Well-known Symbols — built into JavaScript
  // Symbol.iterator  → makes an object iterable (for...of)
  // Symbol.toPrimitive → controls how object converts to a primitive (number/string)
  // Symbol.hasInstance → controls instanceof behavior
  const wellKnown = {
    "Symbol.iterator":    String(Symbol.iterator),    // "Symbol(Symbol.iterator)"
    "Symbol.toPrimitive": String(Symbol.toPrimitive), // "Symbol(Symbol.toPrimitive)"
    "Symbol.hasInstance": String(Symbol.hasInstance), // "Symbol(Symbol.hasInstance)"
  };

  return { sym1: String(sym1), sym2: String(sym2), areEqual, globalEqual, keyName, wellKnown };
}

// ─────────────────────────────────────────────
// 6. CUSTOM ITERABLE  — lets you do: for (const r of dataStore) {}
//    We implement Symbol.iterator so our object
//    follows the official JavaScript iteration protocol.
// ─────────────────────────────────────────────
export const dataStore = {
  _records: records,

  // Symbol.iterator makes this object "iterable"
  [Symbol.iterator]() {
    let index = 0;
    const list = this._records;
    return {
      next() {
        if (index < list.length) {
          return { value: list[index++], done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
};

// ─────────────────────────────────────────────
// 7. GENERATORS  — process records in batches of N
//    function* means it's a generator.
//    yield  pauses and hands back one value.
//    yield* delegates to another generator/iterable.
//    This is lazy — it doesn't process everything at once.
// ─────────────────────────────────────────────
export function* batchRecords(batchSize = 10) {
  for (let i = 0; i < records.length; i += batchSize) {
    yield records.slice(i, i + batchSize); // pause and hand out one batch
  }
}

// yield* demo — delegate one generator into another
// This generator yields all records from TWO sub-generators in sequence
export function* allRecordsViaYieldStar() {
  yield* batchRecords(60); // yields first 6 batches (all 120 records in two chunks)
}

// Recursion demo — factorial using recursion (pure function)
export function factorial(n) {
  if (n <= 1) return 1;        // base case — stop recursing
  return n * factorial(n - 1); // recursive case — calls itself
}

// ─────────────────────────────────────────────
// 8. PURE FUNCTIONS  — same input → same output, no side effects
// ─────────────────────────────────────────────

// Pure function 1: total number of records
export function totalRecords(list = records) {
  return list.length;
}

// Pure function 2: average numeric value
export function averageValue(list = records) {
  if (list.length === 0) return 0;
  const total = list.reduce((sum, r) => sum + r.value, 0);
  return Math.round(total / list.length);
}

// Pure function 3: completion percentage
export function completionPercent(list = records) {
  if (list.length === 0) return 0;
  const done = list.filter(r => r.status === "Completed").length;
  return Math.round((done / list.length) * 100);
}

// ─────────────────────────────────────────────
// 9. CURRYING + PARTIAL APPLICATION + HIGHER-ORDER FUNCTIONS
//
//    CURRYING: a function that returns another function,
//    taking arguments one at a time.
//
//    PARTIAL APPLICATION: pre-filling some arguments of a
//    function to create a simpler, more specific version.
//
//    HIGHER-ORDER FUNCTION: a function that takes another
//    function as an argument OR returns a function.
//    (map, filter, reduce are all higher-order functions)
// ─────────────────────────────────────────────

// Curried filter — takes key, then value, then filters
export const filterBy = key => value => records.filter(r => r[key] === value);

// Pre-made filters using currying (also partial application)
export const filterByStatus   = filterBy("status");   // partial: key is locked in
export const filterByCategory = filterBy("category");
export const filterByUser     = filterBy("user");
export const filterByPriority = filterBy("priority");

// Higher-order function example:
// Takes a transform function and applies it to every record
// returning a new array — the original is never changed
export function mapRecords(transformFn) {
  return records.map(transformFn); // map() is a built-in higher-order function
}

// Partial application example:
// multiply(factor) returns a new function that multiplies a value by factor
export function multiply(factor) {
  return (value) => value * factor; // the returned function "remembers" factor (closure!)
}
// Use: double = multiply(2), then double(5) = 10
export const double = multiply(2);
export const triple = multiply(3);

// CLOSURE in functional utility:
// makeCounter is a closure — the returned function "closes over" count
// and remembers it between calls without exposing it to outside code
export function makeCounter(start = 0) {
  let count = start; // private — no one outside can directly change this
  return {
    increment: () => ++count,
    decrement: () => --count,
    value:     () => count,
    reset:     () => { count = start; },
  };
}

// ─────────────────────────────────────────────
// 10. FUNCTION COMPOSITION
//     compose(f, g)(x) means: first run g(x), then run f on the result.
//     Like a pipeline: data → g → f → result
// ─────────────────────────────────────────────
export function compose(...fns) {
  return x => fns.reduceRight((v, fn) => fn(v), x);
}

// Example: get the average value of only "Completed" records
export const avgCompletedValue = compose(averageValue, filterByStatus("Completed"));

// ─────────────────────────────────────────────
// 11. MEMOIZATION
//     Remembers the result of an expensive function call.
//     If you call it again with the same argument, it returns
//     the cached result instead of recomputing.
//     Cache is cleared when data changes.
// ─────────────────────────────────────────────
function memoize(fn) {
  const cache = new Map();
  const memoized = function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return { result: cache.get(key), fromCache: true };
    }
    const result = fn(...args);
    cache.set(key, result);
    return { result, fromCache: false };
  };
  memoized.clearCache = () => cache.clear();
  return memoized;
}

// Expensive report generator (simulated with a small delay loop)
function computeCategoryReport(categoryName) {
  // Simulate heavy work
  const start = performance.now();
  while (performance.now() - start < 2) {} // spin for ~2ms to fake work

  const list = records.filter(r => r.category === categoryName);
  return {
    category:   categoryName,
    count:      list.length,
    avgValue:   averageValue(list),
    completed:  completionPercent(list),
    totalValue: list.reduce((s, r) => s + r.value, 0),
  };
}

export const memoizedCategoryReport = memoize(computeCategoryReport);

// ─────────────────────────────────────────────
// 12. SEARCH, FILTER, SORT, PAGINATE
//     These are used by the UI but keep data logic here.
// ─────────────────────────────────────────────

export function searchRecords(query = "") {
  const q = query.toLowerCase().trim();
  if (!q) return records;
  return records.filter(
    r => r.title.toLowerCase().includes(q) || r.user.toLowerCase().includes(q)
  );
}

export function sortRecords(list, field = "id", direction = "asc") {
  return [...list].sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (typeof va === "number") return direction === "asc" ? va - vb : vb - va;
    return direction === "asc"
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });
}

export function paginateRecords(list, page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return {
    items:      list.slice(start, start + pageSize),
    totalPages: Math.ceil(list.length / pageSize),
    total:      list.length,
    page,
    pageSize,
  };
}

// ─────────────────────────────────────────────
// 13. PERFORMANCE COMPARISON
//     Array scan vs Map lookup — measure both
// ─────────────────────────────────────────────
export function performanceComparison() {
  const RUNS = 10000;

  // --- Array approach: scan every element ---
  const t1 = performance.now();
  for (let i = 0; i < RUNS; i++) {
    records.find(r => r.id === 50);
  }
  const arrayTime = (performance.now() - t1).toFixed(3);

  // --- Map approach: direct key lookup O(1) ---
  const idMap = new Map(records.map(r => [r.id, r]));
  const t2 = performance.now();
  for (let i = 0; i < RUNS; i++) {
    idMap.get(50);
  }
  const mapTime = (performance.now() - t2).toFixed(3);

  return {
    arrayTime: `${arrayTime} ms`,
    mapTime:   `${mapTime} ms`,
    runs:      RUNS,
    note: "Map.get() is O(1) — constant time regardless of dataset size. Array.find() is O(n) — it scans from the start. For small arrays the difference is tiny, but it grows with data size.",
  };
}

// ─────────────────────────────────────────────
// 14. SUMMARY STATS  (used by dashboard cards)
// ─────────────────────────────────────────────
export function getSummaryStats() {
  return {
    total:        totalRecords(),
    avgValue:     averageValue(),
    completed:    completionPercent(),
    categories:   [...uniqueValues("category")],
    users:        [...uniqueValues("user")],
    statuses:     [...uniqueValues("status")],
    priorities:   [...uniqueValues("priority")],
    grouped:      groupBy("status"),
    avgCompleted: avgCompletedValue,
  };
}
