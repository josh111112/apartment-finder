import { DATA_PATHS, readJsonFile } from "../src/lib/io.js";
import { ApartmentsFileSchema } from "../src/schemas/apartment.js";
import { PriceHistoryFileSchema } from "../src/schemas/history.js";
import { SearchConfigSchema } from "../src/schemas/search-config.js";
import { SourcesFileSchema } from "../src/schemas/source.js";

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return Array.from(duplicates);
}

export async function runValidate(): Promise<void> {
  const errors: string[] = [];

  const searchConfigRaw = await readJsonFile<unknown>(DATA_PATHS.searchConfig);
  const searchConfigRes = SearchConfigSchema.safeParse(searchConfigRaw);
  if (!searchConfigRes.success) {
    errors.push(`data/search-config.json:\n${searchConfigRes.error.toString()}`);
  }

  const sourcesRaw = await readJsonFile<unknown>(DATA_PATHS.sources);
  const sourcesRes = SourcesFileSchema.safeParse(sourcesRaw);
  if (!sourcesRes.success) {
    errors.push(`data/sources.json:\n${sourcesRes.error.toString()}`);
  } else {
    const dupSources = findDuplicates(sourcesRes.data.sources.map((s) => s.id));
    if (dupSources.length > 0) {
      errors.push(`data/sources.json has duplicate source IDs: ${dupSources.join(", ")}`);
    }
  }

  const apartmentsRaw = await readJsonFile<unknown>(DATA_PATHS.apartments);
  const apartmentsRes = ApartmentsFileSchema.safeParse(apartmentsRaw);
  if (!apartmentsRes.success) {
    errors.push(`data/apartments.json:\n${apartmentsRes.error.toString()}`);
  } else {
    const dupApts = findDuplicates(apartmentsRes.data.apartments.map((a) => a.id));
    if (dupApts.length > 0) {
      errors.push(`data/apartments.json has duplicate apartment IDs: ${dupApts.join(", ")}`);
    }

    for (const apt of apartmentsRes.data.apartments) {
      const dupUnits = findDuplicates(apt.units.map((u) => u.unitId));
      if (dupUnits.length > 0) {
        errors.push(
          `Apartment "${apt.id}" has duplicate unitIds: ${dupUnits.join(", ")}`
        );
      }
    }
  }

  const historyRaw = await readJsonFile<unknown>(DATA_PATHS.priceHistory);
  const historyRes = PriceHistoryFileSchema.safeParse(historyRaw);
  if (!historyRes.success) {
    errors.push(`data/history/price-history.json:\n${historyRes.error.toString()}`);
  }

  if (errors.length > 0) {
    console.error("Validation failed:\n\n" + errors.join("\n\n"));
    process.exit(1);
  }

  const aptCount = apartmentsRes.success ? apartmentsRes.data.apartments.length : 0;
  const srcCount = sourcesRes.success ? sourcesRes.data.sources.length : 0;
  console.log(
    `Validation passed! (${srcCount} tracked source(s), ${aptCount} apartment building(s))`
  );
}

const isDirectRun = process.argv[1]?.endsWith("validate.ts");
if (isDirectRun) {
  runValidate().catch((err) => {
    console.error("Validate failed:", err);
    process.exit(1);
  });
}
