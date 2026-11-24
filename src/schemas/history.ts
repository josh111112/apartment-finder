import { z } from "zod";

export const BuildingSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  minRent: z.number().positive().nullable(),
  minEffectiveCost: z.number().positive().nullable(),
  availableUnitCount: z.number().int().nonnegative(),
});

export const PriceSnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  buildings: z.array(BuildingSnapshotSchema),
});

export const PriceHistoryFileSchema = z.object({
  snapshots: z.array(PriceSnapshotSchema),
});

export type BuildingSnapshot = z.infer<typeof BuildingSnapshotSchema>;
export type PriceSnapshot = z.infer<typeof PriceSnapshotSchema>;
export type PriceHistoryFile = z.infer<typeof PriceHistoryFileSchema>;
