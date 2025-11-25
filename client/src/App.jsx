import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function App() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "'Poppins', Inter, sans-serif",
      color: "#2b2b2b",
      padding: 24,
      display: "flex",
      justifyContent: "center",
    },
    container: {
      width: "100%",
      maxWidth: 1100,
    },
    header: { textAlign: "center", marginBottom: 18 },
    title: {
      margin: 0,
      fontSize: 30,
      fontWeight: 800,
      background: "linear-gradient(90deg,#ff9ade,#be9cff)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    subtitle: { marginTop: 8, color: "#6b5b7a", fontSize: 15 },

    main: {
      display: "flex",
      gap: 20,
      justifyContent: "space-between",
      flexWrap: "wrap",
    },

    leftCol: { flex: "1 1 420px", minWidth: 320 },
    rightCol: { flex: "1 1 420px", minWidth: 320 },

    dropzoneBase: {
      borderRadius: 12,
      padding: 28,
      textAlign: "center",
      cursor: "pointer",
      userSelect: "none",
      transition: "all .18s ease",
      border: "2px dashed #f3b7f7",
      background: "#fff6ff",
      boxShadow: "none",
    },
    dropzoneActive: {
      transform: "translateY(-4px)",
      borderColor: "#e79ce9",
      background: "#ffefff",
      boxShadow: "0 10px 30px rgba(231,156,233,0.14)",
    },

    smallMuted: { color: "#8f7aa0", fontWeight: 600, marginTop: 8 },

    fileName: { marginTop: 12, color: "#5a3a6b", fontWeight: 700 },

    btn: {
      marginTop: 16,
      width: "100%",
      padding: "12px 16px",
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      color: "#fff",
      fontWeight: 800,
      fontSize: 15,
      background: "linear-gradient(90deg,#ff9ade,#be9cff)",
      boxShadow: "0 10px 30px rgba(181,112,255,0.16)",
    },
    btnDisabled: {
      opacity: 0.65,
      cursor: "not-allowed",
      background: "#ffeef8",
      color: "#b59bb7",
      boxShadow: "none",
    },

    card: {
      background: "#ffffff",
      borderRadius: 12,
      padding: 18,
      border: "1px solid #f4e6ff",
      boxShadow: "0 8px 22px rgba(180,120,255,0.06)",
      marginBottom: 12,
    },

    cardTitle: {
      margin: 0,
      textAlign: "center",
      color: "#5b2d7b",
      fontWeight: 800,
      fontSize: 16,
    },

    extractedBox: {
      background: "#fff6ff",
      borderRadius: 10,
      padding: 12,
      border: "1px solid #f3d9ff",
      color: "#4b006e",
      maxHeight: 360,
      overflowY: "auto",
      whiteSpace: "pre-wrap",
      lineHeight: 1.45,
      fontSize: 14,
      marginTop: 12,
    },

    suggestionsList: {
      listStyle: "none",
      padding: 0,
      margin: "8px 0 0",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    suggestionItem: {
      padding: "10px 12px",
      borderRadius: 10,
      background: "#fff3fb",
      borderLeft: "5px solid #ffb3d6",
      color: "#5d1f66",
      fontWeight: 700,
    },

    error: { color: "#d81e5b", fontWeight: 700, marginTop: 10, textAlign: "center" },

    spinner: {
      display: "inline-block",
      width: 16,
      height: 16,
      border: "3px solid rgba(255,255,255,0.3)",
      borderTop: "3px solid rgba(255,255,255,0.9)",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },

    footerNote: { marginTop: 10, textAlign: "center", color: "#9f87a9", fontSize: 13 },
  };
  const spinnerKeyframes = `@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.type !== "application/pdf" && !selected.type.startsWith("image/")) {
      setError("Only PDF or image files are allowed");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (!droppedFile) return;

    if (droppedFile.type !== "application/pdf" && !droppedFile.type.startsWith("image/")) {
      setError("Only PDF or image files are allowed");
      setFile(null);
      return;
    }

    setError("");
    setFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");
    setExtractedText("");
    setSuggestions([]);

    try {
      const res = await axios.post(API_BASE_URL+"/api/upload", formData, {
        headers: {
            "Content-Type" : "multipart/form-data"
        },
        onUploadProgress: (evt) => {
        },
        timeout: 120000,
      });

      const data = res.data || {};
      if (data.success) {
        setExtractedText(data.extractedText ?? data.text ?? data.parsedText ?? "");
        setSuggestions(data.suggestions ?? data.suggest ?? []);
      } else {
        setError(data.error ?? data.message ?? "Failed to analyze file");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error ?? err.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  };

 return (
  <div
    className="app-container"
    style={{
      backgroundColor: "#000",
      minHeight: "100vh",
      padding: "2rem",
      color: "#fff",
    }}
  >
    <header
      className="app-header"
      style={{
        marginBottom: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#c084fc" }}>
        Social Media Content Analyzer
      </h1>

      <p style={{ color: "#e5e5e5", fontSize: "1.1rem" }}>
        Upload a PDF or image of your post. We’ll extract the text and suggest improvements.
      </p>
    </header>

    <main className="app-main" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Upload Section */}
      <section
        className="upload-section"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
      >
        {/* DROPZONE */}
        <div
          className={`dropzone ${dragActive ? "active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            width: "70%",
            padding: "2rem",
            borderRadius: "12px",
            border: dragActive ? "2px dashed #c084fc" : "2px dashed #555",
            background: dragActive ? "#1a1a1a" : "#0d0d0d",
            boxShadow: dragActive
              ? "0 0 15px #c084fc"
              : "0 0 10px rgba(255,255,255,0.1)",
            cursor: "pointer",
            transition: "0.3s",
          }}
        >
          <p style={{ marginBottom: "1rem", color: "#e5e5e5" }}>
            Drag & drop a PDF or image here,
            <br /> or click to select a file.
          </p>

          <input
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            style={{
              background: "#111",
              padding: "10px",
              borderRadius: "8px",
              color: "#fff",
            }}
          />

          {file && (
            <p className="file-name" style={{ marginTop: "1rem", color: "#c084fc" }}>
              Selected: <strong>{file.name}</strong>
            </p>
          )}
        </div>

        {/* BUTTON */}
        <button
          className="analyze-button"
          onClick={handleUpload}
          disabled={loading}
          style={{
            background: "#c084fc",
            padding: "0.8rem 2rem",
            borderRadius: "8px",
            color: "#000",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 10px #c084fc",
            transition: "0.3s",
          }}
        >
          {loading ? "Analyzing..." : "Analyze Content"}
        </button>

        {error && <p className="error-message" style={{ color: "#f87171" }}>{error}</p>}
      </section>

      {/* RESULTS */}
      <section
        className="results-section"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
        }}
      >
        {/* Extracted Text Card */}
        <div
          className="card"
          style={{
            background: "#111",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 0 15px rgba(192,132,252,0.3)",
          }}
        >
          <h2 style={{ color: "#c084fc" }}>Extracted Text</h2>
          {loading ? (
            <p className="muted" style={{ color: "#aaa" }}>Processing file...</p>
          ) : extractedText ? (
            <pre
              className="extracted-text"
              style={{
                whiteSpace: "pre-wrap",
                color: "#fff",
                marginTop: "1rem",
              }}
            >
              {extractedText}
            </pre>
          ) : (
            <p className="muted" style={{ color: "#aaa" }}>
              No text yet. Upload a file.
            </p>
          )}
        </div>

        {/* Suggestions Card */}
        <div
          className="card"
          style={{
            background: "#111",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 0 15px rgba(192,132,252,0.3)",
          }}
        >
          <h2 style={{ color: "#c084fc" }}>Engagement Suggestions</h2>
          {loading ? (
            <p className="muted" style={{ color: "#aaa" }}>Generating suggestions...</p>
          ) : suggestions && suggestions.length > 0 ? (
            <ul style={{ marginTop: "1rem", color: "#fff", lineHeight: "1.6" }}>
              {suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ color: "#aaa" }}>
              Suggestions will appear here.
            </p>
          )}
        </div>
      </section>
    </main>
  </div>
);

}
