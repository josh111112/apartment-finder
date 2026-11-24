import { useEffect, useRef, useState } from "react";
import { ArrowDownIcon } from "./Icons.js";

export type ThresholdStage = "porch" | "door" | "inside";

interface DoorThresholdProps {
  onStageChange: (stage: ThresholdStage) => void;
  onJumpToListings: () => void;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function segment(progress: number, start: number, end: number): number {
  return clamp((progress - start) / (end - start));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function DoorThreshold({
  onStageChange,
  onJumpToListings,
}: DoorThresholdProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastStageRef = useRef<ThresholdStage>("porch");
  const [stage, setStage] = useState<ThresholdStage>("porch");

  useEffect(() => {
    const root = document.documentElement;
    let rafId = 0;

    const updateFromScroll = () => {
      rafId = 0;
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = clamp(-rect.top / scrollable);

      // Phase 1 (0.00 -> 0.22): Hero copy fades cleanly before zoom
      const heroFade = 1 - easeOutCubic(segment(p, 0.04, 0.24));
      const heroY = -28 * easeOutCubic(segment(p, 0.04, 0.24));
      const cueY = 18 * easeOutCubic(segment(p, 0.04, 0.24));

      // Phase 2 (0.18 -> 0.44): Door swings open inward in pixel-aligned frame
      const doorOpen = easeInOutQuad(segment(p, 0.16, 0.42));

      // Phase 3 (0.34 -> 0.84): Camera glides into the doorway and reveals interior
      const approachScale = 1 + 0.34 * easeOutCubic(segment(p, 0.16, 0.44));
      const zoomThrough = easeInOutQuad(segment(p, 0.42, 0.84));
      const exteriorScale = approachScale + zoomThrough * 4.4;
      const exteriorOpacity = 1 - easeInOutQuad(segment(p, 0.58, 0.82));
      const exteriorBgOpacity = 1 - easeInOutQuad(segment(p, 0.52, 0.78));

      // Interior living room rises from doorway and settles as fixed backdrop
      const interiorAppear = easeOutCubic(segment(p, 0.5, 0.84));
      const interiorScale = 0.84 + 0.22 * interiorAppear;
      const scrimOpacity = easeOutCubic(segment(p, 0.78, 1.0));

      // Subtle mid-transition status pill while opening the door
      const midIn = segment(p, 0.24, 0.34);
      const midOut = 1 - segment(p, 0.52, 0.64);
      const midCaptionOpacity = clamp(Math.min(midIn, midOut));

      root.style.setProperty("--hero-opacity", heroFade.toFixed(3));
      root.style.setProperty("--hero-y", `${heroY.toFixed(1)}px`);
      root.style.setProperty("--cue-y", `${cueY.toFixed(1)}px`);
      root.style.setProperty("--hero-pointer", heroFade < 0.15 ? "none" : "auto");
      root.style.setProperty("--door-open", doorOpen.toFixed(3));
      root.style.setProperty("--exterior-scale", exteriorScale.toFixed(3));
      root.style.setProperty("--exterior-opacity", exteriorOpacity.toFixed(3));
      root.style.setProperty("--exterior-bg-opacity", exteriorBgOpacity.toFixed(3));
      root.style.setProperty("--interior-opacity", interiorAppear.toFixed(3));
      root.style.setProperty("--interior-scale", interiorScale.toFixed(3));
      root.style.setProperty("--scrim-opacity", scrimOpacity.toFixed(3));
      root.style.setProperty("--mid-caption-opacity", midCaptionOpacity.toFixed(3));

      const nextStage: ThresholdStage =
        p < 0.25 ? "porch" : p < 0.72 ? "door" : "inside";
      if (nextStage !== lastStageRef.current) {
        lastStageRef.current = nextStage;
        setStage(nextStage);
        onStageChange(nextStage);
      }
    };

    const schedule = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateFromScroll);
      }
    };

    updateFromScroll();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [onStageChange]);

  const scrollToStage = (target: ThresholdStage) => {
    const track = trackRef.current;
    if (!track) return;
    const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);

    if (target === "porch") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (target === "door") {
      window.scrollTo({ top: Math.round(scrollable * 0.42), behavior: "smooth" });
    } else {
      onJumpToListings();
    }
  };

  return (
    <>
      {/* Fixed interior living-room backdrop that stays behind listings */}
      <div className="interior-backdrop" aria-hidden="true">
        <img
          src="./images/inside-house.jpg"
          alt=""
          className="interior-backdrop__img"
        />
        <div className="interior-backdrop__scrim" />
      </div>

      {/* Scroll-driven threshold sequence */}
      <section
        ref={trackRef}
        className="threshold-track"
        aria-label="Step inside Westside Doorstep"
      >
        <div className="threshold-viewport">
          <div className="threshold-hero-copy">
            <h1 className="threshold-title">
              Westside homes, without the complexes.
            </h1>
            <p className="threshold-subtitle">
              Duplexes, townhomes, and neighborhood flats near Bridge Street and
              west of the Grand River.
            </p>
          </div>

          <div className="house-stage" aria-hidden="true">
            <img
              src="./images/house-door-closed.jpg"
              alt="Illustrated Grand Rapids Westside bungalow with front door closed"
              className="house-img house-img--closed"
            />
            <img
              src="./images/house-door-open.jpg"
              alt="Illustrated Grand Rapids Westside bungalow with front door opened inward"
              className="house-img house-img--open"
            />
          </div>

          <div className="threshold-cue">
            <button
              type="button"
              className="primary-cta"
              onClick={onJumpToListings}
            >
              Step inside
              <ArrowDownIcon size={16} />
            </button>
            <span className="scroll-hint">
              Scroll to open the door
              <span className="scroll-hint__arrow">
                <ArrowDownIcon size={14} />
              </span>
            </span>
          </div>
        </div>
      </section>

      <div className="door-stage-caption" aria-hidden="true">
        Stepping inside&hellip;
      </div>

      {/* Accessible kinetic step controls */}
      <nav className="step-rail" aria-label="Entry sequence stages">
        <button
          type="button"
          className={`step-rail__btn ${stage === "porch" ? "step-rail__btn--active" : ""}`}
          onClick={() => scrollToStage("porch")}
          aria-current={stage === "porch" ? "step" : undefined}
        >
          Porch
        </button>
        <button
          type="button"
          className={`step-rail__btn ${stage === "door" ? "step-rail__btn--active" : ""}`}
          onClick={() => scrollToStage("door")}
          aria-current={stage === "door" ? "step" : undefined}
        >
          Open Door
        </button>
        <button
          type="button"
          className={`step-rail__btn ${stage === "inside" ? "step-rail__btn--active" : ""}`}
          onClick={() => scrollToStage("inside")}
          aria-current={stage === "inside" ? "step" : undefined}
        >
          Inside
        </button>
      </nav>
    </>
  );
}
