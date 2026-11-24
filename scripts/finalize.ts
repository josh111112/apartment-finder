import { runNormalize } from "./normalize.js";
import { runSnapshot } from "./snapshot.js";
import { runValidate } from "./validate.js";

async function runFinalize(): Promise<void> {
  console.log("Step 1/3: Normalizing apartment costs and summaries...");
  await runNormalize();

  console.log("\nStep 2/3: Validating all data files...");
  await runValidate();

  console.log("\nStep 3/3: Computing price-history diff and snapshot...");
  await runSnapshot();

  console.log("\nFinalize complete.");
}

runFinalize().catch((err) => {
  console.error("Finalize failed:", err);
  process.exit(1);
});
