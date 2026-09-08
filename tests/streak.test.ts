import assert from "node:assert/strict";
import { test } from "node:test";
import { computeStreak } from "../src/lib/recurrence.ts";

const now = new Date("2026-09-05T15:00:00");

function daysAgo(n: number) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 10, 0, 0);
  return d;
}

test("streak kosong = 0", () => {
  assert.equal(computeStreak([], now), 0);
});

test("selesai hari ini = streak 1", () => {
  assert.equal(computeStreak([daysAgo(0)], now), 1);
});

test("streak 3 hari berturut-turut", () => {
  assert.equal(computeStreak([daysAgo(0), daysAgo(1), daysAgo(2)], now), 3);
});

test("hari ini belum selesai tapi kemarin ada: streak tetap hidup", () => {
  assert.equal(computeStreak([daysAgo(1), daysAgo(2)], now), 2);
});

test("gap satu hari memutus streak", () => {
  assert.equal(computeStreak([daysAgo(0), daysAgo(2), daysAgo(3)], now), 1);
});

test("hanya kemarin, hari ini belum: tetap dihitung", () => {
  assert.equal(computeStreak([daysAgo(1)], now), 1);
});
