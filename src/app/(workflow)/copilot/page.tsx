"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  action: string;
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

export default function CopilotPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function fetchRecommendations() {
    setError(null);
    setRecommendationsLoading(true);
    try {
      const res = await fetch("/api/copilot/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      } else {
        setError("Failed to load recommendations. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations. Please try again.");
    } finally {
      setRecommendationsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage].slice(-50));
    setQuery("");
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/copilot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.result || "I couldn't process that request. Please try again.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage].slice(-50));
      } else {
        setError("Failed to get response from copilot");
      }
    } catch (err) {
      console.error("Copilot query failed:", err);
      setError("Failed to communicate with copilot");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(recommendation: Recommendation) {
    try {
      setActionLoading(recommendation.id);
      setError(null);
      setSuccessMessage(null);
      const res = await fetch("/api/copilot/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: recommendation.action,
          targetId: recommendation.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(data.requiresApproval 
          ? "Action requires human approval before execution" 
          : "Action executed successfully!");
        fetchRecommendations();
      } else {
        setError("Failed to execute action. Please try again.");
      }
    } catch (err) {
      console.error("Failed to execute action:", err);
      setError("Failed to execute action. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const suggestedQueries = [
    "What is our current compliance score?",
    "Show me controls without evidence",
    "What risks need attention?",
    "Summarize our audit readiness",
    "List overdue evidence",
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>AI Compliance Copilot</h1>
        <p className="subtitle">Ask questions and get AI-powered compliance guidance</p>
      </div>

      <div className="copilot-layout">
        <div className="chat-section">
          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                <div className="copilot-avatar">🤖</div>
                <h2>Welcome to Compliance Copilot</h2>
                <p>Ask me anything about your compliance posture, controls, risks, or evidence.</p>
                <div className="suggested-queries">
                  <p>Try asking:</p>
                  <div className="suggestion-chips">
                    {suggestedQueries.map((sq, idx) => (
                      <button
                        key={idx}
                        className="suggestion-chip"
                        onClick={() => {
                          setQuery(sq);
                          document.getElementById("query-input")?.focus();
                        }}
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div className="message-content">
                      <div className="message-text">
                        {escapeHtml(msg.content)}
                      </div>
                      <div className="message-time">
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message assistant">
                    <div className="message-avatar">🤖</div>
                    <div className="message-content">
                      <div className="message-text typing">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            <form className="query-form" onSubmit={handleSubmit}>
              <input
                id="query-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about compliance..."
                disabled={loading}
                className="query-input"
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="send-button"
              >
                {loading ? "..." : "➤"}
              </button>
            </form>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
          </div>
        </div>

        <div className="recommendations-section">
          <h2>AI Recommendations</h2>
          {recommendationsLoading ? (
            <div className="empty-recommendations">
              <p>Loading recommendations...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="empty-recommendations">
              <p>No recommendations at this time.</p>
            </div>
          ) : (
            <div className="recommendations-list">
              {recommendations.map((rec) => (
                <div key={rec.id} className="recommendation-card">
                  <div className="rec-header">
                    <span className={`priority-badge ${rec.priority?.toLowerCase()}`}>
                      {rec.priority}
                    </span>
                    <span className="type-badge">{rec.type}</span>
                  </div>
                  <h3>{rec.title}</h3>
                  <p>{rec.description}</p>
                  <button
                      className="action-button"
                      onClick={() => handleAction(rec)}
                      disabled={actionLoading === rec.id}
                    >
                      {actionLoading === rec.id ? "Executing..." : "Take Action →"}
                    </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .subtitle {
          color: #6b7280;
          margin: 4px 0 0 0;
        }
        .copilot-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .copilot-layout {
            grid-template-columns: 1fr;
          }
        }
        .chat-section {
          display: flex;
          flex-direction: column;
        }
        .chat-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          height: 500px;
          display: flex;
          flex-direction: column;
        }
        .welcome-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        .copilot-avatar {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .welcome-screen h2 {
          margin: 0 0 8px 0;
          color: #111827;
        }
        .welcome-screen p {
          color: #6b7280;
          margin: 0 0 24px 0;
        }
        .suggested-queries p {
          color: #9ca3af;
          font-size: 14px;
          margin: 0 0 12px 0;
        }
        .suggestion-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .suggestion-chip {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }
        .suggestion-chip:hover {
          background: #e0f2fe;
          border-color: #0f7f8a;
          color: #0f7f8a;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .message {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }
        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .message-avatar {
          font-size: 24px;
          flex-shrink: 0;
        }
        .message-content {
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 12px;
        }
        .message.user .message-content {
          background: #0f7f8a;
          color: white;
        }
        .message-text {
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .message-time {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .message.user .message-time {
          color: rgba(255,255,255,0.7);
        }
        .typing {
          display: flex;
          gap: 4px;
        }
        .dot {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        .query-form {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .query-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .query-input:focus {
          border-color: #0f7f8a;
        }
        .send-button {
          padding: 12px 20px;
          background: #0f7f8a;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .send-button:hover:not(:disabled) {
          background: #0d6b73;
        }
        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-message {
          padding: 8px 16px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 14px;
        }
        .success-message {
          padding: 8px 16px;
          background: #d1fae5;
          color: #065f46;
          font-size: 14px;
        }
        .recommendations-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }
        .recommendations-section h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #111827;
        }
        .empty-recommendations {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
        }
        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .recommendation-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .rec-header {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .priority-badge, .type-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .priority-badge.high { background: #fee2e2; color: #991b1b; }
        .priority-badge.medium { background: #fef3c7; color: #92400e; }
        .priority-badge.low { background: #d1fae5; color: #065f46; }
        .type-badge {
          background: #e0f2fe;
          color: #0369a1;
        }
        .recommendation-card h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #111827;
        }
        .recommendation-card p {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 12px 0;
        }
        .action-button {
          width: 100%;
          padding: 8px;
          background: white;
          border: 1px solid #0f7f8a;
          color: #0f7f8a;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-button:hover {
          background: #0f7f8a;
          color: white;
        }
      `}</style>
    </div>
  );
}
