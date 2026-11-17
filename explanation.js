// ============================================================
// explanation.js — Short explanation of every concept used
// Run this in the browser console or just read the comments!
// ============================================================

/*
  ════════════════════════════════════════════════════════
  HOW THIS APPLICATION IS ORGANIZED (Modules)
  ════════════════════════════════════════════════════════

  data.js            → Holds the 120 sample records (like a fake database)
  dataProcessor.js   → All data logic: filtering, sorting, grouping, stats
  executionDemo.js   → Shows call stack and async execution order
  thisDemo.js        → Shows how "this" changes in different situations
  ui.js              → All DOM rendering — displays data, never calculates it
  index.html         → Entry point, loads ui.js as a module
  style.css          → Visual styles

  ════════════════════════════════════════════════════════
  DATA STRUCTURES USED
  ════════════════════════════════════════════════════════

  Map:
  - Used in groupBy() to group records by any field (status, user, category)
  - Keys can be anything; iteration order is preserved
  - Better than plain objects when you need frequent lookups by dynamic keys

  Set:
  - Used in uniqueValues() to collect distinct values (no duplicates)
  - Used in removeDuplicatesBy() to track which values have been seen
  - Automatically ignores duplicate entries

  WeakMap:
  - Used in recordMetaCache to attach temporary metadata to record objects
  - If the record object is garbage-collected, the entry disappears too
  - Cannot be iterated — intentionally private

  WeakSet (new):
  - viewedRecords = new WeakSet() tracks which records have been "viewed"
  - weakSet.add(obj), has(obj) — marks objects without preventing GC
  - Like WeakMap but stores only objects, no key-value pairs

  Symbol:
  - Symbol()         → always creates a brand new unique symbol (sym1 !== sym2 even with same description)
  - Symbol.for(name) → global symbol registry — same name always returns SAME symbol
  - Symbol.keyFor(s) → retrieves the name string of a global symbol
  - INTERNAL_ID = Symbol("internalId") used as hidden property on each record

  Map methods demonstrated:
  - set(key, value), get(key), has(key), delete(key), clear(), size, iteration

  Set methods demonstrated:
  - add(value), has(value), delete(value), clear(), size
  - new Set(array) removes duplicates; Array.from(set) converts back

  ════════════════════════════════════════════════════════
  FUNCTIONAL PROGRAMMING TECHNIQUES
  ════════════════════════════════════════════════════════

  Pure Functions:
  - totalRecords(list)       — returns list.length, no side effects
  - averageValue(list)       — sums values and divides, no side effects
  - completionPercent(list)  — counts "Completed" records, no side effects

  Currying:
  - filterBy = key => value => records.filter(r => r[key] === value)
  - filterBy("status")("Completed") — same as records.filter(r => r.status === "Completed")
  - Lets you create reusable, pre-configured filters

  Function Composition:
  - compose(...fns) runs functions right-to-left like a pipeline
  - avgCompletedValue = compose(averageValue, filterByStatus("Completed"))
  - First filters to completed, then calculates average — no temp variables needed

  Memoization:
  - memoize(fn) wraps any function and caches results by argument
  - memoizedCategoryReport("Development") runs the heavy calc once
  - Calling it again with "Development" returns the cached result instantly
  - Cache is a Map; memoized.clearCache() resets it when data changes

  Immutability:
  - All records are Object.freeze()'d after loading
  - sortRecords uses [...list].sort() — spreads to a new array first
  - filterByStatus returns a new filtered array — original untouched

  ════════════════════════════════════════════════════════
  ITERATOR IMPLEMENTATION
  ════════════════════════════════════════════════════════

  dataStore is a plain object that has [Symbol.iterator]():

    [Symbol.iterator]() {
      let index = 0;
      const list = this._records;
      return {
        next() {
          if (index < list.length) return { value: list[index++], done: false };
          return { value: undefined, done: true };
        }
      };
    }

  This makes it work with:
  - for (const r of dataStore) { ... }
  - [...dataStore]  (spread)
  - Array.from(dataStore)
  - destructuring

  batchRecords is a generator that yields arrays of N records at a time.
  Using "yield" pauses the function — it only computes the next batch
  when you ask for it. This is called "lazy evaluation".

  yield* (yield star):
  - allRecordsViaYieldStar() uses yield* batchRecords(60)
  - yield* delegates to another generator — it's like saying "yield everything from this other generator"
  - Useful for composing generators together

  Recursion:
  - factorial(n) calls itself with smaller n until n=1 (base case)
  - factorial(5) = 5 × 4 × 3 × 2 × 1 = 120
  - Every recursive function MUST have a base case to stop, otherwise → stack overflow

  ════════════════════════════════════════════════════════
  PERFORMANCE COMPARISON
  ════════════════════════════════════════════════════════

  Array.find(r => r.id === 50):
  - Scans records one by one from the start
  - On average checks n/2 records → O(n) time complexity
  - Gets slower as the dataset grows

  Map.get(50) (after building Map once):
  - Looks up by hash directly
  - Always takes the same time regardless of dataset size → O(1)
  - Better for frequent lookups on large datasets

  Limitation: JavaScript engines heavily optimize small loops,
  so the difference on 120 records is tiny. The gap grows with
  larger datasets (10,000+ records).

  ════════════════════════════════════════════════════════
  EXECUTION ORDER EXPLAINED
  ════════════════════════════════════════════════════════

  JavaScript is single-threaded but handles async via the Event Loop:

  1. CALL STACK — runs synchronous code, one function at a time
  2. MICROTASK QUEUE — Promise.then() and queueMicrotask() go here
     → Drained completely before any macrotask runs
  3. MACROTASK QUEUE — setTimeout, setInterval, I/O callbacks go here
     → One task runs per event loop tick

  Execution order:
  Sync code → all microtasks → one macrotask → all microtasks → …
*/
