import { useState, useRef, useEffect } from "react";
import HomePage from "./components/Home/HomePage";
import Login from "./components/Login/Login";
import Camera from "./components/Camera/Camera";
import PrivacyEditor from "./components/PrivacyEditor/PrivacyEditor";
import { useUpload } from "./hooks/useUpload";
import Questionnaire from "./components/Questionnaire/Questionnaire";
import type { QuestionnaireResponses } from "./components/Questionnaire/Questionnaire";

type Screen =
  | "home"
  | "login"
  | "camera"
  | "editor"
  | "uploading"
  | "done"
  | "error"
  | "questionnaire";

export default function App() {
  const [participantId, setParticipantId] = useState<string>(
    () => localStorage.getItem("participantId") ?? "",
  );
  const [screen, setScreen] = useState<Screen>(() =>
    localStorage.getItem("participantId") ? "camera" : "home",
  );
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const { uploadPhoto, retryQueue } = useUpload();
  const [, setLogs] = useState<string[]>([]);
  const [, setQuestionnaireResponses] = useState<QuestionnaireResponses | null>(
    null,
  );
  const censoredBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    retryQueue();
    console.log("App loaded — checking offline queue...");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 20));
    console.log(msg);
  };
  const handleLogin = (id: string) => {
    setParticipantId(id);
    setScreen("camera");
    log(`Logged in as ${id}`);
  };

  const handleCapture = (blob: Blob) => {
    setCapturedBlob(blob);
    setScreen("editor");
    log(`Photo captured — ${(blob.size / 1024).toFixed(0)} KB`);
  };

  const handleConfirm = async (
    censored: Blob,
    responses?: QuestionnaireResponses | null,
  ) => {
    setScreen("uploading");
    setStatusMsg("Uploading...");
    log(`Uploading ${(censored.size / 1024).toFixed(0)} KB...`);

    const result = await uploadPhoto(
      censored,
      participantId,
      responses ?? undefined,
    );
    if (result.success) {
      log(`✓ Uploaded to: ${result.path}`);
      setStatusMsg("✓ Photo uploaded successfully!");
      setScreen("done");
    } else if (result.queued) {
      log(`📦 Queued locally — will retry when online`);
      setStatusMsg(
        "No signal — photo saved and will upload when you reconnect.",
      );
      setScreen("done");
    } else {
      log(`✗ Upload failed: ${result.error}`);
      setStatusMsg(`Upload failed: ${result.error}`);
      setScreen("error");
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setScreen("camera");
  };

  if (screen === "home")
    return (
      <>
        <HomePage onGetStarted={() => setScreen("login")} />
      </>
    );

  if (screen === "login")
    return (
      <>
        <Login onLogin={handleLogin} onBack={() => setScreen("home")} />
      </>
    );

  if (screen === "camera")
    return (
      <>
        <Camera
          participantId={participantId}
          onCapture={handleCapture}
          onLogout={() => setScreen("home")}
        />
      </>
    );

  if (screen === "editor" && capturedBlob)
    return (
      <>
        <PrivacyEditor
          imageBlob={capturedBlob}
          participantId={participantId}
          onConfirm={(censored) => {
            censoredBlobRef.current = censored; // ← store immediately, no async delay
            setScreen("questionnaire"); // go to survey before uploading
          }}
          onRetake={handleRetake}
          onLogout={() => {
            localStorage.removeItem("participantId");
            setScreen("home");
          }}
        />
      </>
    );

  if (screen === "questionnaire")
    return (
      <>
        <Questionnaire
          onComplete={(responses) => {
            setQuestionnaireResponses(responses);
            log(
              `ESM responses recorded — ${Object.keys(responses).length} fields`,
            );
            const blob = censoredBlobRef.current;
            if (!blob) {
              log("❌ No censored blob found");
              return;
            }
            handleConfirm(blob, responses);
          }}
        />
      </>
    );

  if (screen === "uploading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ fontSize: "16px", color: "#666" }}>{statusMsg}</p>
      </div>
    );
  }

  if (screen === "done") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <h2 style={{ color: "#1a1a2e", marginBottom: "0.5rem" }}>
          Photo submitted!
        </h2>
        <p style={{ color: "#666", marginBottom: "2rem", textAlign: "center" }}>
          Thank you. Your workspace photo has been uploaded successfully.
        </p>
        <button
          onClick={() => setScreen("camera")}
          style={{
            padding: "13px 32px",
            background: "#1a1a2e",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          Take another photo
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("participantId");
            setScreen("home");
          }}
          style={{
            marginTop: "12px",
            padding: "10px 24px",
            background: "transparent",
            color: "#999",
            border: "1.5px solid #ddd",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Log out
        </button>
      </div>
    );
  }

  if (screen === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
        <h2 style={{ color: "#e53e3e", marginBottom: "0.5rem" }}>
          Upload failed
        </h2>
        <p style={{ color: "#666", marginBottom: "2rem", textAlign: "center" }}>
          {statusMsg}
        </p>
        <button
          onClick={() => capturedBlob && handleConfirm(capturedBlob)}
          style={{
            padding: "13px 32px",
            background: "#1a1a2e",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "15px",
            marginBottom: "12px",
          }}
        >
          Retry upload
        </button>
        <button
          onClick={handleRetake}
          style={{
            padding: "10px 24px",
            background: "transparent",
            color: "#999",
            border: "1.5px solid #ddd",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Retake photo
        </button>
      </div>
    );
  }

  return null;
}
