import type { Apartment } from "../types/apartment.js";

/**
 * Safely merges an incoming apartment update into an existing record.
 * Always preserves the user's personal tracking block (status, rating,
 * tourDate, notes, pros, cons) unless explicitly requested.
 */
export function mergeApartmentUpdate(
  existing: Apartment | undefined,
  incoming: Apartment,
  options: { overwriteUser?: boolean } = {}
): Apartment {
  if (!existing || options.overwriteUser) {
    return incoming;
  }

  return {
    ...incoming,
    user: {
      status: existing.user.status,
      rating: existing.user.rating,
      tourDate: existing.user.tourDate,
      notes: existing.user.notes,
      pros: [...existing.user.pros],
      cons: [...existing.user.cons],
    },
  };
}

/**
 * Merges a batch of incoming apartment updates into an existing list by ID,
 * preserving user tracking data and retaining any existing buildings not in the batch.
 */
export function mergeApartmentList(
  existingList: Apartment[],
  incomingList: Apartment[]
): Apartment[] {
  const byId = new Map<string, Apartment>();

  for (const apt of existingList) {
    byId.set(apt.id, apt);
  }

  for (const incoming of incomingList) {
    const existing = byId.get(incoming.id);
    byId.set(incoming.id, mergeApartmentUpdate(existing, incoming));
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}
