import { useCallback, useState } from "react";
import { DoorThreshold, type ThresholdStage } from "./components/DoorThreshold.js";
import { DoorArchIcon } from "./components/Icons.js";
import { ListingsStage } from "./components/ListingsStage.js";

export function App() {
  const [stage, setStage] = useState<ThresholdStage>("porch");

  const handleJumpToListings = useCallback(() => {
    const el = document.getElementById("listings");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleBackToPorch = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <header
        className={`site-header ${
          stage === "inside" ? "site-header--inside" : ""
        }`}
      >
        <a
          href="#top"
          className="brand-link"
          onClick={(e) => {
            e.preventDefault();
            handleBackToPorch();
          }}
        >
          <span className="brand-mark">
            <DoorArchIcon size={18} />
          </span>
          <span>Westside Doorstep</span>
        </a>

        <div className="header-actions">
          <span className="zip-badge tabular-nums">
            <span className="zip-dot" aria-hidden="true" />
            49504 · Grand Rapids
          </span>
          <button
            type="button"
            className="header-jump-btn"
            onClick={
              stage === "inside" ? handleBackToPorch : handleJumpToListings
            }
          >
            {stage === "inside" ? "Back to porch" : "Skip to listings"}
          </button>
        </div>
      </header>

      <div id="top">
        <DoorThreshold
          onStageChange={setStage}
          onJumpToListings={handleJumpToListings}
        />
        <ListingsStage />
      </div>
    </>
  );
}
