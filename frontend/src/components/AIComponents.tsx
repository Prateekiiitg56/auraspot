import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, ShieldAlert, RefreshCw, Send, ThumbsUp, AlertTriangle } from "lucide-react";
import { apiFetch, apiJson, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";

type Insights = {
  available?: boolean;
  score?: number;
  priceRating?: string;
  locationQuality?: string;
  highlights?: string[];
  concerns?: string[];
  summary?: string;
};

type Fraud = { available?: boolean; riskLevel?: "LOW" | "MEDIUM" | "HIGH"; riskScore?: number; flags?: string[] };

const LABEL: Record<string, string> = {
  EXCELLENT: "Great price",
  GOOD: "Good price",
  FAIR: "Fair price",
  ABOVE_AVERAGE: "Above market",
  OVERPRICED: "Overpriced",
  VERY_OVERPRICED: "Well above market",
  SUSPICIOUS: "Unusually low",
  PRIME: "Prime",
  AVERAGE: "Average",
  DEVELOPING: "Developing"
};
const pretty = (v?: string) => (v ? LABEL[v] || v.charAt(0) + v.slice(1).toLowerCase() : "—");

/** Renders the small subset of markdown the assistant uses: paragraphs, bullet lists and **bold**. */
const renderMarkdown = (text: string): ReactNode =>
  text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n").filter((l) => l.trim());
    const bold = (s: string) => s.split(/\*\*(.*?)\*\*/g).map((part, j) => (j % 2 ? <strong key={j}>{part}</strong> : part));
    if (lines.length && lines.every((l) => /^\s*([-•*]|\d+\.)\s+/.test(l))) {
      return (
        <ul key={i}>
          {lines.map((l, j) => <li key={j}>{bold(l.replace(/^\s*([-•*]|\d+\.)\s+/, ""))}</li>)}
        </ul>
      );
    }
    return <p key={i}>{bold(lines.join(" "))}</p>;
  });

const scoreTone = (score: number) => (score >= 75 ? "var(--verified)" : score >= 55 ? "var(--flag)" : "var(--brick)");

export const AIInsightsPanel = ({ propertyId }: { propertyId: string }) => {
  const [data, setData] = useState<Insights | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await apiFetch(`/ai/score/${propertyId}`);
      const json: Insights = res.ok ? await res.json() : { available: false };
      if (json.available === false || !json.score) throw new Error();
      setData(json);
      setState("ready");
    } catch {
      setState("unavailable");
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="paper-card ai-panel" aria-labelledby="ai-title" aria-busy={state === "loading"}>
      <div className="section-title-row">
        <h2 id="ai-title" className="inline-icon"><Sparkles size={18} aria-hidden="true" /> AI analysis</h2>
        {state === "ready" && data?.score && (
          <span className="ai-score mono" style={{ color: scoreTone(data.score) }}>{data.score}<small>/100</small></span>
        )}
      </div>

      {state === "loading" && (
        <div className="stack" style={{ gap: 8, marginTop: 12 }}>
          <div className="skeleton" style={{ height: 14 }} />
          <div className="skeleton" style={{ height: 14, width: "85%" }} />
          <div className="skeleton" style={{ height: 64, marginTop: 8 }} />
        </div>
      )}

      {state === "unavailable" && (
        <div className="ai-unavailable">
          <p className="muted">AI analysis isn’t available for this listing right now.</p>
          <button className="btn btn-outline btn-sm" onClick={load}>
            <RefreshCw size={14} aria-hidden="true" /> Try again
          </button>
        </div>
      )}

      {state === "ready" && data && (
        <>
          {data.summary && <p className="ai-summary">{data.summary}</p>}
          <div className="insight-grid">
            <div className="insight-box"><div className="l">Price</div><div className="v">{pretty(data.priceRating)}</div></div>
            <div className="insight-box"><div className="l">Location</div><div className="v">{pretty(data.locationQuality)}</div></div>
          </div>
          {!!data.highlights?.length && (
            <ul className="ai-points good">
              {data.highlights.map((h) => <li key={h}><ThumbsUp size={14} aria-hidden="true" /> {h}</li>)}
            </ul>
          )}
          {!!data.concerns?.length && (
            <ul className="ai-points bad">
              {data.concerns.map((c) => <li key={c}><AlertTriangle size={14} aria-hidden="true" /> {c}</li>)}
            </ul>
          )}
          <p className="ai-disclaimer">AI-generated estimate. Always visit and verify before paying.</p>
        </>
      )}
    </section>
  );
};

export const FraudRiskBadge = ({ propertyId }: { propertyId: string }) => {
  const [data, setData] = useState<Fraud | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/ai/fraud-check/${propertyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: Fraud | null) => !cancelled && setData(json && json.available !== false && json.riskLevel ? json : null))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (!data?.riskLevel) return null;
  const low = data.riskLevel === "LOW";
  const Icon = low ? ShieldCheck : ShieldAlert;
  return (
    <div className={`fraud-badge ${low ? "status-ok" : data.riskLevel === "HIGH" ? "status-danger" : "status-warn"}`}>
      <div className="inline-icon">
        <Icon size={16} aria-hidden="true" />
        <strong>{low ? "Low fraud risk" : data.riskLevel === "HIGH" ? "High fraud risk" : "Review carefully"}</strong>
      </div>
      {!low && !!data.flags?.length && (
        <ul>
          {data.flags.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}
    </div>
  );
};

const SUGGESTIONS = ["Is the price fair for this area?", "What should I check during a visit?", "Any red flags in this listing?"];

export const AIChatBox = ({ propertyId }: { propertyId: string }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
  }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setError("");
    setInput("");
    const history = messages;
    setMessages([...history, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await apiJson(`/ai/chat/${propertyId}`, "POST", { question: q, chatHistory: history });
      if (!res.ok) throw new Error(await readError(res, "The assistant is unavailable right now."));
      const { response } = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: response || "Sorry, I don’t have an answer for that." }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant is unavailable right now.");
      setMessages(history);
      setInput(q);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <section className="paper-card ai-chat" aria-labelledby="ai-chat-title">
      <h2 id="ai-chat-title" className="inline-icon"><Sparkles size={18} aria-hidden="true" /> Ask about this home</h2>
      {!user ? (
        <p className="muted">
          <Link to="/login" className="text-link">Sign in</Link> to ask the AI assistant about price, location and red flags.
        </p>
      ) : (
        <>
          <div className="ai-chat-stream" ref={streamRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="prompt-list">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="prompt-chip" onClick={() => ask(s)}>{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
              </div>
            ))}
            {loading && <div className="ai-msg assistant muted">Thinking…</div>}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <form className="comment-form" onSubmit={onSubmit}>
            <label htmlFor="ai-q" className="visually-hidden">Your question</label>
            <input id="ai-q" type="text" maxLength={500} placeholder="Ask a question…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" className="btn btn-solid" disabled={loading || !input.trim()} aria-label="Ask">
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </>
      )}
    </section>
  );
};
