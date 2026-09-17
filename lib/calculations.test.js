import assert from "node:assert/strict";
import test from "node:test";
import { calculateSplits } from "./calculations.js";

test("calculateSplits ignores tax when computing participant totals", () => {
  const session = {
    taxAmount: 50,
    participants: [
      { id: "p1", name: "Alice", role: "participant" },
      { id: "p2", name: "Bob", role: "participant" },
    ],
    items: [
      { id: "i1", name: "Burger", price: 10, quantity: 1 },
      { id: "i2", name: "Fries", price: 20, quantity: 1 },
    ],
    claims: {
      i1: ["p1", "p2"],
      i2: ["p1", "p2"],
    },
  };

  const totals = calculateSplits(session);

  assert.equal(totals.grandTotal, 30);
  assert.equal(totals.taxAmount, 0);
  assert.equal(totals.participantTax, 0);
  assert.deepEqual(
    totals.participantTotals.map((participant) => participant.total),
    [15, 15],
  );
});
