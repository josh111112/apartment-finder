import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeApartmentList, mergeApartmentUpdate } from "../src/lib/merge.js";
import { ApartmentSchema } from "../src/schemas/apartment.js";

function makeApartment(overrides: Record<string, unknown> = {}) {
  return ApartmentSchema.parse({
    id: "westside-lofts",
    name: "Westside Lofts",
    address: "500 Bridge St NW, Grand Rapids, MI 49504",
    neighborhood: "Bridge Street",
    coordinates: { lat: 42.9699, lng: -85.678 },
    websiteUrl: "https://example.com/westside",
    meta: { lastUpdated: "2026-11-23T12:00:00.000Z" },
    ...overrides,
  });
}

describe("safe merge", () => {
  it("preserves existing user notes, rating, status, and pros/cons on refresh", () => {
    const existing = makeApartment({
      user: {
        status: "toured",
        rating: 4,
        tourDate: "2026-11-20",
        notes: "Great sunlight, close to New Holland Brewing.",
        pros: ["Walkable to Bridge St", "Heated garage"],
        cons: ["Street noise on weekends"],
      },
    });

    const incoming = makeApartment({
      parkingSummary: "Updated heated garage $130/mo",
      user: {
        status: "new",
        rating: null,
        tourDate: null,
        notes: "",
        pros: [],
        cons: [],
      },
    });

    const merged = mergeApartmentUpdate(existing, incoming);
    assert.equal(merged.parkingSummary, "Updated heated garage $130/mo");
    assert.equal(merged.user.status, "toured");
    assert.equal(merged.user.rating, 4);
    assert.equal(merged.user.tourDate, "2026-11-20");
    assert.equal(
      merged.user.notes,
      "Great sunlight, close to New Holland Brewing."
    );
    assert.deepEqual(merged.user.pros, ["Walkable to Bridge St", "Heated garage"]);
    assert.deepEqual(merged.user.cons, ["Street noise on weekends"]);
  });

  it("merges apartment lists by ID and keeps untouched buildings", () => {
    const existingA = makeApartment({
      id: "building-a",
      name: "Building A",
      user: { status: "interested", rating: 5, notes: "Top pick", pros: [], cons: [], tourDate: null },
    });
    const existingB = makeApartment({
      id: "building-b",
      name: "Building B",
    });

    const incomingA = makeApartment({
      id: "building-a",
      name: "Building A",
      petPolicy: "Cats & dogs welcome",
    });
    const incomingC = makeApartment({
      id: "building-c",
      name: "Building C",
    });

    const merged = mergeApartmentList([existingA, existingB], [incomingA, incomingC]);
    assert.equal(merged.length, 3);
    assert.equal(merged[0].id, "building-a");
    assert.equal(merged[0].petPolicy, "Cats & dogs welcome");
    assert.equal(merged[0].user.status, "interested");
    assert.equal(merged[1].id, "building-b");
    assert.equal(merged[2].id, "building-c");
  });
});
