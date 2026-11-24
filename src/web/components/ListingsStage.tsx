import { useMemo, useState } from "react";
import type { Apartment } from "../../types/apartment.js";
import {
  apartmentsData,
  formatCurrency,
  formatMoveInDate,
  formatPropertyType,
  getPrimaryUnit,
  loadUserOverrides,
  saveUserOverrides,
  type LocalUserOverride,
  type UserStatus,
} from "../data/listings.js";
import {
  CalendarIcon,
  ExternalLinkIcon,
  ListIcon,
  MapPinIcon,
  SearchIcon,
  SlidersIcon,
} from "./Icons.js";
import { ListingsMap } from "./ListingsMap.js";

const PROPERTY_TYPES = [
  { key: "all", label: "All" },
  { key: "duplex", label: "Duplex" },
  { key: "townhome", label: "Townhome" },
  { key: "house", label: "House" },
  { key: "flat", label: "Flat" },
] as const;

const BED_OPTIONS = [
  { key: "any", label: "Any beds" },
  { key: "1", label: "1 BR" },
  { key: "2", label: "2 BR" },
  { key: "3", label: "3 BR" },
  { key: "4+", label: "4+ BR" },
] as const;

const MONTH_OPTIONS = [
  { key: "all", label: "All dates (Apr–Jul)" },
  { key: "2027-04", label: "Late April" },
  { key: "2027-05", label: "May 2027" },
  { key: "2027-06", label: "June 2027" },
  { key: "2027-07", label: "Early July" },
] as const;

const BUDGET_OPTIONS = [
  { key: "any", label: "Any budget" },
  { key: "1500", label: "Up to $1,500" },
  { key: "1800", label: "Up to $1,800" },
  { key: "2200", label: "Up to $2,200" },
  { key: "2600", label: "Up to $2,600" },
  { key: "3000", label: "Up to $3,000" },
] as const;

const SORT_OPTIONS = [
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "date-asc", label: "Move-In: Soonest" },
  { key: "sqft-desc", label: "Size: Largest" },
] as const;

const STATUS_LABELS: Record<UserStatus, string> = {
  new: "New",
  interested: "Interested",
  toured: "Toured",
  applied: "Applied",
  ruled_out: "Ruled Out",
};

const AREA_OPTIONS = [
  { key: "all", label: "Both sides of river" },
  { key: "west", label: "Bridge St / Westside" },
  { key: "east", label: "Cherry St / Eastside" },
] as const;

type PropertyFilter = (typeof PROPERTY_TYPES)[number]["key"];
type BedFilter = (typeof BED_OPTIONS)[number]["key"];
type MonthFilter = (typeof MONTH_OPTIONS)[number]["key"];
type BudgetFilter = (typeof BUDGET_OPTIONS)[number]["key"];
type SortOption = (typeof SORT_OPTIONS)[number]["key"];
type AreaFilter = (typeof AREA_OPTIONS)[number]["key"];
type ViewMode = "list" | "map";

function isEastOfRiver(apt: Apartment): boolean {
  return /\b(49503|49506)\b/.test(apt.address) || /\b(SE|NE|E)\b/.test(apt.address);
}

export function ListingsStage() {
  const allListings = apartmentsData.apartments;

  const [query, setQuery] = useState("");
  const [area, setArea] = useState<AreaFilter>("all");
  const [propertyType, setPropertyType] = useState<PropertyFilter>("all");
  const [beds, setBeds] = useState<BedFilter>("any");
  const [month, setMonth] = useState<MonthFilter>("all");
  const [maxBudget, setMaxBudget] = useState<BudgetFilter>("any");
  const [sortBy, setSortBy] = useState<SortOption>("price-asc");
  const [hideRuledOut, setHideRuledOut] = useState(true);
  const [savedOnly, setSavedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, LocalUserOverride>>(
    () => loadUserOverrides()
  );

  const activeAdvancedFilterCount =
    (area !== "all" ? 1 : 0) +
    (beds !== "any" ? 1 : 0) +
    (month !== "all" ? 1 : 0) +
    (maxBudget !== "any" ? 1 : 0) +
    (savedOnly ? 1 : 0) +
    (!hideRuledOut ? 1 : 0);

  const getStatus = (apt: Apartment): UserStatus =>
    overrides[apt.id]?.status ?? apt.user.status;

  const getNotes = (apt: Apartment): string =>
    overrides[apt.id]?.notes ?? apt.user.notes;

  const updateOverride = (
    apt: Apartment,
    patch: Partial<LocalUserOverride>
  ) => {
    setOverrides((prev) => {
      const current: LocalUserOverride = prev[apt.id] ?? {
        status: apt.user.status,
        notes: apt.user.notes,
      };
      const next = { ...prev, [apt.id]: { ...current, ...patch } };
      saveUserOverrides(next);
      return next;
    });
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allListings.length };
    for (const apt of allListings) {
      counts[apt.propertyType] = (counts[apt.propertyType] ?? 0) + 1;
    }
    return counts;
  }, [allListings]);

  const statusMap = useMemo(() => {
    const map: Record<string, UserStatus> = {};
    for (const apt of allListings) {
      map[apt.id] = overrides[apt.id]?.status ?? apt.user.status;
    }
    return map;
  }, [allListings, overrides]);

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    const budgetLimit = maxBudget === "any" ? null : Number(maxBudget);

    const matches = allListings.filter((apt) => {
      const unit = getPrimaryUnit(apt);
      const price = apt.summary.minEffectiveCost ?? unit?.baseRent ?? 0;
      const status = overrides[apt.id]?.status ?? apt.user.status;

      if (hideRuledOut && status === "ruled_out") return false;
      if (
        savedOnly &&
        status !== "interested" &&
        status !== "toured" &&
        status !== "applied"
      ) {
        return false;
      }
      if (area === "west" && isEastOfRiver(apt)) return false;
      if (area === "east" && !isEastOfRiver(apt)) return false;
      if (propertyType !== "all" && apt.propertyType !== propertyType) {
        return false;
      }
      if (beds !== "any" && unit) {
        if (beds === "4+" ? unit.beds < 4 : unit.beds !== Number(beds)) {
          return false;
        }
      }
      if (month !== "all") {
        const avail = unit?.availableDate ?? "";
        if (!avail.startsWith(month)) return false;
      }
      if (budgetLimit !== null && price > budgetLimit) return false;

      if (q) {
        const haystack = [
          apt.name,
          apt.address,
          apt.neighborhood,
          apt.managementCompany ?? "",
          apt.parkingSummary ?? "",
          apt.petPolicy ?? "",
          ...apt.amenities.highlights,
          ...apt.utilitiesIncluded,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return matches.sort((a, b) => {
      const ua = getPrimaryUnit(a);
      const ub = getPrimaryUnit(b);
      const pa = a.summary.minEffectiveCost ?? ua?.baseRent ?? 0;
      const pb = b.summary.minEffectiveCost ?? ub?.baseRent ?? 0;

      if (sortBy === "price-asc") return pa - pb || a.name.localeCompare(b.name);
      if (sortBy === "price-desc") return pb - pa || a.name.localeCompare(b.name);
      if (sortBy === "date-asc") {
        const da = ua?.availableDate ?? "9999-99-99";
        const db = ub?.availableDate ?? "9999-99-99";
        return da.localeCompare(db) || pa - pb;
      }
      if (sortBy === "sqft-desc") {
        return (ub?.sqft ?? 0) - (ua?.sqft ?? 0) || pa - pb;
      }
      return 0;
    });
  }, [
    allListings,
    query,
    area,
    propertyType,
    beds,
    month,
    maxBudget,
    sortBy,
    hideRuledOut,
    savedOnly,
    overrides,
  ]);

  const savedCount = useMemo(
    () =>
      allListings.filter((a) => {
        const s = overrides[a.id]?.status ?? a.user.status;
        return s === "interested" || s === "toured" || s === "applied";
      }).length,
    [allListings, overrides]
  );

  const resetFilters = () => {
    setQuery("");
    setArea("all");
    setPropertyType("all");
    setBeds("any");
    setMonth("all");
    setMaxBudget("any");
    setSavedOnly(false);
    setHideRuledOut(true);
  };

  return (
    <main id="listings" className="listings-stage">
      <section className="listings-sheet" aria-labelledby="listings-heading">
        <div className="listings-header">
          <div>
            <h2 id="listings-heading" className="listings-heading">
              Bridge St, Westside &amp; Cherry St Rentals
            </h2>
            <p className="listings-lead tabular-nums">
              Showing <strong>{filteredListings.length}</strong> of{" "}
              {allListings.length} non-complex rentals across Westside (49504)
              and Cherry St / Heritage Hill / East Hills (49503 &amp; 49506).
            </p>
          </div>
          <div className="window-pill tabular-nums">
            <CalendarIcon size={15} />
            <span>APR 15 – JUL 15, 2027</span>
          </div>
        </div>

        {/* Primary Filter Row */}
        <div className="filter-bar" role="region" aria-label="Rental filters">
          <div
            className="filter-group filter-group--scroll"
            role="group"
            aria-label="Property type"
          >
            <span className="filter-label">Type</span>
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                className={`filter-pill ${
                  propertyType === type.key ? "filter-pill--active" : ""
                }`}
                aria-pressed={propertyType === type.key}
                onClick={() => setPropertyType(type.key)}
              >
                {type.label}
                <span className="pill-count tabular-nums">
                  {typeCounts[type.key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="filter-bar__right">
            <button
              type="button"
              className={`mobile-filters-btn ${
                mobileFiltersOpen || activeAdvancedFilterCount > 0
                  ? "mobile-filters-btn--active"
                  : ""
              }`}
              aria-expanded={mobileFiltersOpen}
              aria-controls="advanced-filters-panel"
              onClick={() => setMobileFiltersOpen((open) => !open)}
            >
              <SlidersIcon size={15} />
              <span>
                Filters
                {activeAdvancedFilterCount > 0
                  ? ` (${activeAdvancedFilterCount})`
                  : ""}
              </span>
            </button>

            <div className="view-toggle" role="group" aria-label="Layout mode">
              <button
                type="button"
                className={`view-toggle__btn ${
                  viewMode === "list" ? "view-toggle__btn--active" : ""
                }`}
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                <ListIcon size={15} />
                List
              </button>
              <button
                type="button"
                className={`view-toggle__btn ${
                  viewMode === "map" ? "view-toggle__btn--active" : ""
                }`}
                aria-pressed={viewMode === "map"}
                onClick={() => setViewMode("map")}
              >
                <MapPinIcon size={15} />
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Search + Collapsible Advanced Controls (always open on desktop) */}
        <div className="search-row-mobile">
          <label className="search-field">
            <span className="sr-only">Search street, neighborhood, or feature</span>
            <SearchIcon size={15} />
            <input
              id="listing-search"
              name="listing-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search street, Bridge St, garage, pets..."
            />
          </label>
        </div>

        <div
          id="advanced-filters-panel"
          className={`advanced-filters ${
            mobileFiltersOpen ? "advanced-filters--open" : ""
          }`}
        >
          <div className="controls-row">
            <div className="filter-group" role="group" aria-label="Bedrooms">
              {BED_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`filter-pill filter-pill--compact ${
                    beds === option.key ? "filter-pill--active" : ""
                  }`}
                  aria-pressed={beds === option.key}
                  onClick={() => setBeds(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="select-group">
              <select
                aria-label="Neighborhood side of river"
                className="control-select"
                value={area}
                onChange={(e) => setArea(e.target.value as AreaFilter)}
              >
                {AREA_OPTIONS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Move-in month"
                className="control-select"
                value={month}
                onChange={(e) => setMonth(e.target.value as MonthFilter)}
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Max monthly budget"
                className="control-select"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value as BudgetFilter)}
              >
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sort listings"
                className="control-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Saved / Ruled-out Quick Toggles */}
          <div className="subbar-row">
            <div className="subbar-toggles">
              <button
                type="button"
                className={`subbar-chip ${savedOnly ? "subbar-chip--active" : ""}`}
                aria-pressed={savedOnly}
                onClick={() => setSavedOnly((v) => !v)}
              >
                Shortlist ({savedCount})
              </button>
              <label className="checkbox-toggle">
                <input
                  type="checkbox"
                  checked={hideRuledOut}
                  onChange={(e) => setHideRuledOut(e.target.checked)}
                />
                <span>Hide ruled out</span>
              </label>
            </div>

            {(query ||
              area !== "all" ||
              propertyType !== "all" ||
              beds !== "any" ||
              month !== "all" ||
              maxBudget !== "any" ||
              savedOnly) && (
              <button
                type="button"
                className="reset-link"
                onClick={resetFilters}
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Main View: List or Map */}
        {filteredListings.length === 0 ? (
          <div className="empty-results">
            <h3 className="empty-results__title">
              No Westside rentals match those filters
            </h3>
            <p className="empty-results__copy">
              Try widening your budget, bedroom count, or move-in month to see
              more 49504 duplexes, townhomes, flats, and houses.
            </p>
            <button
              type="button"
              className="primary-cta"
              onClick={resetFilters}
            >
              Show all {allListings.length} listings
            </button>
          </div>
        ) : viewMode === "map" ? (
          <ListingsMap listings={filteredListings} statusMap={statusMap} />
        ) : (
          <div className="listings-grid">
            {filteredListings.map((apt) => {
              const unit = getPrimaryUnit(apt);
              const effectiveCost =
                apt.summary.minEffectiveCost ?? unit?.baseRent ?? null;
              const status = getStatus(apt);
              const notes = getNotes(apt);

              const amenityTags: string[] = [];
              if (apt.amenities.inUnitLaundry === true) {
                amenityTags.push("In-unit W/D");
              }
              if (apt.amenities.ac === true) amenityTags.push("A/C");
              if (apt.amenities.dishwasher === true) {
                amenityTags.push("Dishwasher");
              }
              if (apt.petPolicy) {
                const lowerPet = apt.petPolicy.toLowerCase();
                if (lowerPet.includes("no pet")) {
                  amenityTags.push("No pets");
                } else {
                  amenityTags.push("Pets OK");
                }
              }
              if (apt.parkingSummary) {
                amenityTags.push(apt.parkingSummary);
              }

              return (
                <article
                  key={apt.id}
                  className={`listing-card ${
                    status === "interested" ||
                    status === "toured" ||
                    status === "applied"
                      ? "listing-card--saved"
                      : ""
                  }`}
                >
                  <div className="listing-card__top">
                    <div className="listing-card__badges">
                      <span className="type-tag">
                        {formatPropertyType(apt.propertyType)}
                      </span>
                      <span className="neighborhood-tag">
                        {apt.neighborhood}
                      </span>
                    </div>
                    <div className="listing-card__price tabular-nums">
                      {formatCurrency(effectiveCost)}
                      <span>/mo</span>
                    </div>
                  </div>

                  <h3 className="listing-card__title">{apt.name}</h3>

                  <div className="listing-card__specs tabular-nums">
                    {unit && (
                      <>
                        <span>
                          {unit.beds} {unit.beds === 1 ? "bd" : "bds"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{unit.baths} ba</span>
                        {unit.sqft && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{unit.sqft.toLocaleString()} sqft</span>
                          </>
                        )}
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="movein-text">
                      {formatMoveInDate(unit?.availableDate)}
                    </span>
                  </div>

                  {amenityTags.length > 0 && (
                    <div className="amenity-row">
                      {amenityTags.slice(0, 4).map((tag) => (
                        <span key={tag} className="amenity-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {apt.amenities.highlights.length > 0 && (
                    <p className="listing-card__highlight">
                      {apt.amenities.highlights[0]}
                    </p>
                  )}

                  <div className="listing-card__footer">
                    <div className="status-control">
                      <label className="sr-only" htmlFor={`status-${apt.id}`}>
                        Tracking status for {apt.name}
                      </label>
                      <select
                        id={`status-${apt.id}`}
                        className={`status-select status-select--${status}`}
                        value={status}
                        onChange={(e) =>
                          updateOverride(apt, {
                            status: e.target.value as UserStatus,
                          })
                        }
                      >
                        {(Object.keys(STATUS_LABELS) as UserStatus[]).map(
                          (key) => (
                            <option key={key} value={key}>
                              {STATUS_LABELS[key]}
                            </option>
                          )
                        )}
                      </select>

                      <input
                        id={`note-${apt.id}`}
                        name={`note-${apt.id}`}
                        type="text"
                        className="note-input"
                        aria-label={`Personal note for ${apt.name}`}
                        placeholder="Add tour note..."
                        value={notes}
                        onChange={(e) =>
                          updateOverride(apt, { notes: e.target.value })
                        }
                      />
                    </div>

                    <a
                      href={apt.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="listing-link"
                    >
                      <span>{apt.managementCompany ?? "View listing"}</span>
                      <ExternalLinkIcon size={13} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="stage-footer tabular-nums">
        Westside Doorstep · Grand Rapids 49504 · {allListings.length} verified
        listings · Notes saved locally in your browser
      </footer>
    </main>
  );
}
