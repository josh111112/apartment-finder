import apartmentsRaw from "../../../data/apartments.json" with { type: "json" };
import searchConfigRaw from "../../../data/search-config.json" with { type: "json" };
import type {
  Apartment,
  ApartmentsFile,
  SearchConfig,
  UserTracking,
} from "../../types/apartment.js";

export const apartmentsData = apartmentsRaw as ApartmentsFile;
export const searchConfigData = searchConfigRaw as SearchConfig;

export type UserStatus = UserTracking["status"];

export interface LocalUserOverride {
  status: UserStatus;
  notes: string;
}

const STORAGE_KEY = "westside-doorstep:user-overrides:v1";

export function loadUserOverrides(): Record<string, LocalUserOverride> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LocalUserOverride>;
  } catch {
    return {};
  }
}

export function saveUserOverrides(
  overrides: Record<string, LocalUserOverride>
): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "$—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortPrice(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 1000) {
    const k = amount / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${amount}`;
}

export function formatMoveInDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "Date TBD";
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getPrimaryUnit(apartment: Apartment) {
  return apartment.units[0] ?? null;
}

export function formatPropertyType(type: Apartment["propertyType"]): string {
  switch (type) {
    case "duplex":
      return "Duplex";
    case "townhome":
      return "Townhome";
    case "house":
      return "House";
    case "flat":
      return "Flat";
    case "condo":
      return "Condo";
    default:
      return "Rental";
  }
}
