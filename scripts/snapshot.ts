import {
  createSnapshot,
  diffSnapshots,
  formatDiffReport,
} from "../src/lib/diff.js";
import { DATA_PATHS, readJsonFile, writeJsonFile } from "../src/lib/io.js";
import { ApartmentsFileSchema } from "../src/schemas/apartment.js";
import { PriceHistoryFileSchema } from "../src/schemas/history.js";

export async function runSnapshot(): Promise<void> {
  const apartmentsFile = ApartmentsFileSchema.parse(
    await readJsonFile<unknown>(DATA_PATHS.apartments)
  );
  const historyFile = PriceHistoryFileSchema.parse(
    await readJsonFile<unknown>(DATA_PATHS.priceHistory)
  );

  const currentSnapshot = createSnapshot(apartmentsFile.apartments);
  const previousSnapshot = historyFile.snapshots.at(-1);

  const changes = diffSnapshots(previousSnapshot, currentSnapshot);
  console.log(formatDiffReport(changes));

  // Only append a new snapshot if there is data and either it's the first snapshot
  // or something actually changed.
  const shouldAppend =
    currentSnapshot.buildings.length > 0 &&
    (!previousSnapshot || changes.length > 0);

  if (shouldAppend) {
    historyFile.snapshots.push(currentSnapshot);
    await writeJsonFile(DATA_PATHS.priceHistory, historyFile);
    console.log(
      `Saved snapshot #${historyFile.snapshots.length} to data/history/price-history.json.`
    );
  } else if (currentSnapshot.buildings.length === 0) {
    console.log("No apartments yet — skipping history snapshot.");
  } else {
    console.log("No changes detected — skipping duplicate history snapshot.");
  }
}

const isDirectRun = process.argv[1]?.endsWith("snapshot.ts");
if (isDirectRun) {
  runSnapshot().catch((err) => {
    console.error("Snapshot failed:", err);
    process.exit(1);
  });
}
