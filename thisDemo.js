// ============================================================
// thisDemo.js — Advanced "this" Behavior Examples
// Shows how "this" changes depending on how a function is called
// Covers: regular functions, arrow functions, callbacks,
//         nested methods, event handlers, bind/call/apply
// ============================================================

export function runThisDemo() {
  const results = [];

  // ── 1. Regular function: "this" depends on who calls it ──
  const obj = {
    name: "MyObject",
    regularMethod() {
      // "this" here is "obj" because obj called it
      return `Regular method: this.name = "${this.name}"`;
    },
    arrowMethod: () => {
      // Arrow functions do NOT have their own "this"
      // They inherit "this" from the outer scope (which is the module/window here)
      return `Arrow method: this.name = "${
        typeof this !== "undefined" && this.name ? this.name : "undefined (arrow has no own this)"
      }"`;
    },
  };

  results.push({ label: "Regular method (this = obj)", output: obj.regularMethod() });
  results.push({ label: "Arrow method (this = outer scope)", output: obj.arrowMethod() });

  // ── 2. Losing "this" when passing as callback ──
  const greet = obj.regularMethod;
  let lost;
  try {
    lost = greet(); // "this" is now undefined (strict) or window (non-strict)
  } catch {
    lost = "Error: this is undefined — lost context!";
  }
  results.push({ label: "Detached callback (this lost)", output: lost });

  // ── 3. Fixing with .bind() ──
  const bound = obj.regularMethod.bind(obj);
  results.push({ label: ".bind(obj) fixes it", output: bound() });

  // ── 4. Nested function "this" problem ──
  const counter = {
    count: 0,
    // If we used a regular function inside setTimeout, "this" would be lost
    // Arrow function inherits outer "this" so it works correctly
    increment() {
      const arrow = () => {
        this.count++;
        return `Arrow inside method: this.count = ${this.count}`;
      };
      return arrow();
    },
  };
  results.push({ label: "Arrow inside method (this preserved)", output: counter.increment() });

  // ── 5. .call() and .apply() ──
  function introduce(greeting) {
    return `${greeting}, I am ${this.name}`;
  }
  const alice = { name: "Alice" };
  results.push({ label: ".call() sets this manually", output: introduce.call(alice, "Hello") });
  results.push({ label: ".apply() sets this manually", output: introduce.apply(alice, ["Hi"]) });

  // ── 6. "this" in event handlers ──
  // Regular function as event handler → "this" = the DOM element that fired the event
  // Arrow function as event handler → "this" = whatever "this" was where arrow was defined
  results.push({
    label: "Event handler (regular fn): this = the button element",
    output: `button.addEventListener('click', function() { this.textContent; })
  → "this" is the <button> element that was clicked`,
  });
  results.push({
    label: "Event handler (arrow fn): this = outer scope",
    output: `button.addEventListener('click', () => { this; })
  → "this" is NOT the button — it's the outer scope (window/module)
  → This is a common bug! Use regular function if you need the element.`,
  });

  return results;
}
