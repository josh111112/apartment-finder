import { DATA_PATHS, readJsonFile, writeJsonFile } from "../src/lib/io.js";
import { normalizeApartment } from "../src/lib/pricing.js";
import { ApartmentsFileSchema } from "../src/schemas/apartment.js";

export async function runNormalize(): Promise<void> {
  const raw = await readJsonFile<unknown>(DATA_PATHS.apartments);
  const parsed = ApartmentsFileSchema.parse(raw);

  const normalizedApartments = parsed.apartments
    .map((apt) => normalizeApartment(apt))
    .sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    generatedAt: new Date().toISOString(),
    apartments: normalizedApartments,
  };

  await writeJsonFile(DATA_PATHS.apartments, output);
  console.log(
    `Normalized ${normalizedApartments.length} apartment building(s) in data/apartments.json.`
  );
}

const isDirectRun = process.argv[1]?.endsWith("normalize.ts");
if (isDirectRun) {
  runNormalize().catch((err) => {
    console.error("Normalize failed:", err);
    process.exit(1);
  });
}
