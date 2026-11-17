// ============================================================
// data.js — Sample Dataset (100+ records)
// This module just holds our fake data. Nothing fancy here.
// Think of it like a spreadsheet of tasks/projects.
// ============================================================

// A Symbol is a totally unique ID that no other code can accidentally
// overwrite. We use it as a hidden "internal ID" on each record.
export const INTERNAL_ID = Symbol("internalId");

// Helper to make a date string like "2024-03-15"
function makeDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const categories = ["Development", "Design", "Marketing", "Testing", "DevOps", "Research"];
const statuses   = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"];
const users      = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank"];
const priorities = ["Low", "Medium", "High", "Critical"];

// Build 120 sample records
const rawRecords = [];
for (let i = 1; i <= 120; i++) {
  const record = {
    id:       i,
    title:    `Task #${i} — ${categories[(i - 1) % categories.length]} Work`,
    category: categories[(i - 1) % categories.length],
    status:   statuses[(i - 1) % statuses.length],
    user:     users[(i - 1) % users.length],
    priority: priorities[(i - 1) % priorities.length],
    date:     makeDate(2024, (i % 12) + 1, (i % 28) + 1),
    value:    Math.round((i * 137 + 50) % 1000 + 100), // a number 100–1099
  };

  // Attach the Symbol property — it's invisible to for..in and JSON.stringify
  record[INTERNAL_ID] = `SYM-${i}`;

  rawRecords.push(record);
}

export default rawRecords;
