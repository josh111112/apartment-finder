import { z } from "zod";

export const SourceSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID must be kebab-case (e.g. 'hendrik-bridge-street')"),
  name: z.string().min(1),
  websiteUrl: z.string().url(),
  availabilityUrl: z.string().url().nullable().default(null),
  active: z.boolean().default(true),
  lastCheckedAt: z.string().datetime().nullable().default(null),
  notes: z.string().default(""),
});

export const SourcesFileSchema = z.object({
  sources: z.array(SourceSchema),
});

export type Source = z.infer<typeof SourceSchema>;
export type SourcesFile = z.infer<typeof SourcesFileSchema>;
