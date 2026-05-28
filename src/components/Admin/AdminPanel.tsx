import { useState, useEffect, useRef } from "react";

interface Submission {
  id: string;
  participant_id: string;
  photo_path: string;
  submitted_at: string;
  location_type: string;
  thermal_comfort: number;
  affordance_rating: number;
  natural_light: number;
  noise_level: string;
  activity: string;
  shelter: string;
  surroundings: string[];
  gps_lat: number | null;
  gps_lng: number | null;
}

interface Analysis {
  photo_path: string;
  nature_score: number;
  built_environment_score: number;
  sky_visibility: number;
  natural_light_score: number;
  shadow_presence: number;
  shelter_detected: boolean;
  people_count: number;
  greenness_index: number;
  vision_labels: string[];
  environment_type: string;
  summary: string;
  model_used: string;
}

interface AdminData {
  submissions: Submission[];
  analyses: Record<string, Analysis>;
  signedUrls: Record<string, string>;
  stats: {
    total: number;
    participants: number;
    analysed: number;
    outdoor: number;
  };
  total: number;
}

// theme constants — single source of truth
const T = {
  green: "#1a2e1a",
  greenMid: "#2d7d46",
  greenLight: "#f0f9e8",
  yellow: "#f6c90e",
  border: "#e0e0e0",
  bg: "#f0f4f0",
  white: "#ffffff",
  grey: "#f5f5f5",
  textPrimary: "#1a2e1a",
  textSecondary: "#555555",
  textTertiary: "#888888",
  error: "#e53e3e",
};

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`;

// ── ScoreBar ──────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          marginBottom: "3px",
        }}
      >
        <span style={{ color: T.textSecondary }}>{label}</span>
        <span style={{ color: T.textPrimary, fontWeight: 600 }}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div style={{ height: "6px", background: "#eee", borderRadius: "3px" }}>
        <div
          style={{
            height: "6px",
            background: T.greenMid,
            borderRadius: "3px",
            width: `${value * 100}%`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── SubmissionCard ────────────────────────────────────────────────────────────
function SubmissionCard({
  sub,
  analysis,
  photoUrl,
  selected,
  onClick,
}: {
  sub: Submission;
  analysis?: Analysis;
  photoUrl?: string;
  selected: boolean;
  onClick: () => void;
}) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const hasAnalysis = !!analysis;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        background: T.white,
        borderRadius: "12px",
        overflow: "hidden",
        border: selected
          ? `2px solid ${T.green}`
          : hasAnalysis
            ? `0.5px solid ${T.border}`
            : `0.5px solid ${T.grey}`,
        cursor: "pointer",
        transition: "box-shadow 0.15s, opacity 0.15s",
        boxShadow: selected
          ? `0 4px 20px rgba(26,46,26,0.25)`
          : "0 2px 8px rgba(0,0,0,0.06)",
        // dim unanalysed cards
        opacity: hasAnalysis ? 1 : 0.5,
        filter: hasAnalysis ? "none" : "grayscale(60%)",
      }}
    >
      {/* photo */}
      <div
        ref={imgRef}
        style={{
          height: "180px",
          background: T.grey,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {visible && photoUrl ? (
          <img
            src={photoUrl}
            alt={sub.participant_id}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#ccc",
              fontSize: "24px",
            }}
          >
            🖼️
          </div>
        )}

        {/* location badge */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            background: T.green,
            color: T.white,
            fontSize: "10px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "10px",
          }}
        >
          {sub.location_type}
        </div>

        {/* analysis status badge */}
        {hasAnalysis ? (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: T.greenMid,
              color: T.white,
              fontSize: "10px",
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: "10px",
            }}
          >
            🤖 analysed
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(0,0,0,0.55)",
              color: "#ddd",
              fontSize: "10px",
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: "10px",
            }}
          >
            ⏳ pending
          </div>
        )}

        {/* pending overlay — subtle vignette on unanalysed */}
        {!hasAnalysis && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        )}
      </div>

      {/* card body */}
      <div style={{ padding: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: "13px",
              color: T.textPrimary,
            }}
          >
            {sub.participant_id}
          </span>
          <span style={{ fontSize: "11px", color: T.textTertiary }}>
            {new Date(sub.submitted_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* ESM badges */}
        <div
          style={{
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            marginBottom: hasAnalysis ? "8px" : 0,
          }}
        >
          {[
            { icon: "🌡️", val: `${sub.thermal_comfort}/5` },
            { icon: "☀️", val: `${sub.natural_light}/5` },
            { icon: "⭐", val: `${sub.affordance_rating}/5` },
            { icon: "🔇", val: sub.noise_level },
          ].map((s, i) => (
            <span
              key={i}
              style={{
                background: T.grey,
                borderRadius: "6px",
                padding: "2px 6px",
                fontSize: "11px",
                color: T.textSecondary,
              }}
            >
              {s.icon} {s.val}
            </span>
          ))}
        </div>

        {/* vision score pills — only if analysed */}
        {hasAnalysis && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[
              { icon: "🌿", val: analysis!.nature_score, title: "Nature" },
              {
                icon: "🏗️",
                val: analysis!.built_environment_score,
                title: "Built",
              },
              { icon: "☁️", val: analysis!.sky_visibility, title: "Sky" },
              {
                icon: "💡",
                val: analysis!.natural_light_score,
                title: "Light",
              },
            ].map((s, i) => (
              <div
                key={i}
                title={s.title}
                style={{
                  background: T.greenLight,
                  borderRadius: "6px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  color: T.greenMid,
                }}
              >
                {s.icon} {(s.val * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        )}

        {/* pending message */}
        {!hasAnalysis && (
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: T.textTertiary,
              fontStyle: "italic",
            }}
          >
            Vision analysis pending...
          </p>
        )}
      </div>
    </div>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────────
function DetailPanel({
  sub,
  analysis,
  photoUrl,
  onClose,
}: {
  sub: Submission;
  analysis?: Analysis;
  photoUrl?: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 199,
        }}
      />

      {/* panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(400px, 100vw)",
          background: T.white,
          boxShadow: "-4px 0 24px rgba(0,0,0,0.2)",
          overflowY: "auto",
          zIndex: 200,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "0 1rem",
            background: T.green,
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <span style={{ color: T.white, fontWeight: 600, fontSize: "15px" }}>
            {sub.participant_id} — detail
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: T.white,
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* photo */}
        {photoUrl && (
          <img
            src={photoUrl}
            alt="submission"
            style={{ width: "100%", display: "block" }}
          />
        )}

        <div style={{ padding: "1rem" }}>
          {/* submission fields */}
          <SectionTitle>SUBMISSION</SectionTitle>
          {[
            ["Submitted", new Date(sub.submitted_at).toLocaleString()],
            ["Location type", sub.location_type],
            ["Activity", sub.activity],
            ["Shelter", sub.shelter],
            ["Surroundings", sub.surroundings?.join(", ") ?? "—"],
            [
              "GPS",
              sub.gps_lat
                ? `${sub.gps_lat.toFixed(4)}, ${sub.gps_lng?.toFixed(4)}`
                : "Not captured",
            ],
          ].map(([label, value], i) => (
            <DetailRow key={i} label={label} value={value} />
          ))}

          {/* ESM */}
          <SectionTitle>ESM RESPONSES</SectionTitle>
          {[
            ["Thermal comfort", `${sub.thermal_comfort}/5`],
            ["Natural light", `${sub.natural_light}/5`],
            ["Noise level", sub.noise_level],
            ["Affordance rating", `${sub.affordance_rating}/5 ⭐`],
          ].map(([label, value], i) => (
            <DetailRow key={i} label={label} value={value} bold />
          ))}

          {/* vision analysis */}
          <SectionTitle>VISION ANALYSIS</SectionTitle>
          {analysis ? (
            <>
              <div
                style={{
                  background: T.greenLight,
                  border: `1px solid #c8e0c8`,
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "12px",
                  fontSize: "13px",
                  color: T.textPrimary,
                  lineHeight: 1.6,
                }}
              >
                {analysis.summary}
              </div>

              <ScoreBar label="🌿 Nature" value={analysis.nature_score} />
              <ScoreBar
                label="🏗️ Built environment"
                value={analysis.built_environment_score}
              />
              <ScoreBar
                label="☁️ Sky visibility"
                value={analysis.sky_visibility}
              />
              <ScoreBar
                label="💡 Natural light"
                value={analysis.natural_light_score}
              />
              <ScoreBar
                label="🌑 Shadow presence"
                value={analysis.shadow_presence}
              />
              <ScoreBar
                label="🌱 Greenness index"
                value={analysis.greenness_index}
              />

              <DetailRow
                label="🛡️ Shelter detected"
                value={analysis.shelter_detected ? "Yes" : "No"}
              />
              <DetailRow
                label="👥 People count"
                value={String(analysis.people_count)}
              />
              <DetailRow
                label="🌍 Environment type"
                value={analysis.environment_type}
              />

              <p
                style={{
                  fontSize: "11px",
                  color: T.textTertiary,
                  margin: "12px 0 6px",
                }}
              >
                DETECTED LABELS
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  marginBottom: "12px",
                }}
              >
                {analysis.vision_labels?.map((label, i) => (
                  <span
                    key={i}
                    style={{
                      background: T.greenLight,
                      color: T.greenMid,
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border: `1px solid #c8e0c8`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: "11px", color: "#aaa", margin: 0 }}>
                Model: {analysis.model_used}
              </p>
            </>
          ) : (
            <div
              style={{
                background: T.grey,
                borderRadius: "8px",
                padding: "14px",
                fontSize: "13px",
                color: T.textTertiary,
                textAlign: "center",
              }}
            >
              ⏳ Vision analysis pending
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── small shared components ───────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        margin: "1rem 0 8px",
        fontSize: "11px",
        fontWeight: 600,
        color: T.textTertiary,
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </h3>
  );
}

function DetailRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: `0.5px solid ${T.border}`,
        fontSize: "13px",
      }}
    >
      <span style={{ color: T.textTertiary }}>{label}</span>
      <span
        style={{
          color: T.textPrimary,
          fontWeight: bold ? 600 : 400,
          textAlign: "right",
          maxWidth: "200px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── AdminLogin ────────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${EDGE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      sessionStorage.setItem("adminJWT", data.token);
      onSuccess(data.token);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${T.green} 0%, #0f3460 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: T.white,
          borderRadius: "16px",
          padding: "2rem",
          width: "100%",
          maxWidth: "360px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔬</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: "18px" }}>
            WorkspaceLens Admin
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: T.textTertiary,
            }}
          >
            Research team access only
          </p>
        </div>

        <label
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: T.textSecondary,
            letterSpacing: "0.05em",
          }}
        >
          ADMIN PASSWORD
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Enter admin password"
          autoFocus
          style={{
            display: "block",
            width: "100%",
            marginTop: "6px",
            marginBottom: "8px",
            padding: "12px",
            fontSize: "15px",
            borderRadius: "8px",
            border: error ? `2px solid ${T.error}` : "1.5px solid #ddd",
            boxSizing: "border-box" as const,
            outline: "none",
          }}
        />

        {error && (
          <p style={{ color: T.error, fontSize: "13px", margin: "0 0 12px" }}>
            ⚠ {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            background: loading ? "#888" : T.green,
            color: T.white,
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Checking..." : "Enter →"}
        </button>
      </div>
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem("adminJWT"),
  );
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  const [hidePending, setHidePending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          ...(filter !== "all" && { location: filter }),
        });

        const res = await fetch(`${EDGE_URL}/data?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        if (res.status === 401) {
          sessionStorage.removeItem("adminJWT");
          setToken(null);
          return;
        }

        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);

        const json = await res.json();
        if (cancelled) return;

        const analysisMap: Record<string, Analysis> = {};
        json.analyses?.forEach((a: Analysis) => {
          analysisMap[a.photo_path] = a;
        });

        setData({
          submissions: json.submissions ?? [],
          analyses: analysisMap,
          signedUrls: json.signedUrls ?? {},
          stats: json.stats,
          total: json.total,
        });
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token, page, filter, reloadKey]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminJWT");
    setToken(null);
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = [
      "participant_id",
      "submitted_at",
      "location_type",
      "thermal_comfort",
      "natural_light",
      "noise_level",
      "activity",
      "shelter",
      "affordance_rating",
      "gps_lat",
      "gps_lng",
      "surroundings",
    ];
    const rows = data.submissions.map((s) => [
      s.participant_id,
      s.submitted_at,
      s.location_type,
      s.thermal_comfort,
      s.natural_light,
      s.noise_level,
      s.activity,
      s.shelter,
      s.affordance_rating,
      s.gps_lat ?? "",
      s.gps_lng ?? "",
      (s.surroundings ?? []).join("|"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workspacelens-submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // show login if no token
  if (!token) return <AdminLogin onSuccess={setToken} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* ── NAVBAR ── */}
      <nav
        style={{
          background: T.green,
          padding: "0 1.25rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        {/* logo */}
        <span
          style={{
            fontWeight: 700,
            fontSize: "17px",
            color: T.white,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔬 WorkspaceLens
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              background: "rgba(246,201,14,0.2)",
              border: "1px solid rgba(246,201,14,0.4)",
              color: T.yellow,
              padding: "2px 8px",
              borderRadius: "10px",
            }}
          >
            Admin
          </span>
        </span>

        {/* hamburger */}
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
          aria-label="menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: "22px",
                height: "2px",
                background: T.white,
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
      {/* ── MOBILE MENU DROPDOWN ── */}
      {menuOpen && (
        <>
          {/* backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 98,
              background: "transparent",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "56px",
              left: 0,
              right: 0,
              zIndex: 99,
              background: T.green,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            {/* stats summary in menu */}
            {data && (
              <div
                style={{
                  padding: "12px 1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  gap: "16px",
                }}
              >
                {[
                  { icon: "📸", val: data.stats.total, label: "submissions" },
                  {
                    icon: "👤",
                    val: data.stats.participants,
                    label: "participants",
                  },
                  { icon: "🤖", val: data.stats.analysed, label: "analysed" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: T.yellow,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {s.icon} {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* menu actions */}
            {[
              {
                icon: "↓",
                label: "Export CSV",
                action: () => {
                  exportCSV();
                  setMenuOpen(false);
                },
                highlight: true,
              },
              {
                icon: "↻",
                label: "Refresh data",
                action: () => {
                  reload();
                  setMenuOpen(false);
                },
                highlight: false,
              },
              {
                icon: "🚪",
                label: "Log out",
                action: () => {
                  handleLogout();
                  setMenuOpen(false);
                },
                highlight: false,
                danger: true,
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "14px 1.5rem",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  color: item.danger
                    ? "#ff8888"
                    : item.highlight
                      ? T.yellow
                      : "rgba(255,255,255,0.85)",
                  fontSize: "15px",
                  textAlign: "left" as const,
                  cursor: "pointer",
                  fontWeight: item.highlight ? 600 : 400,
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    width: "24px",
                    textAlign: "center" as const,
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        {/* error */}
        {error && (
          <div
            style={{
              background: "#fff0f0",
              border: `1.5px solid ${T.error}`,
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "1rem",
              fontSize: "13px",
              color: T.error,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            ⚠ {error}
            <button
              onClick={reload}
              style={{
                background: T.error,
                border: "none",
                color: T.white,
                padding: "4px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* stats row */}
        {data && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
              marginBottom: "1.5rem",
            }}
          >
            {[
              {
                label: "Total submissions",
                value: data.stats.total,
                icon: "📸",
              },
              {
                label: "Participants",
                value: data.stats.participants,
                icon: "👤",
              },
              { label: "Analysed", value: data.stats.analysed, icon: "🤖" },
              { label: "Outdoor", value: data.stats.outdoor, icon: "🌿" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: T.white,
                  borderRadius: "12px",
                  padding: "1rem",
                  border: `0.5px solid ${T.border}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                  {stat.icon}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: T.textPrimary,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "12px", color: T.textTertiary }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* filter bar */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "1rem",
            overflowX: "auto", // scroll on mobile
            paddingBottom: "4px",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {["all", "outdoor", "semi-outdoor", "indoor"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                border: filter === f ? "none" : `1px solid ${T.border}`,
                background: filter === f ? T.green : T.white,
                color: filter === f ? T.white : T.textSecondary,
                cursor: "pointer",
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {data && (
            <span
              style={{
                fontSize: "13px",
                color: T.textTertiary,
                marginLeft: "auto",
              }}
            >
              {data.submissions.length} of {data.total} shown
            </span>
          )}
          {/* pending toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: T.textSecondary,
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            <input
              type="checkbox"
              checked={hidePending}
              onChange={(e) => setHidePending(e.target.checked)}
              style={{ accentColor: T.green, width: "15px", height: "15px" }}
            />
            Hide pending analysis
          </label>
        </div>

        {/* loading */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: T.textTertiary,
              fontSize: "14px",
            }}
          >
            ⏳ Loading submissions...
          </div>
        )}

        {/* gallery grid */}
        {/* gallery grid */}
        {data && !loading && (
          <>
            {/* compute filtered list here — right before the grid */}
            {(() => {
              const displayedSubmissions = hidePending
                ? data.submissions.filter((s) => !!data.analyses[s.photo_path])
                : data.submissions;

              return (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {displayedSubmissions.map((sub) => (
                      <SubmissionCard
                        key={sub.id}
                        sub={sub}
                        analysis={data.analyses[sub.photo_path]}
                        photoUrl={data.signedUrls[sub.photo_path]}
                        selected={selected?.id === sub.id}
                        onClick={() => setSelected(sub)}
                      />
                    ))}
                  </div>

                  {/* pagination */}
                  {data.total > 20 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={{
                          padding: "8px 20px",
                          borderRadius: "8px",
                          border: `1px solid ${T.border}`,
                          background: T.white,
                          cursor: page === 0 ? "not-allowed" : "pointer",
                          color: page === 0 ? "#ccc" : T.textSecondary,
                          fontSize: "13px",
                        }}
                      >
                        ← Previous
                      </button>
                      <span
                        style={{
                          alignSelf: "center",
                          fontSize: "13px",
                          color: T.textTertiary,
                        }}
                      >
                        Page {page + 1} of {Math.ceil(data.total / 20)}
                      </span>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={(page + 1) * 20 >= data.total}
                        style={{
                          padding: "8px 20px",
                          borderRadius: "8px",
                          border: `1px solid ${T.border}`,
                          background: T.white,
                          cursor:
                            (page + 1) * 20 >= data.total
                              ? "not-allowed"
                              : "pointer",
                          color:
                            (page + 1) * 20 >= data.total
                              ? "#ccc"
                              : T.textSecondary,
                          fontSize: "13px",
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* detail panel */}
        {selected && data && (
          <DetailPanel
            sub={selected}
            analysis={data.analyses[selected.photo_path]}
            photoUrl={data.signedUrls[selected.photo_path]}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
