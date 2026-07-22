import React, { useState, useEffect, useRef } from "react";
import { API } from "../services/api";

interface AIScoreBadgeProps {
  score: number | null;
  size?: "small" | "medium" | "large";
}

export const AIScoreBadge: React.FC<AIScoreBadgeProps> = ({ score, size = "medium" }) => {
  if (score === null || score === undefined) return null;

  const sizes = {
    small: { outer: 60, inner: 46, numSize: 14, lblSize: 8 },
    medium: { outer: 84, inner: 64, numSize: 19, lblSize: 9 },
    large: { outer: 110, inner: 86, numSize: 25, lblSize: 10 }
  };

  const { outer, inner, numSize, lblSize } = sizes[size];
  const angle = Math.min(360, Math.max(0, score * 3.6));

  return (
    <div className="score-ring" style={{
      width: outer,
      height: outer,
      background: `conic-gradient(var(--violet) 0deg ${angle}deg, var(--line) ${angle}deg 360deg)`
    }}>
      <div className="score-ring-inner" style={{ width: inner, height: inner }}>
        <span className="num mono" style={{ fontSize: numSize }}>{score}</span>
        <span className="lbl" style={{ fontSize: lblSize }}>Aura Score</span>
      </div>
    </div>
  );
};

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 20, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;
    
    setDisplayedText("");
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </span>
  );
};

interface AIInsightsPanelProps {
  propertyId: string;
  onLoad?: (insights: any) => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ propertyId, onLoad }) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/ai/score/${propertyId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch");
      }
      const data = await res.json();
      if (data.score || data.summary) {
        setInsights(data);
        onLoad?.(data);
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (err: any) {
      console.error("AI Insights error:", err);
      setError(err.message || "Unable to load AI insights");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [propertyId]);

  const handleRetry = () => {
    setRetrying(true);
    fetchInsights();
  };

  if (loading) {
    return (
      <div className="glass" style={{
        borderRadius: "16px",
        padding: "32px 20px",
        textAlign: "center"
      }}>
        <div className="ai-loading-spinner" style={{ margin: "0 auto 16px" }} />
        <p style={{ color: "var(--ink)", margin: "0 0 8px 0", fontWeight: "600" }}>🤖 AI Analyzing Property...</p>
        <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "13px" }}>This may take a few seconds</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="glass" style={{
        borderRadius: "16px",
        padding: "24px 20px",
        textAlign: "center"
      }}>
        <p style={{ fontSize: "32px", margin: "0 0 12px 0" }}>🤖</p>
        <p style={{ color: "var(--ink)", margin: "0 0 8px 0", fontWeight: "600" }}>AI Analysis Unavailable</p>
        <p style={{ color: "var(--ink-soft)", margin: "0 0 16px 0", fontSize: "13px" }}>
          {error || "Could not generate insights for this property"}
        </p>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="btn btn-solid"
        >
          {retrying ? "Retrying..." : "🔄 Try Again"}
        </button>
      </div>
    );
  }

  return (
    <div className="glass" style={{
      borderRadius: "18px",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🤖</span>
          <span style={{ color: "var(--ink)", fontWeight: "600" }} className="serif">AI Property Analysis</span>
          {insights.cached && (
            <span className="mono" style={{
              fontSize: "10px",
              background: "rgba(148, 163, 184, 0.2)",
              color: "var(--ink-soft)",
              padding: "2px 6px",
              borderRadius: "4px"
            }}>
              Cached
            </span>
          )}
        </div>
        <AIScoreBadge score={insights.score} size="medium" />
      </div>

      {/* Summary */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <p style={{ color: "var(--ink-soft)", margin: 0, lineHeight: "1.6", fontSize: "14px" }}>
          <TypewriterText text={insights.summary || "Analysis complete."} speed={15} />
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="insight-grid" style={{ padding: "16px 20px 8px", marginBottom: 0 }}>
        <div className="insight-box">
          <div className="l">Price Rating</div>
          <div className="v">{insights.priceRating || "N/A"}</div>
        </div>
        <div className="insight-box">
          <div className="l">Location Quality</div>
          <div className="v">{insights.locationQuality || "N/A"}</div>
        </div>
        <div className="insight-box">
          <div className="l">Fraud Risk</div>
          <div className="v">{insights.fraudRisk || "LOW"}</div>
        </div>
        <div className="insight-box">
          <div className="l">Aura Score</div>
          <div className="v">{insights.score || "N/A"} / 100</div>
        </div>
      </div>

      {/* Highlights & Concerns */}
      {(insights.highlights?.length > 0 || insights.concerns?.length > 0) && (
        <div style={{ padding: "12px 20px 20px" }}>
          {insights.highlights?.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <p style={{ color: "var(--ink-soft)", fontSize: "11px", margin: "0 0 8px 0" }} className="mono">HIGHLIGHTS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {insights.highlights.map((h: string, i: number) => (
                  <span key={i} className="tag tag-green">
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          )}
          {insights.concerns?.length > 0 && (
            <div>
              <p style={{ color: "var(--ink-soft)", fontSize: "11px", margin: "0 0 8px 0" }} className="mono">CONCERNS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {insights.concerns.map((c: string, i: number) => (
                  <span key={i} className="tag tag-amber">
                    ⚠ {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface FraudRiskBadgeProps {
  propertyId: string;
}

export const FraudRiskBadge: React.FC<FraudRiskBadgeProps> = ({ propertyId }) => {
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await fetch(`${API}/ai/fraud-check/${propertyId}`);
        if (res.ok) {
          const data = await res.json();
          setRisk(data);
        }
      } catch (err) {
        console.error("Fraud check error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, [propertyId]);

  if (loading || !risk) return null;

  const isLow = risk.riskLevel === "LOW";

  return (
    <div
      className={`tag ${isLow ? "tag-green" : "tag-amber"} mono`}
      style={{
        padding: "8px 14px",
        fontSize: "12px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px"
      }}
    >
      <span>{isLow ? "✓" : "⚠"}</span>
      <span>Fraud Risk: {risk.riskLevel}</span>
      {risk.verified && <span style={{ marginLeft: "4px", fontWeight: 700 }}>• Verified</span>}
    </div>
  );
};

interface AIChatBoxProps {
  propertyId: string;
  propertyTitle?: string;
}

// Helper function to format AI response text
const formatAIResponse = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Remove <think>...</think> tags
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  
  // Split into paragraphs
  const paragraphs = cleaned.split(/\n\n+/);
  
  return paragraphs.map((para, idx) => {
    // Handle bullet points
    if (para.includes("- ") || para.includes("• ")) {
      const lines = para.split("\n").filter(l => l.trim());
      return (
        <div key={idx} style={{ marginBottom: "12px" }}>
          {lines.map((line, i) => {
            const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");
            const content = line.replace(/^[-•]\s*/, "").trim();
            
            // Handle bold text **text**
            const formattedContent = content.split(/\*\*(.*?)\*\*/g).map((part, j) => 
              j % 2 === 1 ? <strong key={j} style={{ color: "var(--violet)" }}>{part}</strong> : part
            );
            
            return (
              <div key={i} style={{ 
                paddingLeft: isBullet ? "16px" : "0",
                marginBottom: "6px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px"
              }}>
                {isBullet && <span style={{ color: "var(--violet)" }}>•</span>}
                <span>{formattedContent}</span>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Handle numbered lists
    if (/^\d+\./.test(para.trim())) {
      const lines = para.split("\n").filter(l => l.trim());
      return (
        <div key={idx} style={{ marginBottom: "12px" }}>
          {lines.map((line, i) => {
            const match = line.match(/^(\d+)\.\s*(.*)/);
            if (match) {
              const content = match[2].split(/\*\*(.*?)\*\*/g).map((part, j) => 
                j % 2 === 1 ? <strong key={j} style={{ color: "var(--violet)" }}>{part}</strong> : part
              );
              return (
                <div key={i} style={{ 
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px"
                }}>
                  <span style={{ color: "var(--violet)", fontWeight: "600", minWidth: "20px" }}>{match[1]}.</span>
                  <span>{content}</span>
                </div>
              );
            }
            return <div key={i}>{line}</div>;
          })}
        </div>
      );
    }
    
    // Handle headers with emoji
    if (para.startsWith("**") && para.includes("**:")) {
      const headerMatch = para.match(/\*\*(.*?)\*\*:\s*(.*)/s);
      if (headerMatch) {
        return (
          <div key={idx} style={{ marginBottom: "12px" }}>
            <div style={{ 
              color: "var(--violet)", 
              fontWeight: "600", 
              marginBottom: "6px",
              fontSize: "15px"
            }}>
              {headerMatch[1]}
            </div>
            <div>{headerMatch[2]}</div>
          </div>
        );
      }
    }
    
    // Regular paragraph with bold handling
    const formattedPara = para.split(/\*\*(.*?)\*\*/g).map((part, j) => 
      j % 2 === 1 ? <strong key={j} style={{ color: "var(--violet)" }}>{part}</strong> : part
    );
    
    return <p key={idx} style={{ marginBottom: "12px" }}>{formattedPara}</p>;
  });
};

export const AIChatBox: React.FC<AIChatBoxProps> = ({ propertyId }) => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/ai/chat/${propertyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          chatHistory: messages
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process your question." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass" style={{
      borderRadius: "18px",
      overflow: "hidden"
    }}>
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <span style={{ fontSize: "18px" }}>💬</span>
        <span style={{ color: "var(--ink)", fontWeight: "600", fontSize: "15px" }} className="serif">Ask AI about this property</span>
      </div>

      {/* Messages */}
      <div style={{
        height: "280px",
        overflowY: "auto",
        padding: "16px"
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <p style={{ fontSize: "32px", marginBottom: "12px" }}>🤖</p>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "12px" }}>
              Ask anything about this property
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              {["Is this a good deal?", "What's nearby?", "Is the price fair?"].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="btn btn-outline mono"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "16px",
              textAlign: msg.role === "user" ? "right" : "left"
            }}
          >
            {msg.role === "assistant" && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                marginBottom: "6px" 
              }}>
                <span style={{ fontSize: "14px" }}>🤖</span>
                <span style={{ color: "var(--ink-soft)", fontSize: "11px" }} className="mono">AI Assistant</span>
              </div>
            )}
            <div style={{
              display: "inline-block",
              maxWidth: msg.role === "user" ? "80%" : "95%",
              padding: msg.role === "user" ? "10px 16px" : "14px 16px",
              borderRadius: "14px",
              background: msg.role === "user"
                ? "linear-gradient(180deg, #6C60F0, var(--violet) 55%, var(--violet-deep))"
                : "var(--glass-strong)",
              color: msg.role === "user" ? "#fff" : "var(--ink)",
              fontSize: "14px",
              lineHeight: "1.6",
              textAlign: "left",
              boxShadow: msg.role === "user" ? "0 4px 14px rgba(91,79,224,0.3)" : "none"
            }}>
              {msg.role === "user" ? msg.content : formatAIResponse(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "left" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              marginBottom: "6px" 
            }}>
              <span style={{ fontSize: "14px" }}>🤖</span>
              <span style={{ color: "var(--ink-soft)", fontSize: "11px" }} className="mono">AI Assistant</span>
            </div>
            <div className="glass" style={{
              display: "inline-block",
              padding: "12px 16px",
              borderRadius: "12px",
              color: "var(--ink)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="ai-loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
                <span>Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--line)",
        display: "flex",
        gap: "10px"
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Is this a good deal? What's nearby?"
          disabled={loading}
          className="glass"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "10px",
            color: "var(--ink)",
            fontSize: "14px",
            outline: "none"
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn btn-solid"
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
};

// CSS for animations (add to App.css or use styled-components)
export const AIComponentStyles = `
  .typing-cursor {
    animation: blink 0.8s infinite;
    color: #a5b4fc;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .ai-loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(102, 126, 234, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .typing-dots::after {
    content: '';
    animation: dots 1.5s infinite;
  }
  
  @keyframes dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60%, 100% { content: '...'; }
  }
`;
