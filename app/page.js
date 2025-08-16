"use client";
import { useRef, useState } from "react";
import Brain3D from "../components/Brain3D";

export default function Page() {
  const heroRef = useRef(null);
  const [hemi, setHemi] = useState(null);

  const setHemiAttr = (side) => {
    setHemi(side);
    const el = heroRef.current;
    if (!el) return;
    if (side) el.setAttribute("data-hemi", side);
    else el.removeAttribute("data-hemi");
  };

  return (
    <>
      <header className="site-header">
        <div className="container row">
          <span className="badge">INSIDE MY HEAD</span>
          <nav className="primary-nav" aria-label="Primary">
            <a href="/work">Work</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" ref={heroRef}>
          <h1 className="h1">Dive inside my mind</h1>
          <p className="subhead">Pick a lobe to explore the work.</p>

          <div className="brain-wrap">
            <div className="brain-3d" aria-hidden="false">
              <Brain3D activeSide={hemi} />
            </div>

            {/* Hotspot hit areas (a11y+pointer) */}
            <svg
              className="hotspots"
              viewBox="0 0 1280 800"
              role="group"
              aria-label="Interactive brain hotspots"
            >
              <a
                xlinkHref="/work/amtrak"
                href="/work/amtrak"
                className="spot spot-left top"
                aria-label="Open Amtrak case study"
                onMouseEnter={() => setHemiAttr("left")}
                onFocus={() => setHemiAttr("left")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <title>Amtrak — Break the Travel Quo</title>
                <ellipse cx="410" cy="360" rx="250" ry="170" />
              </a>
              <a
                xlinkHref="/work/parietal-lobe"
                href="/work/parietal-lobe"
                className="spot spot-left bottom"
                aria-label="Open Parietal lobe case study"
                onMouseEnter={() => setHemiAttr("left")}
                onFocus={() => setHemiAttr("left")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <title>Parietal lobe — You Can’t Make This Stuff Up</title>
                <ellipse cx="500" cy="600" rx="280" ry="170" />
              </a>
              <a
                xlinkHref="/work/nestle-waters"
                href="/work/nestle-waters"
                className="spot spot-right top"
                aria-label="Open Nestlé Waters case study"
                onMouseEnter={() => setHemiAttr("right")}
                onFocus={() => setHemiAttr("right")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <title>Nestlé Waters — Greatness Springs from Here</title>
                <ellipse cx="860" cy="360" rx="250" ry="170" />
              </a>
              <a
                xlinkHref="/work/cod-mw3"
                href="/work/cod-mw3"
                className="spot spot-right bottom"
                aria-label="Open Call of Duty MW3 case study"
                onMouseEnter={() => setHemiAttr("right")}
                onFocus={() => setHemiAttr("right")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <title>Call of Duty MW3 — There’s a Soldier in All of Us</title>
                <ellipse cx="950" cy="600" rx="280" ry="170" />
              </a>
            </svg>

            {/* Around-brain labels */}
            <div className="labels">
              <a
                className="label left top"
                href="/work/amtrak"
                onMouseEnter={() => setHemiAttr("left")}
                onFocus={() => setHemiAttr("left")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <span className="label-title">Amtrak</span>
                <span className="label-sub">Break the Travel Quo</span>
              </a>
              <a
                className="label left bottom"
                href="/work/parietal-lobe"
                onMouseEnter={() => setHemiAttr("left")}
                onFocus={() => setHemiAttr("left")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <span className="label-title">Parietal lobe</span>
                <span className="label-sub">You Can’t Make This Stuff Up</span>
              </a>
              <a
                className="label right top"
                href="/work/nestle-waters"
                onMouseEnter={() => setHemiAttr("right")}
                onFocus={() => setHemiAttr("right")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <span className="label-title">Nestlé Waters</span>
                <span className="label-sub">Greatness Springs from Here</span>
              </a>
              <a
                className="label right bottom"
                href="/work/cod-mw3"
                onMouseEnter={() => setHemiAttr("right")}
                onFocus={() => setHemiAttr("right")}
                onMouseLeave={() => setHemiAttr(null)}
                onBlur={() => setHemiAttr(null)}
              >
                <span className="label-title">Call of Duty MW3</span>
                <span className="label-sub">There’s a Soldier in All of Us</span>
              </a>
            </div>
          </div>

          <a className="cta" href="#start" role="button">
            Start here
          </a>
          <p className="foot-hint">
            If you’ve scrolled this far, we should talk.
          </p>
        </section>
      </main>
    </>
  );
}
