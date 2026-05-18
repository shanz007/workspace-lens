import { supabase } from "../../lib/supabase";
import { useState } from "react";

interface Props {
  onLogin: (id: string) => void;
  onBack: () => void;
}

export default function Login({ onLogin, onBack }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = value.trim().toUpperCase();

    if (!trimmed) {
      setError("Please enter your participant ID");
      return;
    }

    setLoading(true);
    setError("");

    // check if already validated previously — allow offline login
    const cachedIds = JSON.parse(localStorage.getItem("validatedIds") || "[]");
    if (cachedIds.includes(trimmed)) {
      localStorage.setItem("participantId", trimmed);
      setLoading(false);
      onLogin(trimmed);
      return;
    }

    try {
      // validate against Supabase participants table
      const { data, error: dbError } = await supabase
        .from("participants")
        .select("participant_id, active")
        .eq("participant_id", trimmed)
        .single();

      setLoading(false);

      if (dbError || !data) {
        setError(
          "ID not recognised. Please check your invitation email and try again.",
        );
        setLoading(false);
        return;
      }

      if (!data.active) {
        setError(
          "This participant ID is no longer active. Please contact the research team.",
        );
        setLoading(false);
        return;
      }

      //cache the validated ID for offline use
      const updated = [...cachedIds, trimmed];
      localStorage.setItem("validatedIds", JSON.stringify(updated));
    } catch {
      // network unavailable — check if we've seen this ID before
      if (cachedIds.includes(trimmed)) {
        localStorage.setItem("participantId", trimmed);
        setLoading(false);
        onLogin(trimmed);
        return;
      }
      setError(
        "No internet connection. Please connect to validate your ID for the first time.",
      );
      setLoading(false);
      return;
    }

    localStorage.setItem("participantId", trimmed);
    setLoading(false);
    onLogin(trimmed);
  };

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1a2e1a 0%, #0f3460 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── NAVBAR ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          height: "56px",
          background: "rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "17px", color: "#fff" }}>
          🌿 WorkspaceLens
        </span>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "#fff",
            padding: "7px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </nav>

      {/* ── MAIN CARD ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            background: "rgba(246,201,14,0.15)",
            border: "2px solid rgba(246,201,14,0.4)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            marginBottom: "1.25rem",
          }}
        >
          🔑
        </div>

        <h1
          style={{
            color: "#fff",
            fontSize: "1.5rem",
            fontWeight: 800,
            margin: "0 0 0.5rem",
            textAlign: "center",
          }}
        >
          Participant Login
        </h1>
        <p
          style={{
            color: "#aab4be",
            fontSize: "14px",
            textAlign: "center",
            margin: "0 0 2rem",
            maxWidth: "280px",
            lineHeight: 1.6,
          }}
        >
          Enter the participant ID sent to you by the research team in your
          invitation email.
        </p>

        {/* Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            background: "#fff",
            borderRadius: "16px",
            padding: "1.75rem 1.5rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#555",
              letterSpacing: "0.05em",
              marginBottom: "8px",
            }}
          >
            PARTICIPANT ID
          </label>

          <input
            type="text"
            placeholder="e.g. P007"
            value={value}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              borderRadius: "10px",
              border: error ? "2px solid #e53e3e" : "2px solid #e0e0e0",
              outline: "none",
              marginBottom: "8px",
              boxSizing: "border-box",
              fontFamily: "monospace",
              color: "#1a1a2e",
              background: "#f9f9f9",
              textTransform: "uppercase",
            }}
          />

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#e53e3e",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              <span>⚠</span> {error}
            </div>
          )}

          {!error && (
            <p
              style={{
                fontSize: "12px",
                color: "#aaa",
                margin: "0 0 16px",
                lineHeight: 1.5,
              }}
            >
              Your ID is 2–10 characters, e.g. <strong>P007</strong> or{" "}
              <strong>PART12</strong>. Check your invitation email if unsure.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: loading ? "#555" : "#1a2e1a",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Checking..." : "Continue →"}
          </button>
        </div>

        {/* Info strip */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
          }}
        >
          {[
            { icon: "🔒", label: "Secure" },
            { icon: "👤", label: "Anonymous" },
            { icon: "🔬", label: "Research only" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px" }}>{item.icon}</div>
              <div
                style={{ fontSize: "11px", color: "#7a8a9a", marginTop: "3px" }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "12px",
            color: "#5a6a7a",
            textAlign: "center",
            maxWidth: "280px",
            lineHeight: 1.6,
          }}
        >
          Don't have an ID? You need an invitation from the research team to
          participate.
        </p>
      </div>
    </div>
  );
}
