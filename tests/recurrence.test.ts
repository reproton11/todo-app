import assert from "node:assert/strict";
import { test } from "node:test";
import { nextOccurrence } from "../src/lib/recurrence.ts";

test("NONE tidak menghasilkan tanggal berikutnya", () => {
  assert.equal(nextOccurrence(new Date("2026-09-05T10:00:00"), "NONE"), null);
});

test("HARIAN maju satu hari", () => {
  const next = nextOccurrence(new Date("2026-09-05T10:00:00Z"), "DAILY");
  assert.equal(next?.toISOString(), "2026-09-06T10:00:00.000Z");
});

test("MINGGUAN maju tujuh hari", () => {
  const next = nextOccurrence(new Date("2026-09-05T10:00:00Z"), "WEEKLY");
  assert.equal(next?.toISOString(), "2026-09-12T10:00:00.000Z");
});

test("BULANAN maju satu bulan", () => {
  const next = nextOccurrence(new Date("2026-01-15T08:00:00Z"), "MONTHLY");
  assert.equal(next?.toISOString(), "2026-02-15T08:00:00.000Z");
});

test("KHUSUS pakai interval hari", () => {
  const next = nextOccurrence(new Date("2026-09-01T06:00:00Z"), "CUSTOM", 3);
  assert.equal(next?.toISOString(), "2026-09-04T06:00:00.000Z");
});

test("KHUSUS tanpa interval valid memakai 1 hari", () => {
  const next = nextOccurrence(new Date("2026-09-01T06:00:00Z"), "CUSTOM", null);
  assert.equal(next?.toISOString(), "2026-09-02T06:00:00.000Z");
});
