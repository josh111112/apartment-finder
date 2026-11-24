import type {
  Apartment,
  BuildingSummary,
  Fees,
  Special,
  Unit,
} from "../types/apartment.js";

/**
 * Sums predictable monthly recurring fees (excluding optional pet rent by default,
 * unless includePetFee is true).
 */
export function calculateRecurringMonthlyFees(
  fees: Fees,
  options: { includeParking?: boolean; includePetFee?: boolean } = {}
): number {
  const { includeParking = true, includePetFee = false } = options;

  let total = 0;
  if (includeParking && fees.monthlyParking) total += fees.monthlyParking;
  if (fees.monthlyTrash) total += fees.monthlyTrash;
  if (fees.monthlyAmenity) total += fees.monthlyAmenity;
  if (includePetFee && fees.monthlyPet) total += fees.monthlyPet;

  for (const item of fees.monthlyOther) {
    total += item.amount;
  }

  return roundCurrency(total);
}

/**
 * Calculates the monthly prorated discount across active move-in specials
 * over the unit's lease term (defaults to 12 months).
 */
export function calculateProratedSpecial(
  specials: Special[],
  baseRent: number,
  leaseTermMonths = 12
): number {
  if (specials.length === 0 || leaseTermMonths <= 0) return 0;

  let totalDiscount = 0;
  for (const special of specials) {
    if (special.monthsFree && special.monthsFree > 0) {
      totalDiscount += (baseRent * special.monthsFree) / leaseTermMonths;
    }
    if (special.flatCredit && special.flatCredit > 0) {
      totalDiscount += special.flatCredit / leaseTermMonths;
    }
  }

  return roundCurrency(totalDiscount);
}

/**
 * Computes the effective ("true") monthly cost for a unit:
 * baseRent + recurring monthly fees - prorated move-in specials.
 */
export function calculateEffectiveMonthlyCost(
  unit: Pick<Unit, "baseRent" | "leaseTermMonths">,
  fees: Fees,
  specials: Special[]
): number {
  const recurringFees = calculateRecurringMonthlyFees(fees);
  const proratedDiscount = calculateProratedSpecial(
    specials,
    unit.baseRent,
    unit.leaseTermMonths ?? 12
  );
  const effective = Math.max(1, unit.baseRent + recurringFees - proratedDiscount);
  return roundCurrency(effective);
}

/**
 * Computes aggregate rent, effective cost, unit count, and available bed counts
 * for a building from its normalized units list.
 */
export function computeBuildingSummary(units: Unit[]): BuildingSummary {
  if (units.length === 0) {
    return {
      minRent: null,
      maxRent: null,
      minEffectiveCost: null,
      maxEffectiveCost: null,
      availableUnitCount: 0,
      bedsAvailable: [],
    };
  }

  const rents = units.map((u) => u.baseRent);
  const effectiveCosts = units.map((u) => u.effectiveMonthlyCost ?? u.baseRent);
  const bedsSet = new Set(units.map((u) => u.beds));

  return {
    minRent: Math.min(...rents),
    maxRent: Math.max(...rents),
    minEffectiveCost: Math.min(...effectiveCosts),
    maxEffectiveCost: Math.max(...effectiveCosts),
    availableUnitCount: units.length,
    bedsAvailable: Array.from(bedsSet).sort((a, b) => a - b),
  };
}

/**
 * Normalizes a single apartment: computes effectiveMonthlyCost for each unit,
 * sorts units by effectiveMonthlyCost ascending, and recomputes building summary.
 */
export function normalizeApartment(apartment: Apartment): Apartment {
  const normalizedUnits: Unit[] = apartment.units
    .map((unit) => ({
      ...unit,
      effectiveMonthlyCost: calculateEffectiveMonthlyCost(
        unit,
        apartment.fees,
        apartment.specials
      ),
    }))
    .sort((a, b) => {
      const costDiff = (a.effectiveMonthlyCost ?? a.baseRent) - (b.effectiveMonthlyCost ?? b.baseRent);
      if (costDiff !== 0) return costDiff;
      return a.unitId.localeCompare(b.unitId);
    });

  return {
    ...apartment,
    units: normalizedUnits,
    summary: computeBuildingSummary(normalizedUnits),
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
