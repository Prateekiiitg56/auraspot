import React, { useState, useEffect, useRef } from "react";
import VerificationStamp from "./VerificationStamp";

const DEFAULT_FACTORS = [
  { label: "Price Variance", weight: "25%", note: "Within 2.4% of neighborhood registry avg", status: "verified" },
  { label: "Owner Credibility", weight: "15%", note: "Govt ID & Land Title Deed matched", status: "verified" },
  { label: "Location Risk", weight: "25%", note: "Low flood risk zone · High transit connectivity", status: "verified" },
  { label: "Demand Index", weight: "15%", note: "14 verified inquiries this week", status: "flag" },
  { label: "Amenity Audit", weight: "20%", note: "On-site verified: Power backup & parking", status: "verified" }
];

export const PhysicalDraftingTableDemo: React.FC = () => {
  // Parallax Tilt State
  const [tilt, setTilt] = useState({ rotateX: 3, rotateY: -6 });

  // Stamp Thump Animation State
  const [stampThumping, setStampThumping] = useState(true);

  // Odometer Score State
  const [displayedScore, setDisplayedScore] = useState(0);

  // Line-by-line reveal count
  const [visibleLines, setVisibleLines] = useState(0);

  // Check reduced motion preference
  const isReducedMotion = useRef(false);

  useEffect(() => {
    isReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Stamp-down thump trigger
    if (!isReducedMotion.current) {
      const stampTimer = setTimeout(() => {
        setStampThumping(false);
      }, 400);
      return () => clearTimeout(stampTimer);
    } else {
      setStampThumping(false);
    }
  }, []);

  // 2. Mechanical Odometer Count-Up (0 -> 87)
  useEffect(() => {
    if (isReducedMotion.current) {
      setDisplayedScore(87);
      setVisibleLines(DEFAULT_FACTORS.length);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      current += 3;
      if (current >= 87) {
        setDisplayedScore(87);
        clearInterval(interval);
      } else {
        setDisplayedScore(current);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  // 3. Sequential line-by-line staggered reveal
  useEffect(() => {
    if (isReducedMotion.current) return;

    const timer = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= DEFAULT_FACTORS.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  // Parallax mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateY = -6 + (x / (rect.width / 2)) * 6; // Range: -12deg to 0deg
    const rotateX = 3 - (y / (rect.height / 2)) * 5;  // Range: -2deg to 8deg

    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 3, rotateY: -6 });
  };

  const triggerReStamp = () => {
    if (isReducedMotion.current) return;
    setStampThumping(true);
    setTimeout(() => setStampThumping(false), 350);
  };

  return (
    <div
      className="physical-drafting-table-demo"
      style={{
        background: "var(--paper)",
        backgroundImage: `
          linear-gradient(to right, var(--paper-line) 1px, transparent 1px),
          linear-gradient(to bottom, var(--paper-line) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
        padding: "48px 32px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--paper-line)",
        boxShadow: "var(--shadow-paper)",
        margin: "24px 0"
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <span className="mono" style={{ fontSize: "11px", color: "var(--blueprint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Physical Drafting Table Physics Demo
        </span>
        <h2 style={{ fontSize: "24px", margin: "4px 0 6px", fontFamily: "var(--font-serif)" }}>
          Interactive Physical Document & Photo Stack
        </h2>
        <p style={{ fontSize: "14px", color: "var(--ink-soft)", margin: 0 }}>
          Hover over the cards to experience independent parallax depth, ink stamp thump animation, and dossier paper stacking.
        </p>
      </div>

      {/* 3D Scene Perspective Viewport */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: "1600px",
          perspectiveOrigin: "60% 40%",
          padding: "24px 0"
        }}
      >
        {/* Physical 3D Desk Scene Container */}
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "24px",
            alignItems: "start",
            willChange: "transform"
          }}
        >
          {/* Object 1: Physical Photo Card with Stamped Photo & Lifted Corner */}
          <div
            className="photo-card-physical"
            onMouseEnter={triggerReStamp}
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(40px)",
              background: "#FFFFFF",
              padding: "10px 10px 14px 10px",
              borderRadius: "2px",
              boxShadow: `
                0 18px 35px -10px rgba(23, 26, 31, 0.35),
                0 4px 8px -2px rgba(23, 26, 31, 0.15),
                0 0 0 1px rgba(217, 211, 194, 0.6)
              `,
              position: "relative",
              transition: "transform 0.25s ease, box-shadow 0.25s ease"
            }}
          >
            {/* Real Photo with Paper Grain Overlay */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "1px" }}>
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
                alt="Physical Stamped Photo"
                style={{ width: "100%", height: "230px", objectFit: "cover", display: "block" }}
              />
              
              {/* Paper Grain Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle, rgba(23,26,31,0.04) 1px, transparent 1px)",
                  backgroundSize: "6px 6px",
                  pointerEvents: "none"
                }}
              />

              {/* Physical "Stamp-Down" Animated Ink Stamp */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  zIndex: 10,
                  transformStyle: "preserve-3d",
                  transform: stampThumping
                    ? "translateZ(90px) rotate(-16deg) scale(1.35)"
                    : "translateZ(20px) rotate(-6deg) scale(1.0)",
                  opacity: stampThumping ? 0.3 : 0.95,
                  filter: stampThumping
                    ? "drop-shadow(0 24px 20px rgba(156, 43, 43, 0.5))"
                    : "drop-shadow(0 2px 4px rgba(156, 43, 43, 0.3))",
                  transition: stampThumping
                    ? "none"
                    : "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease, filter 0.35s ease"
                }}
              >
                <VerificationStamp size="md" rotation={0} />
              </div>
            </div>

            {/* Photo Caption & Rent Ledger Line */}
            <div style={{ padding: "12px 6px 2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 650, fontFamily: "var(--font-serif)", color: "#171A1F" }}>
                  Riverside Flat 2BHK
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Uzan Bazar, Guwahati</div>
              </div>
              <div className="mono" style={{ fontSize: "16px", fontWeight: 700, color: "var(--blueprint)" }}>
                ₹18,500/mo
              </div>
            </div>

            {/* Curled Bottom-Right Corner Shadow Effect */}
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "4px",
                width: "60px",
                height: "16px",
                background: "transparent",
                boxShadow: "4px 8px 12px rgba(23, 26, 31, 0.35)",
                transform: "rotate(4deg)",
                zIndex: -1
              }}
            />
          </div>

          {/* Object 2: Raised Index Card Dossier with Stacked Paper Edges & Clip */}
          <div
            className="dossier-card-physical"
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(15px)",
              position: "relative"
            }}
          >
            {/* Stacked Paper Edge 2 (Bottom Page Peeking) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--paper-subtle)",
                border: "1px solid var(--paper-line)",
                borderRadius: "var(--radius-sm)",
                transform: "rotate(-2deg) translate(-6px, 6px)",
                boxShadow: "0 2px 6px rgba(23,26,31,0.08)",
                zIndex: 1
              }}
            />

            {/* Stacked Paper Edge 1 (Middle Page Peeking) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--paper-subtle)",
                border: "1px solid var(--paper-line)",
                borderRadius: "var(--radius-sm)",
                transform: "rotate(1.5deg) translate(4px, 3px)",
                boxShadow: "0 2px 6px rgba(23,26,31,0.08)",
                zIndex: 2
              }}
            />

            {/* Main Top Dossier Document */}
            <div
              style={{
                position: "relative",
                zIndex: 3,
                background: "var(--paper-subtle)",
                border: "1px solid var(--paper-line)",
                borderLeft: "4px solid var(--blueprint)",
                borderRadius: "var(--radius-sm)",
                padding: "20px",
                boxShadow: "0 12px 28px -6px rgba(23, 26, 31, 0.25)"
              }}
            >
              {/* Metallic Brass Clip Detail */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "-12px",
                  width: "16px",
                  height: "28px",
                  background: "linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)",
                  borderRadius: "3px",
                  boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
                  border: "1px solid #8B6508",
                  zIndex: 5
                }}
                title="Dossier Document Fastener Clip"
              />

              {/* Odometer Count-Up Score Display */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "14px" }}>
                <span
                  className="mono"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "38px",
                    fontWeight: 700,
                    color: "var(--blueprint)",
                    lineHeight: 1
                  }}
                >
                  {displayedScore}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>
                    Survey Grade & Inspection Note
                  </div>
                  <div className="mono" style={{ fontSize: "11px", color: "var(--verified)", fontWeight: 600 }}>
                    GRADE A · VERIFIED LOW RISK
                  </div>
                </div>
              </div>

              {/* Sequential Line-by-Line Staggered Annotations */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px dashed var(--paper-line)", paddingTop: "12px" }}>
                {DEFAULT_FACTORS.map((f, i) => {
                  const isVisible = i < visibleLines;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontSize: "12.5px",
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(4px)",
                        transition: "opacity 0.25s ease, transform 0.25s ease"
                      }}
                    >
                      <span className="mono" style={{ color: "var(--verified)", fontWeight: 600, flex: "none" }}>
                        [{f.weight}]
                      </span>
                      <div>
                        <span style={{ fontWeight: 600, color: "var(--ink)", marginRight: "6px" }}>
                          {f.label}:
                        </span>
                        <span style={{ fontStyle: "italic", color: "var(--ink-soft)", fontFamily: "var(--font-serif)" }}>
                          "{f.note}"
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embossed Wax-Seal Trust Badges Demo */}
      <div style={{ marginTop: "32px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-soft)", marginRight: "8px" }}>
          Embossed Wax-Seal Badges:
        </span>

        {["🛡️ Owner ID", "📊 Rent Variance", "⚡ 0% Broker Fee"].map((badge, idx) => (
          <div
            key={idx}
            className="mono"
            style={{
              padding: "7px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--paper-subtle)",
              border: "1px solid var(--paper-line)",
              boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.6), inset -1px -1px 2px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.1)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--ink)",
              cursor: "pointer",
              transition: "transform 0.1s ease, box-shadow 0.1s ease",
              userSelect: "none"
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(2px)";
              e.currentTarget.style.boxShadow = "inset 2px 2px 4px rgba(0,0,0,0.25)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "inset 1px 1px 2px rgba(255,255,255,0.6), inset -1px -1px 2px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.1)";
            }}
          >
            {badge}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhysicalDraftingTableDemo;
