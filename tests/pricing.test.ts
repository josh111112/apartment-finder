import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateEffectiveMonthlyCost,
  calculateProratedSpecial,
  calculateRecurringMonthlyFees,
  computeBuildingSummary,
  normalizeApartment,
} from "../src/lib/pricing.js";
import { ApartmentSchema, FeesSchema } from "../src/schemas/apartment.js";

describe("pricing calculations", () => {
  it("sums recurring monthly fees (including parking, excluding pet by default)", () => {
    const fees = FeesSchema.parse({
      monthlyParking: 125,
      monthlyTrash: 25,
      monthlyAmenity: 15,
      monthlyPet: 50,
      monthlyOther: [{ label: "Pest control", amount: 10 }],
    });

    assert.equal(calculateRecurringMonthlyFees(fees), 175);
    assert.equal(
      calculateRecurringMonthlyFees(fees, { includePetFee: true }),
      225
    );
    assert.equal(
      calculateRecurringMonthlyFees(fees, { includeParking: false }),
      50
    );
  });

  it("prorates months-free and flat-credit specials across the lease term", () => {
    const discount = calculateProratedSpecial(
      [
        {
          description: "1 month free + $600 look-and-lease",
          monthsFree: 1,
          flatCredit: 600,
          expiresAt: null,
        },
      ],
      1800,
      12
    );

    // (1800 * 1)/12 + 600/12 = 150 + 50 = 200
    assert.equal(discount, 200);
  });

  it("computes effective monthly cost and normalizes building summary", () => {
    const raw = ApartmentSchema.parse({
      id: "bridge-street-example",
      name: "Bridge Street Example",
      address: "400 Bridge St NW, Grand Rapids, MI 49504",
      neighborhood: "Bridge Street",
      coordinates: { lat: 42.9698, lng: -85.6768 },
      websiteUrl: "https://example.com",
      fees: {
        monthlyParking: 100,
        monthlyTrash: 20,
      },
      specials: [
        {
          description: "1 month free on 12-month lease",
          monthsFree: 1,
        },
      ],
      units: [
        {
          unitId: "305",
          beds: 2,
          baths: 2,
          sqft: 1050,
          baseRent: 2400,
          leaseTermMonths: 12,
        },
        {
          unitId: "201",
          beds: 1,
          baths: 1,
          sqft: 720,
          baseRent: 1800,
          leaseTermMonths: 12,
        },
      ],
      meta: {
        lastUpdated: "2026-11-23T12:00:00.000Z",
      },
    });

    const normalized = normalizeApartment(raw);

    // Unit 201: 1800 + 120 - 150 = 1770
    // Unit 305: 2400 + 120 - 200 = 2320
    assert.equal(normalized.units[0].unitId, "201");
    assert.equal(normalized.units[0].effectiveMonthlyCost, 1770);
    assert.equal(normalized.units[1].unitId, "305");
    assert.equal(normalized.units[1].effectiveMonthlyCost, 2320);

    assert.deepEqual(normalized.summary, {
      minRent: 1800,
      maxRent: 2400,
      minEffectiveCost: 1770,
      maxEffectiveCost: 2320,
      availableUnitCount: 2,
      bedsAvailable: [1, 2],
    });
  });

  it("returns null summary stats when no units are available", () => {
    const summary = computeBuildingSummary([]);
    assert.deepEqual(summary, {
      minRent: null,
      maxRent: null,
      minEffectiveCost: null,
      maxEffectiveCost: null,
      availableUnitCount: 0,
      bedsAvailable: [],
    });
  });

  it("never drops effectiveMonthlyCost below $1", () => {
    const cost = calculateEffectiveMonthlyCost(
      { baseRent: 500, leaseTermMonths: 12 },
      FeesSchema.parse({}),
      [{ description: "Huge credit", monthsFree: null, flatCredit: 10000, expiresAt: null }]
    );
    assert.equal(cost, 1);
  });
});
