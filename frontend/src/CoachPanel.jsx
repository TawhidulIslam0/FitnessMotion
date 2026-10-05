import { useState } from "react";

export default function CoachPanel({ formFeedback, isAnalyzing }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setReply('');

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setReply(data.response || data.error || 'No response received.');
    } catch (error) {
      setReply('Could not connect to Flask backend.');
    }

    setLoading(false);
  };

  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>AI COACH</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask the coach something..."
        rows={5}
        style={styles.textarea}
      />

      <button onClick={sendMessage} disabled={loading} style={styles.button}>
        {loading ? "Thinking..." : "Send"}
      </button>

      <div style={styles.replyBox}>
        <p style={styles.replyLabel}>
          {isAnalyzing ? "⏳ ANALYZING FORM..." : formFeedback ? "FORM ANALYSIS" : "RESPONSE"}
        </p>
        <p style={{ ...styles.replyText, color: formFeedback && !isAnalyzing ? "#4caf50" : "#ddd" }}>
          {isAnalyzing
            ? "Analyzing your form, please wait..."
            : formFeedback || reply || "Your coach response will appear here."}
        </p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 8,
    padding: "16px 20px",
    height: "100%",
    boxSizing: "border-box",
  },
  cardLabel: {
    color: "#444",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 700,
    marginBottom: 12,
    marginTop: 0,
    fontFamily: "'Courier New', monospace",
  },
  textarea: {
    width: "100%",
    background: "#0a0a0a",
    color: "white",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "12px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "'Courier New', monospace",
    marginBottom: 12,
  },
  button: {
    width: "100%",
    padding: "12px 20px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    borderRadius: 6,
    cursor: "pointer",
    background: "#1a1e3a",
    color: "#00e5ff",
    border: "1px solid #00e5ff",
    fontFamily: "'Courier New', monospace",
    marginBottom: 16,
  },
  replyBox: {
    background: "#0a0a0a",
    border: "1px solid #222",
    borderRadius: 6,
    padding: "12px",
    minHeight: 140,
  },
  replyLabel: {
    color: "#444",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 10,
    fontFamily: "'Courier New', monospace",
  },
  replyText: {
    color: "#ddd",
    margin: 0,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    fontFamily: "'Courier New', monospace",
  },
};