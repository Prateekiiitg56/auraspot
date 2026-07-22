import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../services/firebase";
import { API } from "../services/api";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  receiver: {
    _id: string;
    name: string;
    email: string;
  };
  property?: {
    _id: string;
    title: string;
    location?: string;
    city?: string;
    area?: string;
    price: number;
    image?: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
}

interface ChatThread {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messageCount: number;
}

const QUICK_PROMPTS = [
  "Is this property available for move-in next month?",
  "Can I schedule an in-person visit this weekend?",
  "What is the security deposit & maintenance cost?"
];

const Chat: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserEmail, setOtherUserEmail] = useState("");
  const [propertyInfo, setPropertyInfo] = useState<any>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserEmail = auth.currentUser?.email || "";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    const userParam = searchParams.get("user") || searchParams.get("with");
    if (userParam) {
      setSelectedThread(userParam);
      setOtherUserEmail(userParam);
    }

    if (propertyId) {
      fetch(`${API}/properties/${propertyId}`)
        .then((res) => res.json())
        .then((data) => setPropertyInfo(data))
        .catch((err) => console.error("Failed to load property", err));
    }
  }, [propertyId, searchParams, navigate]);

  // Load threads & messages
  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchThreadsAndMessages = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();

        // Fetch thread list
        const threadsRes = await fetch(`${API}/messages/threads?email=${encodeURIComponent(currentUserEmail)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (threadsRes.ok) {
          const threadData = await threadsRes.json();
          setThreads(threadData);
        }

        // Fetch active messages if thread selected
        if (otherUserEmail) {
          let url = `${API}/messages/conversation?user1=${encodeURIComponent(currentUserEmail)}&user2=${encodeURIComponent(otherUserEmail)}`;
          if (propertyId) url += `&propertyId=${propertyId}`;

          const msgRes = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreadsAndMessages();
    const interval = setInterval(fetchThreadsAndMessages, 4000);
    return () => clearInterval(interval);
  }, [currentUserEmail, otherUserEmail, propertyId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !otherUserEmail || sending) return;

    setSending(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const payload: any = {
        senderEmail: currentUserEmail,
        receiverEmail: otherUserEmail,
        message: newMessage.trim()
      };

      if (propertyId) payload.propertyId = propertyId;

      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages((prev) => [...prev, sentMsg]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="wrap" style={{ padding: "32px 24px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "20px",
        height: "calc(100vh - 170px)",
        minHeight: "560px"
      }}>
        {/* Left Sidebar: Threads List */}
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", fontWeight: 650, fontSize: "16px" }}>
            Direct Inquiries
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {threads.length === 0 ? (
              <div style={{ padding: "24px 16px", textTransform: "none", fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center" }}>
                No active conversations yet.
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = selectedThread === thread.user.email;
                return (
                  <div
                    key={thread.user.email}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      background: isActive ? "var(--color-primary-bg)" : "transparent",
                      border: isActive ? "1px solid var(--color-primary-border)" : "1px solid transparent",
                      cursor: "pointer",
                      marginBottom: "4px"
                    }}
                    onClick={() => {
                      setSelectedThread(thread.user.email);
                      setOtherUserEmail(thread.user.email);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: isActive ? "var(--color-primary)" : "var(--color-text-main)" }}>
                        {thread.user.name || thread.user.email.split("@")[0]}
                      </span>
                      <span className="mono" style={{ fontSize: "10.5px", color: "var(--color-text-caption)" }}>
                        {thread.lastMessageTime ? new Date(thread.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {thread.lastMessage}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Pane */}
        <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* 1. Header with Property Context & Landlord Verification */}
          <div className="chat-property-header">
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border)",
                flex: "none"
              }}>
                <img
                  src={propertyInfo?.images?.[0] || propertyInfo?.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80"}
                  alt="Property context"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 650, fontSize: "15px", color: "var(--color-text-main)" }}>
                  {propertyInfo?.title || "Direct Property Inquiry"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span>📍 {propertyInfo?.area || "Guwahati"}</span>
                  <span>·</span>
                  <span className="mono" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                    ₹{(propertyInfo?.price || 18500).toLocaleString()}/mo
                  </span>
                  <span>·</span>
                  <span className="tag tag-green" style={{ fontSize: "10px", padding: "2px 6px" }}>
                    ✓ Landlord Verified
                  </span>
                </div>
              </div>
            </div>

            {propertyId && (
              <button
                className="btn btn-outline"
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => navigate(`/property/${propertyId}`)}
              >
                View Listing →
              </button>
            )}
          </div>

          {/* 2. Chat Message Stream */}
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", gap: "10px" }}>
                <div className="ai-loading-spinner" style={{ width: "20px", height: "20px" }} />
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading message thread...</span>
              </div>
            ) : messages.length === 0 ? (
              /* 3. Designed Empty State with Quick Prompt Chips */
              <div className="chat-empty-state">
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
                <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>Direct Message Landlord</h3>
                <p style={{ fontSize: "14px", color: "var(--color-text-muted)", maxWidth: "420px", margin: "0 0 24px" }}>
                  Ask about lease terms, schedule an in-person tour, or clarify deposit details directly with the verified owner.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "460px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-caption)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>
                    Quick Inquiry Prompts
                  </div>
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="prompt-chip"
                      onClick={() => setNewMessage(prompt)}
                      style={{ textAlign: "left" }}
                    >
                      " {prompt} "
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isSent = msg.sender.email === currentUserEmail;
                const senderInitial = (msg.sender.name || msg.sender.email)[0].toUpperCase();
                const formattedTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:42 AM";

                return (
                  <div key={msg._id} className={`chat-message-row ${isSent ? "sent" : "received"}`}>
                    <div className="chat-avatar">{senderInitial}</div>
                    <div className="chat-bubble">
                      <div>{msg.message}</div>
                      <div className="chat-meta-bar">
                        <span>{formattedTime}</span>
                        {isSent && <span style={{ color: msg.read ? "#818cf8" : "inherit" }}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 4. Input Area with Toolbar Affordances */}
          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <button type="button" className="chat-attach-btn" title="Attach Document / Image">
              📎
            </button>
            <button type="button" className="chat-attach-btn" title="Add Emoji">
              😊
            </button>

            <input
              type="text"
              placeholder="Type your message to the owner..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1 }}
            />

            <button
              type="submit"
              className="btn btn-solid"
              disabled={!newMessage.trim() || sending}
              style={{ opacity: !newMessage.trim() ? 0.6 : 1 }}
            >
              {sending ? "Sending..." : "Send ➔"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
