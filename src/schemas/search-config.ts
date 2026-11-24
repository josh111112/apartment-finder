import { z } from "zod";

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const SearchConfigSchema = z.object({
  city: z.string().min(1),
  state: z.string().min(2),
  areaName: z.string().min(1),
  locationNotes: z.string().default(""),
  center: CoordinatesSchema,
  searchRadiusMiles: z.number().positive().default(1.5),
  targetNeighborhoods: z.array(z.string()).default([]),
  propertyTypes: z
    .array(z.enum(["duplex", "townhome", "house", "flat", "condo", "apartment"]))
    .default(["duplex", "townhome", "house", "flat"]),
  excludeApartmentComplexes: z.boolean().default(true),
  criteria: z.object({
    minBeds: z.number().int().min(0).default(0),
    maxBeds: z.number().int().min(0).nullable().default(null),
    maxMonthlyBudget: z.number().positive().nullable().default(null),
    targetMoveInDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
      .nullable()
      .default(null),
    mustHaveAmenities: z.array(z.string()).default([]),
    niceToHaveAmenities: z.array(z.string()).default([]),
  }),
});

export type SearchConfig = z.infer<typeof SearchConfigSchema>;
