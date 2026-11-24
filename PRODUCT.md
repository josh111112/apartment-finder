# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, deployed as a static site to GitHub Pages.

## Users

A personal renter searching for non-complex residential rentals (duplexes, townhomes, upper/lower flats, and houses) in Downtown Grand Rapids, Michigan — specifically the Bridge Street NW corridor and neighborhoods west of the Grand River (49504: West Grand, SWAN, Westside Connection, Downtown West, John Ball Park east edge) — targeting late April through early July 2027 move-in dates.

## Product Purpose

Provide a focused, personal rental-hunting web experience that brings together scattered Grand Rapids residential listings from local property managers (such as American Realty, The Fulton Group, Shift PM, etc.) into one visual, scannable site — opening with an interactive scroll-driven welcome sequence that steps through the front door into the living room, where the rental listings surface sits in front of the interior backdrop.

## Positioning

Unlike generic national apartment aggregators cluttered with large corporate complexes and ad noise, this is a curated, personal Westside Grand Rapids rental finder built exclusively around duplexes, townhomes, flats, and houses, backed by an AI-agent-refreshed static JSON dataset.

## Operating Context

- Hosted statically on GitHub Pages with no runtime backend server.
- Data lives in version-controlled, Zod-validated JSON files (`data/apartments.json`, `data/sources.json`, `data/search-config.json`) updated on-demand by an AI agent.
- Current phase builds the frontend visual experience and scroll-driven door-to-interior transition first; live backend data wiring into the foreground listings stage comes in a subsequent pass.

## Capabilities and Constraints

- Must open with the provided closed-door bungalow illustration (`house_door_closed.jpg`), transition to the open-door illustration (`house_door_opened_inward_1795495008757.jpg`) as the user scrolls, and zoom through the doorway into the living room interior (`inside_house.jpg`) which settles as the background behind the upcoming listings foreground.
- Must remain lightweight, smooth at 60fps, and respectful of `prefers-reduced-motion`.
- Backend data population in the UI is intentionally deferred for this first pass; the foreground listings stage should present a clear, purposeful shell ready to receive `data/apartments.json`.

## Brand Commitments

- User-supplied three-frame editorial illustration sequence (clean deep-navy linework, sky-blue arch, terracotta roof, warm honey oak wood, sunlit cream interior) anchors the opening experience and visual world.

## Evidence on Hand

- `data/apartments.json`: 105 validated Grand Rapids 49504 duplex/townhome/flat/house listings (deferred for UI wiring in this pass).
- Three cohesive house-entry illustrations provided by the user:
  - `house_door_closed.jpg`
  - `house_door_opened_inward_1795495008757.jpg`
  - `inside_house.jpg`

## Product Principles

- **Step inside first:** The scroll-driven threshold (closed door → open door → zoomed interior backdrop) is the signature moment that makes house hunting feel personal and inviting.
- **Backdrop serves the listings:** Once zoomed inside, the living room illustration recedes calmly into the background so foreground rental listings remain crisp and legible.
- **Zero complex clutter:** Everything about the site reflects Grand Rapids Westside residential character (duplexes, townhomes, flats, houses), never corporate apartment-complex templates.
- **Static & fast:** Runs cleanly on GitHub Pages with zero backend dependencies.
