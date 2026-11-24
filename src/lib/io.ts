import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..");

export const DATA_PATHS = {
  searchConfig: path.join(REPO_ROOT, "data", "search-config.json"),
  sources: path.join(REPO_ROOT, "data", "sources.json"),
  apartments: path.join(REPO_ROOT, "data", "apartments.json"),
  priceHistory: path.join(REPO_ROOT, "data", "history", "price-history.json"),
} as const;

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const formatted = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(filePath, formatted, "utf8");
}
