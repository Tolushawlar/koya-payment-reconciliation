// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const latest = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);
for (const line of lines) {
  try {
    const event = JSON.parse(line);
    if (!event.txn_id) {
      continue;
    }
    const ts = new Date(event.ts).getTime();
    if (!latest.has(event.txn_id) || ts > latest.get(event.txn_id).ts) {
      latest.set(event.txn_id, { ts: ts, event: event });
    }
  } catch (e) {
    continue;
  }
}

let total = 0;
let count = 0;

for (const entry of latest.values()) {
  const event = entry.event;
  if (event.status === "success") {
    let amount = event.amount;
    if (typeof amount === "string") {
      amount = amount.replace(/,/g, "");
    }
    total += Number(amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
