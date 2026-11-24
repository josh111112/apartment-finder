import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApartmentSchema } from "../src/schemas/apartment.js";
import { SearchConfigSchema } from "../src/schemas/search-config.js";
import { SourceSchema } from "../src/schemas/source.js";

describe("schema validation", () => {
  it("accepts a valid search config for Grand Rapids", () => {
    const parsed = SearchConfigSchema.parse({
      city: "Grand Rapids",
      state: "MI",
      areaName: "Bridge Street",
      center: { lat: 42.9698, lng: -85.6768 },
      criteria: { minBeds: 1, maxMonthlyBudget: 1800 },
    });
    assert.equal(parsed.city, "Grand Rapids");
    assert.equal(parsed.criteria.minBeds, 1);
  });

  it("rejects non-kebab-case source IDs", () => {
    const result = SourceSchema.safeParse({
      id: "Bridge Street Lofts",
      name: "Bridge Street Lofts",
      websiteUrl: "https://example.com",
    });
    assert.equal(result.success, false);
  });

  it("rejects out-of-range coordinates and negative rent", () => {
    const result = ApartmentSchema.safeParse({
      id: "bad-apt",
      name: "Bad Apt",
      address: "123 Main St",
      neighborhood: "Downtown",
      coordinates: { lat: 999, lng: -85.67 },
      websiteUrl: "https://example.com",
      units: [{ unitId: "101", beds: 1, baths: 1, baseRent: -500 }],
      meta: { lastUpdated: "2026-11-23T00:00:00.000Z" },
    });
    assert.equal(result.success, false);
  });
});
