import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { API } from "../services/api";
import "../App.css";

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
  property: {
    _id: string;
    title: string;
    location: string;
    price: number;
  };
  message: string;
  read: boolean;
  createdAt: string;
}

const Chat: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserEmail, setOtherUserEmail] = useState("");
  const [propertyInfo, setPropertyInfo] = useState<any>(null);
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
    loadPropertyAndMessages();
    // Mark messages as read when opening chat
    markAsRead();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [propertyId]);

  const loadPropertyAndMessages = async () => {
    try {
      // Load property details to determine other user
      const propRes = await fetch(`${API}/properties/${propertyId}`);
      if (!propRes.ok) {
        throw new Error(`Failed to load property: ${propRes.status}`);
      }
      const propData = await propRes.json();
      console.log("Property data loaded:", propData);
      setPropertyInfo(propData);
      
      // First, try to load existing messages to see if there's a conversation
      const messagesRes = await fetch(`${API}/chat/property/${propertyId}?userEmail=${encodeURIComponent(currentUserEmail)}`);
      const existingMessages = await messagesRes.json();
      
      // Determine other user:
      // 1. If there are existing messages, get the other person from the conversation
      // 2. If I'm owner and property is assigned, chat with assignedTo user
      // 3. If I'm not owner, chat with owner
      const isOwner = propData.owner?.email === currentUserEmail;
      let otherUser = "";
      
      if (Array.isArray(existingMessages) && existingMessages.length > 0) {
        // Get other user from existing messages
        const firstMsg = existingMessages[0];
        otherUser = firstMsg.sender.email === currentUserEmail 
          ? firstMsg.receiver.email 
          : firstMsg.sender.email;
        console.log("Found other user from messages:", otherUser);
      } else if (isOwner) {
        // Owner can chat with assignedTo user (if exists)
        otherUser = propData.assignedTo?.email || "";
        console.log("Owner chatting with assignedTo:", otherUser);
      } else {
        // Non-owner always chats with property owner
        otherUser = propData.owner?.email || "";
        console.log("User chatting with owner:", otherUser);
      }
      
      console.log("Other user email:", otherUser);
      setOtherUserEmail(otherUser);
      
      // Set messages if we already loaded them
      if (Array.isArray(existingMessages)) {
        setMessages(existingMessages);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to load property:", error);
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API}/chat/property/${propertyId}?userEmail=${encodeURIComponent(currentUserEmail)}`);
      const data = await response.json();
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`${API}/chat/read/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: currentUserEmail })
      });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserEmail) {
      alert("No one to chat with yet");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          senderEmail: currentUserEmail,
          receiverEmail: otherUserEmail,
          message: newMessage.trim()
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
      }
      
      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);

    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading chat...
      </div>
    );
  }

  // If no property loaded
  if (!propertyInfo) {
    return (
      <div className="page">
        <div style={{ 
          maxWidth: "600px",
          margin: "60px auto",
          padding: "40px",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(45, 55, 72, 0.8) 100%)",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          borderRadius: "16px",
          textAlign: "center",
          backdropFilter: "blur(8px)"
        }}>
          <h2 style={{ color: "#cbd5e1", marginBottom: "16px" }}>🔍 Property Not Found</h2>
          <p style={{ color: "#94a3b8", marginBottom: "28px", lineHeight: "1.6" }}>
            The property you're trying to chat about could not be found. It may have been removed.
          </p>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              padding: "12px 28px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease"
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // If owner and no one to chat with yet
  if (!otherUserEmail) {
    return (
      <div className="page">
        <div style={{ 
          maxWidth: "600px",
          margin: "60px auto",
          padding: "40px",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(45, 55, 72, 0.8) 100%)",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          borderRadius: "16px",
          textAlign: "center",
          backdropFilter: "blur(8px)"
        }}>
          <h2 style={{ color: "#cbd5e1", marginBottom: "16px" }}>💬 No Active Chat</h2>
          <p style={{ color: "#94a3b8", marginBottom: "28px", lineHeight: "1.6" }}>
            No one has requested this property yet. Once someone sends a request, you'll be able to chat with them here.
          </p>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              padding: "12px 28px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease"
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: "0" }}>
      <div style={{ 
        maxWidth: "800px",
        margin: "20px auto",
        height: "calc(100vh - 140px)",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(45, 55, 72, 0.8) 100%)",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        borderRadius: "16px",
        backdropFilter: "blur(8px)",
        overflow: "hidden"
      }}>
        {/* Chat Header */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid rgba(102, 126, 234, 0.2)",
          background: "linear-gradient(135deg, rgba(20, 30, 48, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: "0 0 5px 0", color: "#f1f5f9", fontSize: "18px" }}>
                {propertyInfo?.title}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
                📍 {propertyInfo?.city} • 💰 ₹{propertyInfo?.price.toLocaleString()}
              </p>
            </div>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                padding: "8px 16px",
                background: "rgba(102, 126, 234, 0.2)",
                color: "#667eea",
                border: "1px solid rgba(102, 126, 234, 0.3)",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              textAlign: "center"
            }}>
              <div>
                <p style={{ fontSize: "18px", marginBottom: "8px" }}>💬 No messages yet</p>
                <p style={{ fontSize: "14px", color: "#64748b" }}>Start a conversation with this user!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                style={{
                  display: "flex",
                  justifyContent: msg.sender.email === currentUserEmail ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: msg.sender.email === currentUserEmail 
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "rgba(71, 85, 105, 0.5)",
                    color: msg.sender.email === currentUserEmail ? "#f1f5f9" : "#cbd5e1",
                    border: msg.sender.email === currentUserEmail 
                      ? "1px solid rgba(102, 126, 234, 0.4)"
                      : "1px solid rgba(71, 85, 105, 0.4)",
                    wordWrap: "break-word"
                  }}
                >
                  <p style={{ margin: "0 0 6px 0", lineHeight: "1.4" }}>{msg.message}</p>
                  <small style={{ 
                    fontSize: "11px", 
                    opacity: msg.sender.email === currentUserEmail ? 0.8 : 0.6,
                    color: msg.sender.email === currentUserEmail ? "#f1f5f9" : "#94a3b8"
                  }}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </small>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form 
          onSubmit={sendMessage}
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(102, 126, 234, 0.2)",
            background: "linear-gradient(135deg, rgba(20, 30, 48, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
            display: "flex",
            gap: "12px"
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              color: "#f1f5f9",
              outline: "none",
              transition: "all 0.3s ease",
              fontSize: "14px"
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "#667eea";
              (e.target as HTMLInputElement).style.boxShadow = "0 0 12px rgba(102, 126, 234, 0.3)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "rgba(102, 126, 234, 0.3)";
              (e.target as HTMLInputElement).style.boxShadow = "none";
            }}
            disabled={sending || !otherUserEmail}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !otherUserEmail}
            style={{
              padding: "12px 28px",
              background: sending || !newMessage.trim() 
                ? "rgba(102, 126, 234, 0.3)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#f1f5f9",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease"
            }}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
