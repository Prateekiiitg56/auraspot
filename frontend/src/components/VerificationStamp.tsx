import React from "react";

interface VerificationStampProps {
  size?: "sm" | "md" | "lg";
  rotation?: number;
  label?: string;
  date?: string;
}

const VerificationStamp: React.FC<VerificationStampProps> = ({
  size = "md",
  rotation = -6,
  label = "AURASPOT · VERIFIED",
  date = "2026 AUDIT"
}) => {
  const dimension = size === "sm" ? 72 : size === "lg" ? 110 : 88;
  const fontSize = size === "sm" ? 8 : size === "lg" ? 12 : 9.5;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: `${dimension}px`,
        height: `${dimension}px`,
        borderRadius: "50%",
        border: "2px stroke var(--stamp-red)",
        outline: "2px dashed var(--stamp-red)",
        outlineOffset: "-6px",
        color: "var(--stamp-red)",
        transform: `rotate(${rotation}deg)`,
        padding: "6px",
        textAlign: "center",
        userSelect: "none",
        opacity: 0.92,
        mixBlendMode: "multiply",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        letterSpacing: "0.06em",
        boxShadow: "inset 0 0 0 1px rgba(156, 43, 43, 0.15)"
      }}
      title="AuraSpot Property & Owner Verification Audit Stamp"
    >
      <div style={{ fontSize: `${fontSize}px`, textTransform: "uppercase", lineHeight: "1.15" }}>
        {label}
      </div>
      <div style={{
        width: "60%",
        height: "1px",
        background: "var(--stamp-red)",
        margin: "3px 0"
      }} />
      <div style={{ fontSize: `${fontSize - 1.5}px`, textTransform: "uppercase", opacity: 0.85 }}>
        {date}
      </div>
    </div>
  );
};

export default VerificationStamp;
