import React from "react";

interface FactorAnnotation {
  label: string;
  weight: string;
  note: string;
  status: "verified" | "flag" | "brick";
}

interface SurveyGradeProps {
  score: number;
  gradeLabel?: string;
  factors?: FactorAnnotation[];
  compact?: boolean;
}

const DEFAULT_FACTORS: FactorAnnotation[] = [
  { label: "Price Variance", weight: "25%", note: "Within 2.4% of neighborhood registry avg", status: "verified" },
  { label: "Owner Credibility", weight: "15%", note: "Govt ID & Land Title Deed matched", status: "verified" },
  { label: "Location Risk", weight: "25%", note: "Low flood risk zone · High transit connectivity", status: "verified" },
  { label: "Demand Index", weight: "15%", note: "14 verified inquiries this week", status: "flag" },
  { label: "Amenity Audit", weight: "20%", note: "On-site verified: Power backup & parking", status: "verified" }
];

const SurveyGrade: React.FC<SurveyGradeProps> = ({
  score = 87,
  gradeLabel = "GRADE A — LOW RISK",
  factors = DEFAULT_FACTORS,
  compact = false
}) => {
  return (
    <div className="survey-grade-container" style={{
      background: "var(--paper-subtle)",
      borderLeft: "3px solid var(--blueprint)",
      padding: compact ? "12px 14px" : "18px 20px",
      borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
      fontFamily: "var(--font-sans)"
    }}>
      {/* Header: Serif Grade Number + Inspector Note Title */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: compact ? "8px" : "12px" }}>
        <span
          className="mono"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: compact ? "26px" : "34px",
            fontWeight: 700,
            color: "var(--blueprint)",
            lineHeight: 1
          }}
        >
          {score}
        </span>
        <div>
          <div style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: compact ? "13px" : "15px",
            fontWeight: 600,
            color: "var(--ink)"
          }}>
            Survey Grade & Inspection Note
          </div>
          <div className="mono" style={{ fontSize: "11px", color: "var(--verified)", fontWeight: 600 }}>
            {gradeLabel}
          </div>
        </div>
      </div>

      {/* Margin-Note Inspector Annotations Breakdown */}
      {!compact && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          borderTop: "1px dashed var(--paper-line)",
          paddingTop: "12px",
          marginTop: "6px"
        }}>
          {factors.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px" }}>
              <span className="mono" style={{
                color: f.status === "verified" ? "var(--verified)" : f.status === "brick" ? "var(--brick)" : "var(--flag)",
                fontWeight: 600,
                flex: "none",
                minWidth: "32px"
              }}>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveyGrade;
