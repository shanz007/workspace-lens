import { useState } from "react";

interface Props {
  participantId: string;
  onCapture: (blob: Blob) => void;
  onLogout: () => void;
}

// ── Image compression ─────────────────────────────────────────────────────────
const compressImage = (file: File | Blob): Promise<Blob> =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      // max 1280px on longest side — good for vision analysis, small enough for APIs
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      // 80% JPEG quality — typically 200–500 KB for outdoor photos
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
    };
    img.src = url;
  });

export default function Camera({ participantId, onCapture, onLogout }: Props) {
  const [showLogout, setShowLogout] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    console.log(`📷 Original size: ${(file.size / 1024).toFixed(0)} KB`);

    const compressed = await compressImage(file);
    console.log(
      `📷 Compressed size: ${(compressed.size / 1024).toFixed(0)} KB`,
    );

    setCompressing(false);
    onCapture(compressed);
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
          position: "relative",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "17px", color: "#fff" }}>
          🌿 WorkspaceLens
        </span>

        <button
          onClick={() => setShowLogout((o) => !o)}
          style={{
            background: "rgba(246,201,14,0.2)",
            border: "1px solid rgba(246,201,14,0.4)",
            color: "#f6c90e",
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "monospace",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {participantId} ▾
        </button>
      </nav>

      {/* ── LOGOUT DROPDOWN ── */}
      {showLogout && (
        <div
          style={{
            position: "fixed",
            top: "56px",
            right: "1.25rem",
            zIndex: 999,
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            overflow: "hidden",
            minWidth: "200px",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #eee",
              background: "#f9f9f9",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "#999",
                letterSpacing: "0.05em",
              }}
            >
              LOGGED IN AS
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "16px",
                color: "#1a2e1a",
              }}
            >
              {participantId}
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("participantId");
              onLogout();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "14px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "#e53e3e",
              fontWeight: 500,
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "16px" }}>🚪</span>
            Log out
          </button>

          <button
            onClick={() => setShowLogout(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "14px 16px",
              background: "none",
              border: "none",
              borderTop: "1px solid #eee",
              cursor: "pointer",
              fontSize: "14px",
              color: "#888",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "16px" }}>✕</span>
            Cancel
          </button>
        </div>
      )}

      {/* Backdrop */}
      {showLogout && (
        <div
          onClick={() => setShowLogout(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            background: "transparent",
          }}
        />
      )}

      {/* ── MAIN CONTENT ── */}
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
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "rgba(168,224,99,0.15)",
            border: "2px solid rgba(168,224,99,0.35)",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            marginBottom: "1.25rem",
          }}
        >
          {compressing ? "⏳" : "👁️"}
        </div>

        <h1
          style={{
            color: "#fff",
            fontSize: "1.4rem",
            fontWeight: 800,
            margin: "0 0 0.75rem",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {compressing ? "Processing photo..." : "Capture Your View"}
        </h1>

        {/* Key instruction */}
        {!compressing && (
          <div
            style={{
              background: "rgba(168,224,99,0.12)",
              border: "1.5px solid rgba(168,224,99,0.3)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              marginBottom: "2rem",
              maxWidth: "340px",
              width: "100%",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#a8e063",
                lineHeight: 1.7,
                textAlign: "center",
              }}
            >
              Point your camera in the{" "}
              <strong>direction you are looking</strong> while working — capture
              your <strong>view and surroundings</strong>, not your desk or
              laptop.
            </p>
          </div>
        )}

        {/* Compressing indicator */}
        {compressing && (
          <div
            style={{
              background: "rgba(168,224,99,0.12)",
              border: "1.5px solid rgba(168,224,99,0.3)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              marginBottom: "2rem",
              maxWidth: "340px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#a8e063",
                lineHeight: 1.7,
              }}
            >
              Optimising photo for upload...
            </p>
          </div>
        )}

        {/* Camera button */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            width: "100%",
            maxWidth: "340px",
            padding: "20px",
            background: compressing ? "rgba(246,201,14,0.4)" : "#f6c90e",
            color: "#1a2e1a",
            borderRadius: "16px",
            cursor: compressing ? "not-allowed" : "pointer",
            fontSize: "18px",
            fontWeight: 700,
            boxShadow: "0 6px 24px rgba(246,201,14,0.4)",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            marginBottom: "1.5rem",
            transition: "background 0.2s",
          }}
        >
          {compressing ? "⏳ Processing..." : "📷 Take Photo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            disabled={compressing}
            style={{ display: "none" }}
          />
        </label>

        {/* Info strip */}
        {!compressing && (
          <div
            style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}
          >
            {[
              { icon: "🔒", label: "Secure upload" },
              { icon: "👤", label: "Anonymous" },
              { icon: "✏️", label: "Edit before send" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "16px" }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#5a6a7a",
                    marginTop: "3px",
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
