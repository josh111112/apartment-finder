import type {
  Apartment,
  BuildingSnapshot,
  PriceSnapshot,
} from "../types/apartment.js";

export interface BuildingChange {
  id: string;
  name: string;
  type: "added" | "removed" | "changed";
  previousMinRent: number | null;
  currentMinRent: number | null;
  minRentDelta: number | null;
  previousMinEffective: number | null;
  currentMinEffective: number | null;
  minEffectiveDelta: number | null;
  previousUnits: number;
  currentUnits: number;
  unitsDelta: number;
}

export function createSnapshot(
  apartments: Apartment[],
  timestamp = new Date().toISOString()
): PriceSnapshot {
  const buildings: BuildingSnapshot[] = apartments
    .map((apt) => ({
      id: apt.id,
      name: apt.name,
      minRent: apt.summary.minRent,
      minEffectiveCost: apt.summary.minEffectiveCost,
      availableUnitCount: apt.summary.availableUnitCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { timestamp, buildings };
}

export function diffSnapshots(
  previous: PriceSnapshot | undefined,
  current: PriceSnapshot
): BuildingChange[] {
  const changes: BuildingChange[] = [];
  const prevMap = new Map(previous?.buildings.map((b) => [b.id, b]) ?? []);
  const currMap = new Map(current.buildings.map((b) => [b.id, b]));

  for (const curr of current.buildings) {
    const prev = prevMap.get(curr.id);
    if (!prev) {
      changes.push({
        id: curr.id,
        name: curr.name,
        type: "added",
        previousMinRent: null,
        currentMinRent: curr.minRent,
        minRentDelta: null,
        previousMinEffective: null,
        currentMinEffective: curr.minEffectiveCost,
        minEffectiveDelta: null,
        previousUnits: 0,
        currentUnits: curr.availableUnitCount,
        unitsDelta: curr.availableUnitCount,
      });
      continue;
    }

    const minRentDelta =
      prev.minRent !== null && curr.minRent !== null
        ? roundCurrency(curr.minRent - prev.minRent)
        : null;
    const minEffectiveDelta =
      prev.minEffectiveCost !== null && curr.minEffectiveCost !== null
        ? roundCurrency(curr.minEffectiveCost - prev.minEffectiveCost)
        : null;
    const unitsDelta = curr.availableUnitCount - prev.availableUnitCount;

    const hasDiff =
      prev.minRent !== curr.minRent ||
      prev.minEffectiveCost !== curr.minEffectiveCost ||
      unitsDelta !== 0;

    if (hasDiff) {
      changes.push({
        id: curr.id,
        name: curr.name,
        type: "changed",
        previousMinRent: prev.minRent,
        currentMinRent: curr.minRent,
        minRentDelta,
        previousMinEffective: prev.minEffectiveCost,
        currentMinEffective: curr.minEffectiveCost,
        minEffectiveDelta,
        previousUnits: prev.availableUnitCount,
        currentUnits: curr.availableUnitCount,
        unitsDelta,
      });
    }
  }

  for (const prev of previous?.buildings ?? []) {
    if (!currMap.has(prev.id)) {
      changes.push({
        id: prev.id,
        name: prev.name,
        type: "removed",
        previousMinRent: prev.minRent,
        currentMinRent: null,
        minRentDelta: null,
        previousMinEffective: prev.minEffectiveCost,
        currentMinEffective: null,
        minEffectiveDelta: null,
        previousUnits: prev.availableUnitCount,
        currentUnits: 0,
        unitsDelta: -prev.availableUnitCount,
      });
    }
  }

  return changes;
}

export function formatDiffReport(changes: BuildingChange[]): string {
  if (changes.length === 0) {
    return "No pricing or unit availability changes since the last snapshot.";
  }

  const lines: string[] = ["Snapshot Diff Summary:"];
  for (const change of changes) {
    if (change.type === "added") {
      const priceStr =
        change.currentMinEffective !== null
          ? `from $${change.currentMinEffective}/mo effective`
          : "no listed units";
      lines.push(
        `  + [ADDED] ${change.name} (${change.currentUnits} units, ${priceStr})`
      );
    } else if (change.type === "removed") {
      lines.push(`  - [REMOVED] ${change.name}`);
    } else {
      const parts: string[] = [];
      if (change.minEffectiveDelta !== null && change.minEffectiveDelta !== 0) {
        const sign = change.minEffectiveDelta > 0 ? "+" : "";
        parts.push(
          `effective min ${sign}$${change.minEffectiveDelta} ($${change.previousMinEffective} -> $${change.currentMinEffective})`
        );
      } else if (change.previousMinEffective !== change.currentMinEffective) {
        parts.push(
          `effective min ${change.previousMinEffective ?? "n/a"} -> ${change.currentMinEffective ?? "n/a"}`
        );
      }
      if (change.unitsDelta !== 0) {
        const sign = change.unitsDelta > 0 ? "+" : "";
        parts.push(
          `units ${sign}${change.unitsDelta} (${change.previousUnits} -> ${change.currentUnits})`
        );
      }
      lines.push(`  ~ [CHANGED] ${change.name}: ${parts.join(", ")}`);
    }
  }

  return lines.join("\n");
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
