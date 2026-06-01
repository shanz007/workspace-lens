import { useState } from "react";
import { supabase } from "../../lib/supabase";

interface Props {
  onLogin: (id: string) => void;
  onBack: () => void;
}

// sanitise input — strip anything that could be harmful
const sanitiseId = (raw: string): string => {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "") // only alphanumeric, dash, underscore
    .slice(0, 20); // max 20 chars
};

const isValidId = (id: string): boolean =>
  /^[A-Z0-9][A-Z0-9_-]{1,19}$/.test(id);

export default function Login({ onLogin, onBack }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"new" | "returning">("new");

  const handleSubmit = async () => {
    const id = sanitiseId(value);

    if (!id) {
      setError("Please enter a participant ID");
      return;
    }

    if (!isValidId(id)) {
      setError("ID must be 2–20 characters, letters and numbers only");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // check if ID already exists
      const { data: existing, error: checkError } = await supabase
        .from("participants")
        .select("participant_id, active")
        .eq("participant_id", id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (mode === "new") {
        if (existing) {
          setError(
            'This ID is already taken — please choose a different one, or switch to "Returning participant"',
          );
          setLoading(false);
          return;
        }

        // create new entry
        const { error: insertError } = await supabase
          .from("participants")
          .insert({
            participant_id: id,
            active: true,
            self_registered: true,
          });

        if (insertError) throw insertError;

        console.log("✅ New participant registered:", id);
      } else {
        // returning — just check it exists and is active
        if (!existing) {
          setError(
            'ID not found. Have you participated before? If you are new, switch to "New participant"',
          );
          setLoading(false);
          return;
        }
        if (!existing.active) {
          setError("This participant ID is no longer active.");
          setLoading(false);
          return;
        }

        console.log("✅ Returning participant:", id);
      }

      // cache for offline use
      const cached = JSON.parse(localStorage.getItem("validatedIds") || "[]");
      if (!cached.includes(id)) {
        localStorage.setItem("validatedIds", JSON.stringify([...cached, id]));
      }

      localStorage.setItem("participantId", id);
      onLogin(id);
    } catch (err) {
      const e = err as Error;
      // offline fallback
      const cached = JSON.parse(localStorage.getItem("validatedIds") || "[]");
      if (cached.includes(id)) {
        localStorage.setItem("participantId", id);
        onLogin(id);
        return;
      }
      setError(
        `Connection error — please check your internet and try again. (${e.message})`,
      );
    } finally {
      setLoading(false);
    }
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
      {/* navbar */}
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
        {/* icon */}
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
          {mode === "new" ? "Create your ID" : "Welcome back"}
        </h1>
        <p
          style={{
            color: "#aab4be",
            fontSize: "14px",
            textAlign: "center",
            margin: "0 0 1.5rem",
            maxWidth: "300px",
            lineHeight: 1.6,
          }}
        >
          {mode === "new"
            ? "Choose a unique participant ID — you'll use this every time you submit a photo."
            : "Enter your existing participant ID to continue."}
        </p>

        {/* mode toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "3px",
            marginBottom: "1.5rem",
            width: "100%",
            maxWidth: "380px",
          }}
        >
          {(["new", "returning"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: "8px",
                border: "none",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#1a2e1a" : "rgba(255,255,255,0.7)",
                fontWeight: mode === m ? 700 : 400,
                cursor: "pointer",
                fontSize: "13px",
                transition: "all 0.2s",
              }}
            >
              {m === "new" ? "🆕 New participant" : "↩ Returning"}
            </button>
          ))}
        </div>

        {/* card */}
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
            {mode === "new" ? "CHOOSE A PARTICIPANT ID" : "YOUR PARTICIPANT ID"}
          </label>

          <input
            type="text"
            placeholder={
              mode === "new" ? "e.g. OUTDOOR42 or JANE2025" : "e.g. OUTDOOR42"
            }
            value={value}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => {
              setValue(sanitiseId(e.target.value));
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
              boxSizing: "border-box" as const,
              fontFamily: "monospace",
              color: "#1a2e1a",
              background: "#f9f9f9",
              textTransform: "uppercase",
            }}
          />

          {/* live sanitised preview */}
          {value && (
            <p style={{ fontSize: "11px", color: "#888", margin: "0 0 8px" }}>
              Will be stored as:{" "}
              <strong style={{ fontFamily: "monospace", color: "#1a2e1a" }}>
                {value}
              </strong>
            </p>
          )}

          {error && (
            <div
              style={{
                background: "#fff0f0",
                border: "1.5px solid #e53e3e",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#c0392b",
                marginBottom: "12px",
                display: "flex",
                gap: "6px",
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* rules */}
          {!error && (
            <p
              style={{
                fontSize: "11px",
                color: "#aaa",
                margin: "0 0 16px",
                lineHeight: 1.6,
              }}
            >
              {mode === "new"
                ? "Letters and numbers only, 2–20 characters. Choose something memorable — you'll need it again."
                : "Enter exactly the ID you used when you first signed up."}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !value}
            style={{
              width: "100%",
              padding: "15px",
              background: loading || !value ? "#ccc" : "#1a2e1a",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loading || !value ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading
              ? mode === "new"
                ? "Creating ID..."
                : "Checking..."
              : mode === "new"
                ? "Create & Continue →"
                : "Continue →"}
          </button>
        </div>

        {/* trust strip */}
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
                style={{ fontSize: "11px", color: "#5a6a7a", marginTop: "3px" }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
