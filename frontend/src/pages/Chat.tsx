import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Send, ExternalLink } from "lucide-react";
import { apiFetch, apiJson, formatINR, getPropertyImage, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Feedback";

type Person = { _id: string; name: string; email: string };
type PropertySummary = {
  _id: string;
  title: string;
  city?: string;
  area?: string;
  price: number;
  images?: string[];
  image?: string;
  owner?: Person | string;
};
type Message = {
  _id: string;
  sender: Person;
  receiver: Person;
  message: string;
  read: boolean;
  createdAt: string;
};
type Conversation = {
  property: PropertySummary;
  user: Person;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageMine: boolean;
  unreadCount: number;
};

const QUICK_PROMPTS = [
  "Is this property still available?",
  "Can I schedule a visit this weekend?",
  "What is the security deposit and maintenance cost?"
];

const POLL_MS = 5000;

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
};

const ownerOf = (p?: PropertySummary | null): Person | null =>
  p?.owner && typeof p.owner === "object" ? p.owner : null;

/**
 * Unified inbox. /messages lists every conversation; /chat/:propertyId?with=email opens one.
 * Tenants opening /chat/:propertyId without ?with= talk to the listing owner.
 */
const Chat = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const myEmail = user?.email || "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [property, setProperty] = useState<PropertySummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    apiFetch(`/properties/${propertyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setProperty(data))
      .catch(() => !cancelled && setProperty(null));
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const owner = ownerOf(property);
  const isOwner = !!owner && !!profile && owner._id === profile._id;
  // Tenants always talk to the owner; owners pick the other person via ?with=
  const otherEmail = searchParams.get("with") || (!isOwner && owner ? owner.email : "");
  const activeConversation = useMemo(
    () => conversations.find((c) => c.property._id === propertyId && c.user.email === otherEmail),
    [conversations, propertyId, otherEmail]
  );
  const otherName = activeConversation?.user.name || (owner?.email === otherEmail ? owner.name : "") || otherEmail;

  const loadInbox = useCallback(async () => {
    try {
      const res = await apiFetch("/chat/inbox");
      if (res.ok) setConversations(await res.json());
    } catch {
      // keep the last known list
    } finally {
      setInboxLoading(false);
    }
  }, []);

  const loadThread = useCallback(async () => {
    if (!propertyId || !otherEmail) return;
    try {
      const res = await apiFetch(`/chat/property/${propertyId}?otherUserEmail=${encodeURIComponent(otherEmail)}`);
      if (!res.ok) return;
      const data: Message[] = await res.json();
      setMessages((prev) => (prev.length === data.length && prev.at(-1)?._id === data.at(-1)?._id ? prev : data));
      if (data.some((m) => !m.read && m.receiver.email === myEmail)) {
        apiJson(`/chat/read/${propertyId}`, "PUT", { otherUserEmail: otherEmail }).catch(() => undefined);
      }
    } catch {
      // transient network error; next poll retries
    }
  }, [propertyId, otherEmail, myEmail]);

  // Load the open thread whenever the selection changes
  useEffect(() => {
    if (!propertyId || !otherEmail) return;
    let cancelled = false;
    const run = async () => {
      setThreadLoading(true);
      setMessages([]);
      await loadThread();
      if (!cancelled) setThreadLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [propertyId, otherEmail, loadThread]);

  // Poll inbox and thread while the tab is visible
  useEffect(() => {
    loadInbox();
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadInbox();
      loadThread();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [loadInbox, loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !propertyId || !otherEmail || sending) return;
    setSending(true);
    try {
      const res = await apiJson("/chat", "POST", { propertyId, receiverEmail: otherEmail, message: text });
      if (!res.ok) throw new Error(await readError(res, "Message not sent"));
      const sent: Message = await res.json();
      setMessages((prev) => [...prev, sent]);
      setDraft("");
      loadInbox();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Message not sent");
    } finally {
      setSending(false);
    }
  };

  const hasThread = !!propertyId && !!otherEmail;
  const ownerWithoutRecipient = !!propertyId && isOwner && !otherEmail;
  const shownProperty = propertyId ? property : null;

  return (
    <div className="wrap page-section">
      <div className={`chat-layout ${propertyId ? "has-thread" : ""}`}>
        <aside className="paper-card chat-inbox" aria-label="Conversations">
          <h1 className="chat-inbox-title">Messages</h1>
          {inboxLoading ? (
            <div className="chat-inbox-list">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 58, margin: 8 }} />)}
            </div>
          ) : conversations.length === 0 ? (
            <p className="chat-inbox-empty">No conversations yet. Message an owner from any listing page.</p>
          ) : (
            <ul className="chat-inbox-list">
              {conversations.map((c) => {
                const active = c.property._id === propertyId && c.user.email === otherEmail;
                return (
                  <li key={`${c.property._id}-${c.user._id}`}>
                    <button
                      className={`chat-thread ${active ? "active" : ""}`}
                      onClick={() => navigate(`/chat/${c.property._id}?with=${encodeURIComponent(c.user.email)}`)}
                      aria-current={active}
                    >
                      <img src={getPropertyImage(c.property)} alt="" />
                      <span className="chat-thread-body">
                        <span className="chat-thread-top">
                          <strong>{c.user.name || c.user.email}</strong>
                          <time className="mono">{timeLabel(c.lastMessageTime)}</time>
                        </span>
                        <span className="chat-thread-property">{c.property.title}</span>
                        <span className={`chat-thread-preview ${c.unreadCount ? "unread" : ""}`}>
                          {c.lastMessageMine ? "You: " : ""}
                          {c.lastMessage}
                        </span>
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="count-badge static" aria-label={`${c.unreadCount} unread`}>{c.unreadCount}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="paper-card chat-pane" aria-label="Conversation">
          {!propertyId ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <MessageSquare size={36} aria-hidden="true" />
              <h3>Select a conversation</h3>
              <p>Choose a conversation on the left, or open a listing and message its owner.</p>
              <Link to="/explore" className="btn btn-outline">Browse listings</Link>
            </div>
          ) : (
            <>
              <header className="chat-property-header">
                <button className="icon-btn chat-back" onClick={() => navigate("/messages")} aria-label="Back to conversations">
                  <ArrowLeft size={18} />
                </button>
                <img src={getPropertyImage(shownProperty)} alt="" className="chat-header-img" />
                <div className="chat-header-text">
                  <strong>{hasThread ? otherName : shownProperty?.title || "Conversation"}</strong>
                  <span className="muted">
                    {shownProperty ? `${shownProperty.title} · ${formatINR(shownProperty.price)}` : "Loading listing…"}
                  </span>
                </div>
                <Link to={`/property/${propertyId}`} className="btn btn-outline btn-sm">
                  View listing <ExternalLink size={14} aria-hidden="true" />
                </Link>
              </header>

              <div className="chat-stream" aria-live="polite">
                {ownerWithoutRecipient ? (
                  <div className="empty-state">
                    <h3>This is your listing</h3>
                    <p>Pick a conversation from the list to reply to an interested renter or buyer.</p>
                  </div>
                ) : threadLoading ? (
                  <div className="page-loader" style={{ minHeight: 200 }}><div className="ai-loading-spinner" /></div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <MessageSquare size={32} aria-hidden="true" />
                    <h3>Start the conversation</h3>
                    <p>Ask about availability, visits or deposit terms.</p>
                    <div className="prompt-list">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button key={prompt} className="prompt-chip" onClick={() => setDraft(prompt)}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender.email === myEmail;
                    return (
                      <div key={m._id} className={`chat-message-row ${mine ? "sent" : "received"}`}>
                        <div className="chat-bubble">
                          <div className="chat-text">{m.message}</div>
                          <div className="chat-meta-bar">
                            <time>{timeLabel(m.createdAt)}</time>
                            {mine && <span>{m.read ? "Seen" : "Sent"}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {hasThread && (
                <form onSubmit={send} className="chat-input-bar">
                  <label htmlFor="chat-input" className="visually-hidden">Message</label>
                  <textarea
                    id="chat-input"
                    rows={1}
                    maxLength={2000}
                    placeholder={`Message ${otherName || "owner"}…`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <button type="submit" className="btn btn-solid" disabled={!draft.trim() || sending} aria-label="Send message">
                    <Send size={16} aria-hidden="true" />
                    <span className="chat-send-label">{sending ? "Sending…" : "Send"}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Chat;
