import { useState } from "react";

interface Props {
  onGetStarted: () => void;
}

const getIOSInstallStatus = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);

  return { isIOS, isStandalone, isSafari };
};

export default function HomePage({ onGetStarted }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("ios-banner-dismissed") === "true",
  );
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsentWarning, setShowConsentWarning] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "#f8f9fa",
        minHeight: "100vh",
        fontSize: "16px",
      }}
    >
      {(() => {
        const { isIOS, isStandalone, isSafari } = getIOSInstallStatus();

        // already installed — show nothing
        if (isStandalone || dismissed) return null;

        // iOS but not Safari — must switch browser
        if (isIOS && !isSafari)
          return (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 2000,
                background: "#1a2e1a",
                color: "#fff",
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              }}
            >
              <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  Please open this page in Safari
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#a8e063",
                    lineHeight: 1.5,
                  }}
                >
                  On iPhone, the app only works correctly in Safari. Copy this
                  URL and open it in Safari to continue.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem("ios-banner-dismissed", "true");
                  setDismissed(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  fontSize: "18px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          );

        // iOS + Safari but not installed — prompt to add to Home Screen
        if (isIOS && isSafari)
          return (
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2000,
                background: "#1a2e1a",
                color: "#fff",
                padding: "14px 16px 24px",
                borderRadius: "16px 16px 0 0",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "22px", flexShrink: 0 }}>📲</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    Install WorkspaceLens for the best experience
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#a8e063",
                      lineHeight: 1.6,
                    }}
                  >
                    Tap <strong style={{ color: "#f6c90e" }}>Share</strong>{" "}
                    <span style={{ fontSize: "14px" }}>⎋</span> at the bottom of
                    Safari, then tap{" "}
                    <strong style={{ color: "#f6c90e" }}>
                      "Add to Home Screen"
                    </strong>{" "}
                    to install the app.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    localStorage.setItem("ios-banner-dismissed", "true");
                    setDismissed(true);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "#aaa",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Maybe later
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("ios-banner-dismissed", "true");
                    setDismissed(true);
                  }}
                  style={{
                    flex: 2,
                    padding: "10px",
                    background: "#f6c90e",
                    border: "none",
                    borderRadius: "8px",
                    color: "#1a2e1a",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Got it ✓
                </button>
              </div>
            </div>
          );

        return null;
      })()}

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "#1a1a2e",
          padding: "0 1.25rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "17px", color: "#fff" }}>
          🌿 WorkspaceLens
        </span>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: "22px",
                height: "2px",
                background: "#fff",
                borderRadius: "2px",
                transition: "all 0.2s",
                transform:
                  menuOpen && i === 0
                    ? "rotate(45deg) translate(5px, 5px)"
                    : menuOpen && i === 2
                      ? "rotate(-45deg) translate(5px, -5px)"
                      : menuOpen && i === 1
                        ? "scaleX(0)"
                        : "none",
              }}
            />
          ))}
        </button>
      </nav>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "56px",
            left: 0,
            right: 0,
            zIndex: 999,
            background: "#1a1a2e",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "0.5rem 0",
          }}
        >
          {[
            { label: "🏠 Home", id: "home" },
            { label: "🌿 About the Study", id: "about" },
            { label: "📋 Your Task", id: "task" },
            { label: "🛡️ Consent", id: "consent" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                display: "block",
                width: "100%",
                padding: "14px 1.5rem",
                background: "none",
                border: "none",
                color: "#e0e0e0",
                fontSize: "15px",
                textAlign: "left",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {item.label}
            </button>
          ))}
          <div style={{ padding: "12px 1.5rem" }}>
            <button
              onClick={() => {
                scrollTo("consent");
                setMenuOpen(false);
              }}
              style={{
                width: "100%",
                padding: "13px",
                background: "#f6c90e",
                color: "#1a2e1a",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔐 Log in to Participate
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div
        id="home"
        style={{
          marginTop: "56px",
          background: "linear-gradient(160deg, #1a2e1a 0%, #0f3460 100%)",
          color: "#fff",
          padding: "3rem 1.25rem 3.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(134,201,14,0.18)",
            border: "1px solid rgba(134,201,14,0.45)",
            borderRadius: "20px",
            padding: "5px 14px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#a8e063",
            letterSpacing: "0.8px",
            marginBottom: "1.25rem",
          }}
        >
          OUTDOOR KNOWLEDGE WORK RESEARCH · 2026
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 1rem",
            lineHeight: 1.3,
          }}
        >
          Where Do You Work
          <br />
          When You Work Outside?
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#aab4be",
            lineHeight: 1.75,
            margin: "0 auto 1rem",
            maxWidth: "340px",
          }}
        >
          We are studying how people use{" "}
          <strong style={{ color: "#a8e063" }}>
            outdoor and semi-outdoor spaces
          </strong>{" "}
          — parks, terraces, courtyards, café patios — as places of knowledge
          work.
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#7a8a9a",
            lineHeight: 1.75,
            margin: "0 auto 2rem",
            maxWidth: "340px",
          }}
        >
          By sharing a photo of what you see when you look up from your work,
          you help us understand the environments that support outdoor working.
        </p>

        <button
          onClick={() => {
            document
              .getElementById("consent")
              ?.scrollIntoView({ behavior: "smooth" });
            setMenuOpen(false);
          }}
          style={{
            display: "block",
            width: "100%",
            maxWidth: "320px",
            margin: "0 auto 12px",
            padding: "16px",
            background: "#f6c90e",
            color: "#1a2e1a",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(246,201,14,0.35)",
          }}
        >
          🚀 Participate Now
        </button>

        <button
          onClick={() => scrollTo("task")}
          style={{
            display: "block",
            width: "100%",
            maxWidth: "320px",
            margin: "0 auto",
            padding: "14px",
            background: "transparent",
            color: "#fff",
            border: "1.5px solid rgba(255,255,255,0.25)",
            borderRadius: "12px",
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          What is my task?
        </button>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            marginTop: "2.5rem",
            paddingTop: "2rem",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {[
            { value: "~2 min", label: "Per submission" },
            { value: "100%", label: "Anonymous" },
            { value: "🔒", label: "Secure upload" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "18px", fontWeight: 700, color: "#f6c90e" }}
              >
                {s.value}
              </div>
              <div
                style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── YOUR TASK ── */}
      <div id="task" style={{ background: "#fff", padding: "2.5rem 1.25rem" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <h2
            style={{
              color: "#1a1a2e",
              fontSize: "1.25rem",
              margin: "0 0 0.4rem",
            }}
          >
            Your Task
          </h2>
          <p style={{ color: "#999", fontSize: "13px", margin: "0 0 1.5rem" }}>
            Simple — but please read carefully so your photo is useful for the
            research.
          </p>

          {/* Key instruction callout */}
          <div
            style={{
              background: "#f0f9e8",
              border: "2px solid #7dc355",
              borderRadius: "14px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>👁️</div>
            <h3
              style={{ margin: "0 0 8px", color: "#1a2e1a", fontSize: "15px" }}
            >
              Photograph your GAZE — not your desk
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#3a5a2a",
                lineHeight: 1.7,
              }}
            >
              When you are settled in your outdoor or semi-outdoor workspace,
              <strong>
                {" "}
                point your camera in the direction you are looking
              </strong>{" "}
              when you working. Capture the view in front of you.
            </p>
          </div>

          {/* Good examples */}
          <div
            style={{
              background: "#f9f9f9",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
              border: "1px solid #eee",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontWeight: 600,
                fontSize: "13px",
                color: "#1a1a2e",
              }}
            >
              ✅ Good photo subjects
            </p>
            {[
              "A park or garden you are sitting in",
              "A café terrace or outdoor seating area",
              "A courtyard, balcony, or rooftop space",
              "A covered but open semi-outdoor area",
              "Trees, sky, buildings — whatever is in front of you",
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "7px",
                  fontSize: "13px",
                  color: "#444",
                }}
              >
                <span
                  style={{ color: "#2d7d46", fontWeight: 700, flexShrink: 0 }}
                >
                  ✓
                </span>
                {t}
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#fff8f8",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              border: "1px solid #f5c0c0",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontWeight: 600,
                fontSize: "13px",
                color: "#1a1a2e",
              }}
            >
              ❌ Please avoid
            </p>
            {[
              "Photos taken indoors at a office/home desk",
              "Photos of your laptop, keyboard, or documents",
              "Blank or accidental shots",
              "Other people's faces without their consent",
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "7px",
                  fontSize: "13px",
                  color: "#444",
                }}
              >
                <span
                  style={{ color: "#e53e3e", fontWeight: 700, flexShrink: 0 }}
                >
                  ✗
                </span>
                {t}
              </div>
            ))}
          </div>

          {/* Steps */}
          <h3
            style={{ color: "#1a1a2e", fontSize: "14px", margin: "0 0 1rem" }}
          >
            How it works — step by step
          </h3>
          {[
            { icon: "🔑", step: "1", title: "Log in with participant ID." },
            {
              icon: "🌿",
              step: "2",
              title: "Go to your outdoor(or semi) workspace.",
            },
            {
              icon: "👁️",
              step: "3",
              title: "Photograph  the view in front of you.",
            },
            {
              icon: "🛡️",
              step: "4",
              title:
                "Censor anything (or sensitive) content you don't want to include using blur or drawing boxes.",
            },
            {
              icon: "📋",
              step: "5",
              title:
                "Answer a short survey about the location, comfort, and what you can see around you.",
            },
            {
              icon: "☁️",
              step: "6",
              title: "Submmt the photo upon confirming.",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "0.9rem 1rem",
                background: "#f9f9f9",
                borderRadius: "12px",
                border: "1px solid #eee",
                marginBottom: "10px",
                textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "3px",
                  }}
                >
                  <span
                    style={{
                      background: "#f6c90e",
                      color: "#1a1a2e",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "6px",
                    }}
                  >
                    {item.step}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "#1a1a2e",
                    }}
                  >
                    {item.title}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div
        id="about"
        style={{ background: "#f0f4f0", padding: "2.5rem 1.25rem" }}
      >
        <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "left" }}>
          <h2
            style={{
              color: "#1a1a2e",
              fontSize: "1.25rem",
              margin: "0 0 1rem",
            }}
          >
            About the research
          </h2>
          <p
            style={{
              color: "#555",
              fontSize: "14px",
              lineHeight: 1.75,
              margin: "0 0 1rem",
            }}
          >
            This study is conducted by the{" "}
            <strong>CrowdComputing research group</strong>. We are investigating
            how people use{" "}
            <strong>outdoor and semi-outdoor environments</strong>— parks,
            terraces, courtyards, café patios, and covered-but-open spaces — as
            places of knowledge work.
          </p>
          <p
            style={{
              color: "#555",
              fontSize: "14px",
              lineHeight: 1.75,
              margin: "0 0 1.5rem",
            }}
          >
            Your photos will be analysed using computer vision to detect
            environmental elements —{" "}
            <strong>
              natural light, greenery, built structures, shelter, and sky
            </strong>{" "}
            — and combined with your short survey responses to build a picture
            of what outdoor workspaces actually look like in practice.
          </p>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "1.25rem",
              border: "1px solid #ddd",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontWeight: 600,
                fontSize: "13px",
                color: "#1a1a2e",
                textAlign: "center",
              }}
            >
              ✅ What we collect
            </p>
            {[
              "Your gaze-direction photo of the outdoor environment",
              "Survey: location type, thermal comfort, surroundings, activity",
              "Timestamp + Optional GPS (to match with weather and environmental data)",
              "Anonymous participant ID",
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  color: "#444",
                  textAlign: "left",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{ color: "#2d7d46", fontWeight: 700, flexShrink: 0 }}
                >
                  ✓
                </span>
                {t}
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid #eee",
                paddingTop: "1rem",
                marginTop: "0.5rem",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#1a1a2e",
                  textAlign: "center",
                }}
              >
                🚫 What we never collect
              </p>
              {[
                "Your name or contact details",
                "Device identifiers",
                "Any content you have blurred or blacked out",
                "GPS data without your explicit permission",
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "8px",
                    fontSize: "13px",
                    color: "#444",
                    textAlign: "left",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{ color: "#e53e3e", fontWeight: 700, flexShrink: 0 }}
                  >
                    ✗
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONSENT ── */}
      <div
        id="consent"
        style={{ background: "#fff", padding: "2.5rem 1.25rem" }}
      >
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <h2
            style={{
              color: "#1a1a2e",
              fontSize: "1.25rem",
              margin: "0 0 0.4rem",
            }}
          >
            Consent & Responsibility
          </h2>
          <p
            style={{
              color: "#999",
              fontSize: "13px",
              margin: "0 0 1.5rem",
              textAlign: "center",
            }}
          >
            Please read carefully before participating.
          </p>

          {[
            {
              icon: "🛡️",
              title: "Your privacy is your responsibility",
              text: "Review every photo before submitting. Use the black box or blur tools to cover any faces, private documents, screens, or sensitive content visible in your surroundings. Once submitted, photos cannot be deleted by you.",
            },
            {
              icon: "⚠️",
              title: "Outdoor environments include other people",
              text: "When working outdoors, other people may appear in your field of view. Do NOT submit photos with identifiable faces without consent. If in doubt — blur it out. The research team is not responsible for sensitive content you submit without censoring.",
            },
            {
              icon: "🔬",
              title: "Research use only",
              text: "Your photos and survey responses are used solely for academic research into outdoor knowledge work environments. They will not be shared publicly or used commercially. Data will be stored securely and deleted at the end of the project.",
            },
            {
              icon: "🚪",
              title: "Voluntary participation",
              text: "Participation is entirely voluntary. You may stop at any time. There are no consequences for withdrawing from the study.",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "12px",
                padding: "1rem",
                background: "#f9f9f9",
                borderRadius: "12px",
                border: "1px solid #eee",
              }}
            >
              <div style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1 }}>
                {item.icon}
              </div>
              <div>
                <p
                  style={{
                    margin: "0 0 5px",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#1a1a2e",
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#666",
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </p>
              </div>
            </div>
          ))}
          {/* consent checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 16px",
              background: consentChecked ? "#f0f9e8" : "#f9f9f9",
              border: `1.5px solid ${consentChecked ? "#7dc355" : "#ddd"}`,
              borderRadius: "12px",
              margin: "1.25rem 0",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                setShowConsentWarning(false);
              }}
              style={{
                width: "22px",
                height: "22px",
                marginTop: "1px",
                cursor: "pointer",
                accentColor: "#1a2e1a",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
              I have read and understood the above. I consent to my anonymised
              outdoor workspace photos and survey responses being used for
              academic research, and I take responsibility for censoring any
              sensitive content before submission.
            </span>
          </label>

          {/* warning if they try to proceed without ticking */}
          {showConsentWarning && (
            <div
              style={{
                background: "#fff0f0",
                border: "1.5px solid #e53e3e",
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "12px",
                fontSize: "13px",
                color: "#c0392b",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <span>⚠</span>
              Please tick the checkbox above to confirm you have read and
              accepted the consent terms.
            </div>
          )}

          {/* login button — disabled until checkbox ticked */}
          <button
            onClick={() => {
              if (!consentChecked) {
                setShowConsentWarning(true);
                return;
              }
              onGetStarted();
            }}
            style={{
              width: "100%",
              padding: "16px",
              background: consentChecked ? "#1a2e1a" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: consentChecked ? "pointer" : "not-allowed",
              transition: "background 0.2s",
              boxShadow: consentChecked
                ? "0 4px 16px rgba(26,46,26,0.25)"
                : "none",
            }}
          >
            {consentChecked
              ? "🔐 I Understand — Log In"
              : "🔒 Please accept the consent above"}
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          background: "#1a2e1a",
          color: "#666",
          textAlign: "center",
          padding: "1.5rem 1.25rem",
          fontSize: "12px",
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: "0 0 4px", color: "#888" }}>
          WorkspaceLens · CrowdComputing Research Group
        </p>
        <p style={{ margin: "0 0 4px" }}>
          Studying outdoor knowledge work environments · 2025
        </p>
        <p style={{ margin: 0 }}>Questions? Reply to your invitation email.</p>
      </div>
    </div>
  );
}
