import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { palettes } from "./terminal/palettes";

const FULL_DURATION = 2500;
const REDUCED_DURATION = 320;
const EXIT_START = 2150;
const SKIP_DELAY = 500;

const bootSteps = [
  { at: 0, label: "Calibrating interface", code: "INT", progress: 8 },
  { at: 500, label: "Indexing portfolio archive", code: "IDX", progress: 31 },
  { at: 1000, label: "Linking experience matrix", code: "LNK", progress: 58 },
  { at: 1500, label: "Arming sandbox terminal", code: "SBX", progress: 82 },
  { at: 2050, label: "Portfolio online", code: "RDY", progress: 100 },
];

function BootCore() {
  return (
    <svg
      className="system-boot-core"
      viewBox="0 0 520 520"
      aria-hidden="true"
      focusable="false"
    >
      <g className="boot-orbits">
        <circle cx="260" cy="260" r="218" pathLength="1" />
        <circle cx="260" cy="260" r="174" pathLength="1" />
      </g>
      <g className="boot-core-frames">
        <rect x="139" y="139" width="242" height="242" rx="22" />
        <rect x="139" y="139" width="242" height="242" rx="22" />
        <rect x="139" y="139" width="242" height="242" rx="22" />
      </g>
      <g className="boot-crosshair">
        <path d="M260 18v92M260 410v92M18 260h92M410 260h92" />
        <circle cx="260" cy="260" r="5" />
      </g>
      <path
        className="boot-signal-mark"
        pathLength="1"
        d="M206 322 260 188l54 134M224 278h72"
      />
    </svg>
  );
}

export default function SystemBoot({ mode, palette, onComplete }) {
  const [reducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [step, setStep] = useState(reducedMotion ? bootSteps.length - 1 : 0);
  const [skippable, setSkippable] = useState(false);
  const [exiting, setExiting] = useState(false);
  const finished = useRef(false);
  const safePalette = palettes.some(({ id }) => id === palette)
    ? palette
    : "bone";
  const signal = palettes.find(({ id }) => id === safePalette).color;
  const current = bootSteps[step];

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const timers = [];
    const handleKeyDown = (event) => {
      if (event.key === "Escape") finish();
    };

    document.body.classList.add("boot-active");
    window.addEventListener("keydown", handleKeyDown);

    if (reducedMotion) {
      timers.push(window.setTimeout(finish, REDUCED_DURATION));
    } else {
      bootSteps.slice(1).forEach(({ at }, index) => {
        timers.push(window.setTimeout(() => setStep(index + 1), at));
      });
      timers.push(window.setTimeout(() => setSkippable(true), SKIP_DELAY));
      timers.push(window.setTimeout(() => setExiting(true), EXIT_START));
      timers.push(window.setTimeout(finish, FULL_DURATION));
    }

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("boot-active");
    };
  }, [finish, reducedMotion]);

  return (
    <div
      className={`system-boot ${exiting ? "is-exiting" : ""} ${
        reducedMotion ? "reduced-motion" : ""
      } palette-${safePalette}`}
      data-mode={mode}
      data-phase={current.code}
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-boot-title"
      style={{ "--boot-signal": mode === "terminal" ? signal : undefined }}
    >
      <div className="system-boot-panel system-boot-panel-left" />
      <div className="system-boot-panel system-boot-panel-right" />
      <div className="system-boot-grid" aria-hidden="true" />

      <div className="system-boot-frame">
        <header className="boot-header" aria-hidden="true">
          <span>ASHIQE // SYSTEM FORGE</span>
          <span>ENTRY_{mode.toUpperCase()}</span>
        </header>

        <div className="boot-stage">
          <div className="boot-coordinate boot-coordinate-left" aria-hidden="true">
            11.1271° N<br />78.6569° E
          </div>
          <div className="boot-coordinate boot-coordinate-right" aria-hidden="true">
            BUILD 02.06<br />SIGNAL STABLE
          </div>

          <BootCore />
          <div className="boot-identity" aria-hidden="true">
            <span className="boot-kicker">ENGINEERING WHAT&apos;S NEXT</span>
            <span className="boot-wordmark">ASHIQE<span>.</span></span>
            <span className="boot-online">PORTFOLIO // ONLINE</span>
          </div>
        </div>

        <footer className="boot-footer">
          <div className="boot-diagnostics" aria-hidden="true">
            {bootSteps.map((item, index) => (
              <span
                className={index < step ? "complete" : index === step ? "active" : ""}
                key={item.code}
              >
                <i>{item.code}</i> {item.label}
              </span>
            ))}
          </div>
          <div className="boot-readout" aria-hidden="true">
            <div className="boot-progress">
              <span style={{ "--boot-progress": `${current.progress}%` }} />
            </div>
            <span>{String(current.progress).padStart(3, "0")}%</span>
          </div>
        </footer>
      </div>

      <p id="system-boot-title" className="sr-only">
        Ashiqe system introduction
      </p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {current.label}
      </p>
      {skippable && (
        <button className="boot-skip" type="button" onClick={finish}>
          Skip intro <span aria-hidden="true">↗</span>
        </button>
      )}
    </div>
  );
}

SystemBoot.propTypes = {
  mode: PropTypes.oneOf(["visual", "terminal"]).isRequired,
  palette: PropTypes.oneOf(palettes.map(({ id }) => id)).isRequired,
  onComplete: PropTypes.func.isRequired,
};
