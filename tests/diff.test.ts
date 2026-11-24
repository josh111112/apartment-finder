import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createSnapshot,
  diffSnapshots,
  formatDiffReport,
} from "../src/lib/diff.js";
import { normalizeApartment } from "../src/lib/pricing.js";
import { ApartmentSchema } from "../src/schemas/apartment.js";

describe("snapshot diffing", () => {
  it("detects added buildings, price drops, and unit count changes", () => {
    const prev = {
      timestamp: "2026-11-20T00:00:00.000Z",
      buildings: [
        {
          id: "river-west",
          name: "River West",
          minRent: 1700,
          minEffectiveCost: 1750,
          availableUnitCount: 3,
        },
      ],
    };

    const updatedRiverWest = normalizeApartment(
      ApartmentSchema.parse({
        id: "river-west",
        name: "River West",
        address: "100 River Ave NW, Grand Rapids, MI",
        neighborhood: "Westside",
        coordinates: { lat: 42.968, lng: -85.68 },
        websiteUrl: "https://example.com/river-west",
        units: [
          { unitId: "101", beds: 1, baths: 1, baseRent: 1600 },
          { unitId: "202", beds: 1, baths: 1, baseRent: 1650 },
        ],
        meta: { lastUpdated: "2026-11-23T00:00:00.000Z" },
      })
    );

    const newBuilding = normalizeApartment(
      ApartmentSchema.parse({
        id: "bridge-point",
        name: "Bridge Point",
        address: "350 Bridge St NW, Grand Rapids, MI",
        neighborhood: "Bridge Street",
        coordinates: { lat: 42.97, lng: -85.677 },
        websiteUrl: "https://example.com/bridge-point",
        units: [{ unitId: "401", beds: 1, baths: 1, baseRent: 1550 }],
        meta: { lastUpdated: "2026-11-23T00:00:00.000Z" },
      })
    );

    const curr = createSnapshot([updatedRiverWest, newBuilding], "2026-11-23T00:00:00.000Z");
    const changes = diffSnapshots(prev, curr);

    assert.equal(changes.length, 2);
    const added = changes.find((c) => c.id === "bridge-point");
    const changed = changes.find((c) => c.id === "river-west");

    assert.equal(added?.type, "added");
    assert.equal(changed?.type, "changed");
    assert.equal(changed?.minEffectiveDelta, -150);
    assert.equal(changed?.unitsDelta, -1);

    const report = formatDiffReport(changes);
    assert.match(report, /\[ADDED\] Bridge Point/);
    assert.match(report, /\[CHANGED\] River West/);
  });
});
