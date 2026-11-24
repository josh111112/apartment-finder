import { z } from "zod";
import { CoordinatesSchema } from "./search-config.js";

export const RecurringFeeItemSchema = z.object({
  label: z.string().min(1),
  amount: z.number().nonnegative(),
});

export const FeesSchema = z.object({
  application: z.number().nonnegative().nullable().default(null),
  admin: z.number().nonnegative().nullable().default(null),
  deposit: z.number().nonnegative().nullable().default(null),
  monthlyParking: z.number().nonnegative().nullable().default(null),
  monthlyTrash: z.number().nonnegative().nullable().default(null),
  monthlyAmenity: z.number().nonnegative().nullable().default(null),
  monthlyPet: z.number().nonnegative().nullable().default(null),
  monthlyOther: z.array(RecurringFeeItemSchema).default([]),
});

export const SpecialSchema = z.object({
  description: z.string().min(1),
  monthsFree: z.number().nonnegative().nullable().default(null),
  flatCredit: z.number().nonnegative().nullable().default(null),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .nullable()
    .default(null),
});

export const AmenitiesSchema = z.object({
  inUnitLaundry: z.boolean().nullable().default(null),
  balcony: z.boolean().nullable().default(null),
  gym: z.boolean().nullable().default(null),
  pool: z.boolean().nullable().default(null),
  ac: z.boolean().nullable().default(null),
  dishwasher: z.boolean().nullable().default(null),
  evCharging: z.boolean().nullable().default(null),
  rooftop: z.boolean().nullable().default(null),
  concierge: z.boolean().nullable().default(null),
  highlights: z.array(z.string()).default([]),
});

export const UnitSchema = z.object({
  unitId: z.string().min(1),
  floorPlanName: z.string().nullable().default(null),
  beds: z.number().min(0),
  baths: z.number().min(0),
  sqft: z.number().positive().nullable().default(null),
  baseRent: z.number().positive(),
  effectiveMonthlyCost: z.number().positive().optional(),
  availableDate: z.string().nullable().default(null),
  floor: z.number().int().nullable().default(null),
  leaseTermMonths: z.number().int().positive().default(12),
  url: z.string().url().nullable().default(null),
});

export const BuildingSummarySchema = z.object({
  minRent: z.number().positive().nullable().default(null),
  maxRent: z.number().positive().nullable().default(null),
  minEffectiveCost: z.number().positive().nullable().default(null),
  maxEffectiveCost: z.number().positive().nullable().default(null),
  availableUnitCount: z.number().int().nonnegative().default(0),
  bedsAvailable: z.array(z.number().min(0)).default([]),
});

export const UserTrackingSchema = z.object({
  status: z
    .enum(["new", "interested", "toured", "applied", "ruled_out"])
    .default("new"),
  rating: z.number().int().min(1).max(5).nullable().default(null),
  tourDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .nullable()
    .default(null),
  notes: z.string().default(""),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
});

export const MetaSchema = z.object({
  lastUpdated: z.string().datetime(),
  confidence: z.enum(["verified", "estimated", "stale"]).default("verified"),
  sourceUrls: z.array(z.string().url()).default([]),
});

export const ApartmentSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID must be kebab-case"),
  name: z.string().min(1),
  propertyType: z
    .enum(["duplex", "townhome", "house", "flat", "condo", "other"])
    .default("duplex"),
  address: z.string().min(1),
  neighborhood: z.string().min(1),
  coordinates: CoordinatesSchema,
  websiteUrl: z.string().url(),
  availabilityUrl: z.string().url().nullable().default(null),
  phone: z.string().nullable().default(null),
  managementCompany: z.string().nullable().default(null),
  yearBuilt: z.number().int().min(1800).max(2100).nullable().default(null),
  stories: z.number().int().positive().nullable().default(null),
  petPolicy: z.string().nullable().default(null),
  parkingSummary: z.string().nullable().default(null),
  utilitiesIncluded: z.array(z.string()).default([]),
  fees: FeesSchema.default({}),
  specials: z.array(SpecialSchema).default([]),
  amenities: AmenitiesSchema.default({}),
  units: z.array(UnitSchema).default([]),
  summary: BuildingSummarySchema.default({}),
  user: UserTrackingSchema.default({}),
  meta: MetaSchema,
});

export const ApartmentsFileSchema = z.object({
  generatedAt: z.string().datetime(),
  apartments: z.array(ApartmentSchema),
});

export type Fees = z.infer<typeof FeesSchema>;
export type Special = z.infer<typeof SpecialSchema>;
export type Amenities = z.infer<typeof AmenitiesSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type BuildingSummary = z.infer<typeof BuildingSummarySchema>;
export type UserTracking = z.infer<typeof UserTrackingSchema>;
export type Apartment = z.infer<typeof ApartmentSchema>;
export type ApartmentsFile = z.infer<typeof ApartmentsFileSchema>;
