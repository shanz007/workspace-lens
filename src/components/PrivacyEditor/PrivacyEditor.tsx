import { useEffect, useRef, useState } from "react";

interface Props {
  imageBlob: Blob;
  participantId: string;
  onConfirm: (censored: Blob, includeGPS: boolean) => void;
  onRetake: () => void;
  onLogout: () => void;
}

type Tool = "blackbox" | "blur";

const MIN_FILE_SIZE_KB = 50;

export default function PrivacyEditor({
  imageBlob,
  participantId,
  onConfirm,
  onRetake,
  onLogout,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const [tool, setTool] = useState<Tool>("blackbox");
  const [actionCount, setActionCount] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [includeGPS, setIncludeGPS] = useState(false);
  const historyRef = useRef<ImageData[]>([]);
  const redoRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [fileSizeError] = useState<string>(() => {
    const sizeKB = imageBlob.size / 1024;
    return sizeKB < MIN_FILE_SIZE_KB
      ? `This photo appears too small (${sizeKB.toFixed(0)} KB). Please retake with a real workspace photo.`
      : "";
  });

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
    redoRef.current = [];
    if (historyRef.current.length > 20) historyRef.current.shift();
    setCanUndo(true);
    setCanRedo(false);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    redoRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    const prev = historyRef.current.pop()!;
    ctx.putImageData(prev, 0, 0);
    setActionCount((c) => Math.max(0, c - 1));
    setConfirming(false);
    setValidationError("");
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  };

  const redo = () => {
    const canvas = canvasRef.current;
    if (!canvas || redoRef.current.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
    const next = redoRef.current.pop()!;
    ctx.putImageData(next, 0, 0);
    setActionCount((c) => c + 1);
    setConfirming(false);
    setCanUndo(true);
    setCanRedo(redoRef.current.length > 0);
  };

  useEffect(() => {
    const url = URL.createObjectURL(imageBlob);
    imageRef.current.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = imageRef.current.naturalWidth;
      canvas.height = imageRef.current.naturalHeight;
      canvas.getContext("2d")!.drawImage(imageRef.current, 0, 0);
    };
    imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes("Mac");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    saveHistory();
    drawingRef.current = true;
    startRef.current = getPos(e);
    setConfirming(false);
    setValidationError("");
  };

  const applyBlur = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    const blockSize = 12;
    const absX = Math.min(x, x + w);
    const absY = Math.min(y, y + h);
    const absW = Math.abs(w);
    const absH = Math.abs(h);
    for (let bx = absX; bx < absX + absW; bx += blockSize) {
      for (let by = absY; by < absY + absH; by += blockSize) {
        const bw = Math.min(blockSize, absX + absW - bx);
        const bh = Math.min(blockSize, absY + absH - by);
        const pixel = ctx.getImageData(bx, by, 1, 1).data;
        ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const end = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    const w = end.x - startRef.current.x;
    const h = end.y - startRef.current.y;
    if (Math.abs(w) < 10 || Math.abs(h) < 10) return;
    if (tool === "blackbox") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(startRef.current.x, startRef.current.y, w, h);
    } else {
      applyBlur(ctx, startRef.current.x, startRef.current.y, w, h);
    }
    setActionCount((c) => c + 1);
  };

  const reset = () => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.drawImage(imageRef.current, 0, 0);
    setActionCount(0);
    setReviewed(false);
    setConfirming(false);
    setValidationError("");
    historyRef.current = [];
    redoRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  };

  const handleUploadTap = () => {
    if (fileSizeError) {
      setValidationError(fileSizeError);
      return;
    }
    if (!reviewed) {
      setValidationError(
        "Please confirm you have reviewed the image before uploading.",
      );
      return;
    }
    if (!confirming) {
      setConfirming(true);
      setValidationError("");
      return;
    }
    // All conditions met — export and upload
    canvasRef.current!.toBlob(
      (blob) => {
        if (blob) onConfirm(blob, includeGPS);
      }, // ← pass includeGPS
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        height: "100vh",
        background: "#f0f4f0",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ── NAVBAR ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          height: "52px",
          background: "#1a2e1a",
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>
          🌿 Censor Photo
        </span>

        {/* Participant badge + logout */}
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
        <>
          <div
            onClick={() => setShowLogout(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998,
              background: "transparent",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "52px",
              right: "1.25rem",
              zIndex: 999,
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
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
              <span>🚪</span> Log out
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
              <span>✕</span> Cancel
            </button>
          </div>
        </>
      )}

      {/* ── TOOL BAR ── */}
      <div
        style={{
          padding: "8px 1rem",
          background: "#fff",
          borderBottom: "1px solid #e0e8e0",
          flexShrink: 0,
        }}
      >
        {/* Tool selector + undo/redo */}
        {!fileSizeError && (
          <div style={{ display: "flex", gap: "6px", marginBottom: "0.5rem" }}>
            {/* tool buttons */}
            <button
              onClick={() => setTool("blackbox")}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: "8px",
                border: `2px solid ${tool === "blackbox" ? "#1a2e1a" : "#ddd"}`,
                background: tool === "blackbox" ? "#1a2e1a" : "#fff",
                color: tool === "blackbox" ? "#fff" : "#555",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: tool === "blackbox" ? 700 : 400,
              }}
            >
              ⬛ Black box
            </button>
            <button
              onClick={() => setTool("blur")}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: "8px",
                border: `2px solid ${tool === "blur" ? "#1a2e1a" : "#ddd"}`,
                background: tool === "blur" ? "#1a2e1a" : "#fff",
                color: tool === "blur" ? "#fff" : "#555",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: tool === "blur" ? 700 : 400,
              }}
            >
              🌫 Blur
            </button>

            {/* divider */}
            <div
              style={{ width: "1px", background: "#ddd", margin: "4px 0" }}
            />

            {/* undo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1.5px solid #ddd",
                background: !canUndo ? "#f5f5f5" : "#fff",
                color: !canUndo ? "#ccc" : "#333",
                cursor: !canUndo ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "38px",
              }}
            >
              ↩
            </button>

            {/* redo */}
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1.5px solid #ddd",
                background: !canRedo ? "#f5f5f5" : "#fff",
                color: !canRedo ? "#ccc" : "#333",
                cursor: !canRedo ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "38px",
              }}
            >
              ↪
            </button>
          </div>
        )}
        {/* File size error */}
        {fileSizeError && (
          <div
            style={{
              background: "#fff0f0",
              border: "1.5px solid #e53e3e",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              color: "#c0392b",
              marginBottom: "8px",
            }}
          >
            ❌ {fileSizeError}
          </div>
        )}

        {/* Action count badge */}
        {actionCount >= 0 && (
          <div
            style={{
              background: "#e1f5ee",
              border: "1px solid #7dc355",
              borderRadius: "20px",
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#1a5c2a",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            ✓ {actionCount} area{actionCount > 1 ? "s" : ""}
          </div>
        )}

        {/* Instruction hint */}
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "12px",
            color: "#888",
            lineHeight: 1.4,
          }}
        >
          {tool === "blackbox"
            ? "⬛ Drag to draw black boxes over faces, screens, or names to mask."
            : "🌫 Drag to pixelate sensitive areas."}
          {canUndo && (
            <span style={{ color: "#1a2e1a", fontWeight: 500 }}>
              {" "}
              · Ctrl+Z to undo
            </span>
          )}
        </p>
      </div>

      {/* ── CANVAS ── */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          flexShrink: 1,
          minHeight: 0,
          cursor: "crosshair",
          touchAction: "none",
          display: "block",
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />

      {/* ── BOTTOM PANEL ── */}
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #e0e8e0",
          padding: "10px 1rem",
          flexShrink: 0,
        }}
      >
        {/* Review checkbox */}
        {actionCount >= 0 && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              cursor: "pointer",
              padding: "10px 12px",
              background: reviewed ? "#f0f9e8" : "#f9f9f9",
              borderRadius: "10px",
              border: `1.5px solid ${reviewed ? "#7dc355" : "#ddd"}`,
              transition: "all 0.2s",
            }}
          >
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => {
                setReviewed(e.target.checked);
                setValidationError("");
              }}
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
                flexShrink: 0,
                accentColor: "#1a2e1a",
              }}
            />
            <span style={{ fontSize: "13px", color: "#444", lineHeight: 1.5 }}>
              I have reviewed the image and am happy to submit it.
            </span>
          </label>
        )}
        {/* GPS consent checkbox — shown alongside review checkbox */}
        {actionCount >= 0 && (
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "10px",
              cursor: "pointer",
              padding: "10px 12px",
              background: includeGPS ? "#f0f4ff" : "#f9f9f9",
              borderRadius: "10px",
              border: `1.5px solid ${includeGPS ? "#4a7adb" : "#ddd"}`,
              transition: "all 0.2s",
              textAlign: "left",
            }}
          >
            <input
              type="checkbox"
              checked={includeGPS}
              onChange={(e) => setIncludeGPS(e.target.checked)}
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
                flexShrink: 0,
                accentColor: "#4a7adb",
                marginTop: "1px",
              }}
            />
            <span style={{ fontSize: "13px", color: "#444", lineHeight: 1.5 }}>
              Include my approximate GPS location with this submission
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#888",
                  marginTop: "2px",
                }}
              >
                Optional — helps researchers map outdoor workspace locations.
                You can leave this unticked.
              </span>
            </span>
          </label>
        )}

        {/* Validation error */}
        {validationError && (
          <div
            style={{
              background: "#fff0f0",
              border: "1.5px solid #e53e3e",
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "10px",
              fontSize: "13px",
              color: "#c0392b",
              display: "flex",
              gap: "6px",
              alignItems: "flex-start",
            }}
          >
            <span style={{ flexShrink: 0 }}>⚠</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Confirmation banner */}
        {confirming && (
          <div
            style={{
              background: "#fffbea",
              border: "1.5px solid #f6c90e",
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "10px",
              fontSize: "13px",
              color: "#7a5f00",
            }}
          >
            ⚠️ Once submitted, it cannot be edited or deleted. Tap{" "}
            <strong>Confirm &amp; Send</strong> to proceed to survey.
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onRetake}
            style={{
              flex: 1,
              padding: "13px 8px",
              borderRadius: "10px",
              border: "1.5px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              color: "#555",
              fontWeight: 500,
            }}
          >
            📷 Retake
          </button>

          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: "13px 8px",
              borderRadius: "10px",
              border: "1.5px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              color: "#555",
              fontWeight: 500,
            }}
          >
            {confirming ? "✕ Cancel" : "🗑️ Clear"}
          </button>

          <button
            onClick={handleUploadTap}
            disabled={!!fileSizeError}
            style={{
              flex: 2,
              padding: "13px 8px",
              borderRadius: "10px",
              border: "none",
              background: fileSizeError
                ? "#ccc"
                : confirming
                  ? "#2d7d46"
                  : "#1a2e1a",
              color: "#fff",
              cursor: fileSizeError ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 700,
              transition: "background 0.2s",
            }}
          >
            {confirming ? "✓ Confirm & Send" : "↑ Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
