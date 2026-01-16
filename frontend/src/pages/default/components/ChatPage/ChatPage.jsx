import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ChatPage.scss";
import ApiService, {
  startConversation,
} from "../../../../services/Api.service";
import { getVariable } from "../../../../utils/localStorage";
import { apiBaseUrl } from "../../../../constants/constant";
import { PulseLoader } from "react-spinners";

const ChatPage = () => {
  let [searchParams] = useSearchParams();

  const [messages, setMessages] = useState([
    {
      question: "",
      Ai_response: "Hello! Welcome to SkitSmith Chat. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const namespace_id = searchParams.get("namespace_id");
    
    // Validate namespace_id
    if (!namespace_id) {
      alert("No chatbot selected. Please select a chatbot first.");
      return;
    }
    
    setLoading(true);
 
    setMessages((prev) => [...prev, { question: input, Ai_response: "" }]);

    try {
      // Only send the last 6 messages to reduce payload size for faster responses
      const recentMessages = messages.slice(-6);
      
      let payload = {
        question: input,
        namespace_id: namespace_id,
        chatHistory: recentMessages,
      };
      setInput("");

      await startConversation(payload, (chunk) => {
        const chunkText =
          typeof chunk === "string"
            ? chunk
            : chunk?.text ??
              chunk?.Ai_response ??
              chunk?.data ??
              JSON.stringify(chunk);

        setMessages((prev) => {
          const lastIdx = prev.length - 1;

          if (lastIdx < 0) return prev;

          const updated = [...prev];
          const last = { ...updated[lastIdx] };

          if (last.question === "") {
            last.Ai_response = (last.Ai_response || "") + chunkText;
            updated[lastIdx] = last;

            return updated;
          }

          return [...prev, { question: "", Ai_response: chunkText }];
        });
      });
    } catch (err) {
      console.error("Streaming error:", err);
      console.error("Error details:", err.message);
      console.error("Error stack:", err.stack);
      setMessages((prev) => [
        ...prev,
        { question: "", Ai_response: `⚠️ Error receiving response: ${err.message || "Unknown error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    const lastBot = [...messages].reverse().find((m) => m.Ai_response && m.Ai_response.trim());
    if (!lastBot) return;
    const token = getVariable("km_user_token");
    const payload = { text: lastBot.Ai_response, title: "SkitSmith_Skit" };

    try {
      const res = await fetch(`${apiBaseUrl}chat-bot/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("PDF generation failed", res.statusText);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${payload.title || "skit"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  const formatResponse = (text) => {
    return text
      .replace(/For More Reference:/g, "\n\nFor More Reference:\n")
      .replace(/•/g, "\n•")
      .replace(/\. /g, ".\n")
      .replace(/- /g, "\n -")
      .trim();
  };

  return (
    <div className="chat-page container-fluid" style={{ padding: "1.5rem 0" }}>
      <div className="row justify-content-center">
        <div className="col-lg-9 col-md-10">
          <div className="card chat-card">
            <div className="chat-header px-4 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0" style={{ color: "#ececec", fontSize: "1.25rem" }}>
                SkitSmith Chat
              </h5>
              <div className="d-flex gap-2">
                <Button
                  className="rounded-pill px-4"
                  style={{
                    background: "#6c757d",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.background = "#5a6268")}
                  onMouseLeave={(e) => !loading && (e.target.style.background = "#6c757d")}
                  onClick={() => navigate("/default/bot-list")}
                  disabled={loading}
                >
                  ← Back to Chatbots
                </Button>
                <Button
                  className="rounded-pill px-4"
                  style={{
                    background: "#10a37f",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.background = "#0e9670")}
                  onMouseLeave={(e) => !loading && (e.target.style.background = "#10a37f")}
                  onClick={handleDownloadPdf}
                  disabled={loading}
                >
                  ⤓ PDF
                </Button>
              </div>
            </div>

            <div className="chat-body">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-row ${
                    msg.question ? "text-end" : "text-start"
                  }`}
                >
                  <div
                    className={`message-bubble ${
                      msg.question ? "user-msg" : "bot-msg"
                    }`}
                  >
                    {msg.question && (
                      <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                        {msg.question}
                      </div>
                    )}

                    {msg.Ai_response && (
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.6",
                        }}
                      >
                        {formatResponse(msg.Ai_response)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-row text-start">
                  <div className="message-bubble bot-msg" style={{ padding: "0.75rem 1.25rem" }}>
                    <PulseLoader
                      color="#10a37f"
                      size={8}
                      margin={3}
                      speedMultiplier={0.7}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input">
              <form className="d-flex gap-2">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="form-control rounded-pill px-3"
                  style={{ fontSize: "0.95rem" }}
                />
                <button
                  className="btn rounded-pill px-4"
                  style={{
                    background: "#10a37f",
                    border: "none",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.background = "#0e9670")}
                  onMouseLeave={(e) => !loading && (e.target.style.background = "#10a37f")}
                  onClick={handleSend}
                  disabled={loading}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
