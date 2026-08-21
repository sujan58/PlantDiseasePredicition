import { useState, useRef, useCallback, useEffect } from "react";
import React from "react";
import {
  Upload,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
  Settings2,
  ScanLine,
  Bug,
  Gauge,
  Sprout,
  FlaskConical,
  ShieldCheck,
  Info,
} from "lucide-react";


// ============================================================
// API URL
// ============================================================

const DEFAULT_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";


// ============================================================
// FORMAT CLASS NAME
// ============================================================

function formatClassName(raw) {

  if (!raw) return "";

  let s = raw
    .replace(/_+/g, " ")
    .trim();

  s = s.replace(
    /([a-z])([A-Z])/g,
    "$1 $2"
  );

  const words = s
    .split(" ")
    .filter(Boolean);

  const deduped = words.filter(
    (w, i) =>
      i === 0 ||
      w.toLowerCase() !==
      words[i - 1].toLowerCase()
  );

  return deduped
    .map(
      (w) =>
        w.charAt(0).toUpperCase() +
        w.slice(1)
    )
    .join(" ");
}


// ============================================================
// NORMALIZE REMEDY
// ============================================================

function normalizeRemedy(remedy) {

  if (!remedy) {
    return null;
  }

  if (typeof remedy === "string") {
    return {
      simpleText: remedy
    };
  }

  return remedy;
}


// ============================================================
// SEVERITY STYLE
// ============================================================

function severityStyle(text) {

  const t = (
    text || ""
  ).toLowerCase();

  if (t.includes("high")) {

    return {
      color: "var(--rust)",
      bg: "var(--rust-soft)"
    };

  }

  if (t.includes("moderate")) {

    return {
      color: "var(--amber)",
      bg: "var(--amber-soft)"
    };

  }

  if (t.includes("low")) {

    return {
      color: "var(--growth-dark)",
      bg: "var(--sage)"
    };

  }

  return {
    color: "var(--ink-muted)",
    bg: "var(--sage)"
  };
}


// ============================================================
// TREATMENT LIST
// ============================================================

function TreatmentList({
  icon: Icon,
  title,
  items,
  tint
}) {

  if (
    !items ||
    items.length === 0
  ) {
    return null;
  }

  return (
    <div>

      <p className="text-xs uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">

        <Icon
          className="w-3.5 h-3.5"
          style={{ color: tint }}
        />

        {title}

      </p>

      <ul className="space-y-1.5">

        {items.map(
          (item, i) => (

            <li
              key={i}
              className="text-sm text-ink leading-relaxed flex gap-2"
            >

              <span
                style={{
                  color: tint,
                  flexShrink: 0
                }}
              >
                •
              </span>

              <span>
                {item}
              </span>

            </li>

          )
        )}

      </ul>

    </div>
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PlantDiseaseDetector() {

  const [
    selectedFile,
    setSelectedFile
  ] = useState(null);

  const [
    previewUrl,
    setPreviewUrl
  ] = useState(null);

  const [
    isDragging,
    setIsDragging
  ] = useState(false);

  const [
    isAnalyzing,
    setIsAnalyzing
  ] = useState(false);

  const [
    result,
    setResult
  ] = useState(null);

  const [
    error,
    setError
  ] = useState(null);

  const [
    apiUrl,
    setApiUrl
  ] = useState(DEFAULT_API_URL);

  const [
    showSettings,
    setShowSettings
  ] = useState(false);

  const [
    barReady,
    setBarReady
  ] = useState(false);

  const fileInputRef =
    useRef(null);


  // ==========================================================
  // CONFIDENCE BAR
  // ==========================================================

  useEffect(() => {

    if (result) {

      const t = setTimeout(
        () => setBarReady(true),
        150
      );

      return () =>
        clearTimeout(t);
    }

    setBarReady(false);

  }, [result]);


  // ==========================================================
  // CLEANUP IMAGE URL
  // ==========================================================

  useEffect(() => {

    return () => {

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

    };

  }, [previewUrl]);


  // ==========================================================
  // HANDLE FILE
  // ==========================================================

  const handleFile = useCallback(
    (file) => {

      if (
        !file ||
        !file.type.startsWith("image/")
      ) {

        setError(
          "That doesn't look like an image file. Try a JPG or PNG of a single leaf."
        );

        return;
      }

      setError(null);

      setResult(null);

      setSelectedFile(file);

      setPreviewUrl(
        URL.createObjectURL(file)
      );

    },
    []
  );


  // ==========================================================
  // HANDLE DROP
  // ==========================================================

  const handleDrop = useCallback(
    (e) => {

      e.preventDefault();

      setIsDragging(false);

      const file =
        e.dataTransfer.files?.[0];

      handleFile(file);

    },
    [handleFile]
  );


  // ==========================================================
  // ANALYZE
  // ==========================================================

  const handleAnalyze =
    async () => {

      if (!selectedFile) {
        return;
      }

      setIsAnalyzing(true);

      setError(null);

      setResult(null);


      try {

        const formData =
          new FormData();

        formData.append(
          "file",
          selectedFile
        );


        const cleanApiUrl =
          apiUrl.replace(/\/$/, "");


        const res =
          await fetch(
            `${cleanApiUrl}/predict`,
            {
              method: "POST",
              body: formData
            }
          );


        if (!res.ok) {

          throw new Error(
            `Server responded with ${res.status}`
          );

        }


        const data =
          await res.json();


        if (data.success === false) {

          throw new Error(
            "Prediction failed on the server."
          );

        }


        setResult(data);

      }

      catch (err) {

        console.error(
          "Prediction error:",
          err
        );


        if (
          err.message ===
          "Failed to fetch"
        ) {

          setError(
            `Can't reach the diagnostic server at ${apiUrl}. Make sure your FastAPI backend is running.`
          );

        }

        else {

          setError(
            `Diagnosis failed: ${err.message}`
          );

        }

      }

      finally {

        setIsAnalyzing(false);

      }

    };


  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = () => {

    setSelectedFile(null);

    setPreviewUrl(null);

    setResult(null);

    setError(null);

  };


  // ==========================================================
  // RESULT DATA
  // ==========================================================

  const isHealthy =
    (
      result?.prediction || ""
    )
      .toLowerCase()
      .includes("healthy");


  const remedyData =
    normalizeRemedy(
      result?.remedy
    );


  const displayName =
    remedyData?.common_name ||
    formatClassName(
      result?.prediction
    );


  const sevStyle =
    remedyData?.severity
      ? severityStyle(
        remedyData.severity
      )
      : null;


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      className="min-h-screen ff-body relative py-12 px-4"
      style={{
        backgroundColor:
          "var(--paper)"
      }}
    >

      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'
        );

        :root {
          --paper: #FAF9F4;
          --paper-raised: #FFFFFF;
          --ink: #16342A;
          --ink-muted: #5C7267;
          --growth: #3E8E5C;
          --growth-dark: #2C6B45;
          --growth-light: #8FC7A3;
          --sage: #EAF3EC;
          --sage-border: #D3E8D9;
          --rust: #B5622C;
          --rust-soft: #F5E6D8;
          --amber: #B8862E;
          --amber-soft: #F3E9D3;
        }

        .ff-display {
          font-family: 'Fraunces', serif;
        }

        .ff-body {
          font-family: 'Work Sans', sans-serif;
        }

        .ff-mono {
          font-family: 'IBM Plex Mono', monospace;
        }

        .text-ink {
          color: var(--ink);
        }

        .text-muted {
          color: var(--ink-muted);
        }

        .text-growth {
          color: var(--growth);
        }

        .text-rust {
          color: var(--rust);
        }

        .bg-paper-raised {
          background-color: var(--paper-raised);
        }

        .bg-sage {
          background-color: var(--sage);
        }

        .border-sage {
          border-color: var(--sage-border);
        }

        .upload-zone {
          border-color: var(--sage-border);
        }

        .upload-zone:hover {
          border-color: var(--growth-light);
          background-color: var(--sage);
        }

        .upload-zone:focus-visible {
          outline: 2px solid var(--growth);
          outline-offset: 2px;
        }

        .hover-sage:hover {
          background-color: var(--sage);
        }

        .hover-ink:hover {
          color: var(--ink);
        }

        .input-field {
          background-color: var(--paper-raised);
          color: var(--ink);
          border-color: var(--sage-border);
        }

        .input-field:focus {
          outline: none;
          border-color: var(--growth);
        }

        @keyframes scan-sweep {

          0% {
            top: -4%;
            opacity: 0;
          }

          12% {
            opacity: 1;
          }

          88% {
            opacity: 1;
          }

          100% {
            top: 100%;
            opacity: 0;
          }

        }

        @keyframes fade-up {

          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }
        
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes grow-in {

          from {
            opacity: 0;
            transform: scale(0.97);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }

        }

        @keyframes float-soft {

          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }

          50% {
            transform: translateY(-16px) translateX(8px);
          }

        }

        @media (prefers-reduced-motion: reduce) {

          *,
          *::before,
          *::after {

            animation-duration: 0.01ms !important;

            animation-iteration-count: 1 !important;

            transition-duration: 0.01ms !important;

          }

        }

      `}</style>


      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >

        <div
          className="absolute rounded-full"
          style={{
            width: "380px",
            height: "380px",
            top: "-120px",
            left: "-110px",
            background:
              "radial-gradient(circle, rgba(143,199,163,0.28), transparent 70%)",
            animation:
              "float-soft 11s ease-in-out infinite"
          }}
        />

        <div
          className="absolute rounded-full"
          style={{
            width: "320px",
            height: "320px",
            bottom: "-100px",
            right: "-90px",
            background:
              "radial-gradient(circle, rgba(181,98,44,0.10), transparent 70%)",
            animation:
              "float-soft 13s ease-in-out infinite reverse"
          }}
        />

      </div>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <div
        className={`w-full mx-auto relative z-10 px-4 transition-all duration-700 ease-in-out ${result ? "max-w-6xl" : "max-w-xl"
          }`}
      >


        {/* HEADER */}

        <header className="mb-8 text-center">

          <div className="inline-flex items-center gap-2 mb-3">

            <Leaf className="w-4 h-4 text-growth" />

            <span className="ff-mono text-xs tracking-widest uppercase text-muted">
              Field Diagnostics
            </span>

          </div>


          <h1 className="ff-display text-ink text-4xl font-semibold">
            Plant Disease Detector
          </h1>


          <p className="text-muted mt-2 text-sm">
            Upload a leaf photo and get an instant diagnosis.
          </p>

        </header>


        <div className={`grid grid-cols-1 gap-8 items-start transition-all duration-700 ${result ? "lg:grid-cols-2" : ""}`}>

          {/* LEFT COLUMN: UPLOAD & RESULTS */}
          <div className="flex flex-col">
            <div
              className="bg-paper-raised rounded-2xl border border-sage shadow-sm overflow-hidden"
              style={{
                animation:
                  "fade-up 0.5s ease-out"
              }}
            >


              {/* =================================================
              UPLOAD
          ================================================= */}

              {!previewUrl ? (

                <div
                  role="button"
                  tabIndex={0}

                  onKeyDown={(e) => {

                    if (
                      e.key === "Enter" ||
                      e.key === " "
                    ) {

                      e.preventDefault();

                      fileInputRef.current?.click();

                    }

                  }}

                  onDrop={handleDrop}

                  onDragOver={(e) => {

                    e.preventDefault();

                    setIsDragging(true);

                  }}

                  onDragLeave={() =>
                    setIsDragging(false)
                  }

                  onClick={() =>
                    fileInputRef.current?.click()
                  }

                  className="upload-zone m-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center py-16 px-6"

                  style={{
                    borderColor:
                      isDragging
                        ? "var(--growth)"
                        : undefined,

                    backgroundColor:
                      isDragging
                        ? "var(--sage)"
                        : undefined
                  }}
                >

                  <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center mb-4">

                    <Upload className="w-6 h-6 text-growth" />

                  </div>


                  <p className="text-ink font-medium mb-1">
                    Drop a leaf photo here
                  </p>


                  <p className="text-muted text-sm">
                    or click to browse — JPG, PNG
                  </p>


                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"

                    onChange={(e) =>
                      handleFile(
                        e.target.files?.[0]
                      )
                    }
                  />

                </div>

              ) : (

                <div className="p-6">


                  {/* IMAGE */}

                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{
                      aspectRatio: "4 / 3"
                    }}
                  >

                    <img
                      src={previewUrl}
                      alt="Selected leaf"
                      className="w-full h-full object-cover"
                    />


                    {/* SCANNING */}

                    {isAnalyzing && (
                      <>

                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(22,52,42,0.05), rgba(22,52,42,0.35))"
                          }}
                        />


                        <div
                          className="absolute left-0 right-0 h-0.5"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, #8FC7A3, transparent)",

                            boxShadow:
                              "0 0 14px 2px rgba(62,142,92,0.85)",

                            animation:
                              "scan-sweep 1.8s ease-in-out infinite"
                          }}
                        />

                      </>
                    )}


                    {/* REMOVE IMAGE */}

                    {!isAnalyzing &&
                      !result && (

                        <button
                          onClick={handleReset}
                          aria-label="Remove image"

                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110"

                          style={{
                            backgroundColor:
                              "rgba(255,255,255,0.92)"
                          }}
                        >

                          <X className="w-4 h-4 text-ink" />

                        </button>

                      )}

                  </div>


                  {/* SCANNING TEXT */}

                  {isAnalyzing && (

                    <p className="text-center text-sm text-muted mt-3 ff-mono flex items-center justify-center gap-2">

                      <Loader2 className="w-3.5 h-3.5 animate-spin" />

                      Scanning leaf pattern…

                    </p>

                  )}


                  {/* DIAGNOSE BUTTON */}

                  {!isAnalyzing &&
                    !result && (

                      <button
                        onClick={handleAnalyze}

                        className="w-full mt-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all active:scale-95 hover:brightness-110"

                        style={{
                          backgroundColor:
                            "var(--growth)"
                        }}
                      >

                        <ScanLine className="w-4 h-4" />

                        Diagnose Leaf

                      </button>

                    )}

                </div>

              )}


              {/* =================================================
              ERROR
          ================================================= */}

              {error && (

                <div
                  className="mx-6 mb-6 p-4 rounded-xl flex gap-3"

                  style={{
                    backgroundColor:
                      "var(--rust-soft)",

                    animation:
                      "fade-up 0.3s ease-out"
                  }}
                >

                  <AlertTriangle
                    className="w-5 h-5 text-rust flex-shrink-0 mt-0.5"
                  />


                  <div>

                    <p className="text-sm font-medium text-rust">
                      Couldn't complete diagnosis
                    </p>

                    <p className="text-sm text-muted mt-0.5">
                      {error}
                    </p>

                  </div>

                </div>

              )}


              {/* =================================================
              RESULTS
          ================================================= */}

              {result && (

                <div
                  className="border-t border-sage"

                  style={{
                    animation:
                      "grow-in 0.4s ease-out"
                  }}
                >

                  <div className="p-6 space-y-5">


                    {/* DIAGNOSIS */}

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <span className="ff-mono text-xs uppercase tracking-widest text-muted">
                          Diagnosis
                        </span>


                        <h2 className="ff-display text-ink text-2xl font-semibold mt-1">
                          {displayName}
                        </h2>


                        {remedyData?.pathogen_type && (

                          <p className="text-xs text-muted mt-1.5 flex items-center gap-1.5">

                            <Bug className="w-3.5 h-3.5" />

                            {remedyData.pathogen_type}

                          </p>

                        )}

                      </div>


                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"

                        style={{
                          backgroundColor:
                            isHealthy
                              ? "var(--sage)"
                              : "var(--rust-soft)",

                          color:
                            isHealthy
                              ? "var(--growth-dark)"
                              : "var(--rust)"
                        }}
                      >

                        {isHealthy ? (

                          <CheckCircle2 className="w-3.5 h-3.5" />

                        ) : (

                          <AlertTriangle className="w-3.5 h-3.5" />

                        )}

                        {isHealthy
                          ? "Healthy"
                          : "Issue found"}

                      </div>

                    </div>


                    {/* CONFIDENCE */}

                    <div>

                      <div className="flex justify-between items-baseline mb-1.5">

                        <span className="text-xs text-muted uppercase tracking-wide">
                          Confidence
                        </span>

                        <span className="ff-mono text-sm text-ink">
                          {Number(
                            result.confidence
                          ).toFixed(1)}
                          %
                        </span>

                      </div>


                      <div className="h-1.5 rounded-full bg-sage overflow-hidden">

                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"

                          style={{
                            width: barReady
                              ? `${result.confidence}%`
                              : "0%",

                            backgroundColor:
                              isHealthy
                                ? "var(--growth)"
                                : "var(--rust)"
                          }}
                        />

                      </div>

                    </div>


                    {/* SEVERITY */}

                    {remedyData?.severity && (

                      <div
                        className="rounded-xl p-3.5 flex gap-2.5"

                        style={{
                          backgroundColor:
                            sevStyle.bg
                        }}
                      >

                        <Gauge
                          className="w-4 h-4 flex-shrink-0 mt-0.5"

                          style={{
                            color:
                              sevStyle.color
                          }}
                        />


                        <div>

                          <p
                            className="text-xs uppercase tracking-widest font-medium mb-0.5"

                            style={{
                              color:
                                sevStyle.color
                            }}
                          >
                            Severity
                          </p>


                          <p className="text-sm text-ink leading-relaxed">
                            {remedyData.severity}
                          </p>

                        </div>

                      </div>

                    )}


                    {/* SYMPTOMS */}

                    {remedyData?.symptoms && (

                      <div>

                        <p className="text-xs uppercase tracking-widest text-muted mb-1.5">
                          Symptoms
                        </p>

                        <p className="text-sm text-ink leading-relaxed">
                          {remedyData.symptoms}
                        </p>

                      </div>

                    )}


                    {/* ORGANIC */}

                    <TreatmentList
                      icon={Sprout}
                      title="Organic treatment"
                      items={
                        remedyData?.organic_treatment
                      }
                      tint="var(--growth)"
                    />


                    {/* CHEMICAL */}

                    <TreatmentList
                      icon={FlaskConical}
                      title="Chemical treatment"
                      items={
                        remedyData?.chemical_treatment
                      }
                      tint="var(--ink-muted)"
                    />


                    {/* PREVENTION */}

                    <TreatmentList
                      icon={ShieldCheck}
                      title="Prevention"
                      items={
                        remedyData?.prevention
                      }
                      tint="var(--growth)"
                    />


                    {/* SIMPLE REMEDY */}

                    {remedyData?.simpleText && (

                      <div className="rounded-xl p-4 bg-sage">

                        <p className="text-sm text-ink leading-relaxed">
                          {remedyData.simpleText}
                        </p>

                      </div>

                    )}


                    {/* NOTE */}

                    {remedyData?.note && (

                      <div
                        className="rounded-xl p-3.5 flex gap-2.5 border"

                        style={{
                          backgroundColor:
                            "var(--paper)",

                          borderColor:
                            "var(--sage-border)"
                        }}
                      >

                        <Info
                          className="w-4 h-4 text-muted flex-shrink-0 mt-0.5"
                        />

                        <p className="text-xs text-muted leading-relaxed">
                          {remedyData.note}
                        </p>

                      </div>

                    )}

                  </div>


                  {/* RESET */}

                  <button
                    onClick={handleReset}

                    className="hover-sage w-full py-3.5 border-t border-sage text-sm font-medium text-growth flex items-center justify-center gap-2 transition-colors"
                  >

                    <RefreshCw className="w-3.5 h-3.5" />

                    Diagnose another leaf

                  </button>

                </div>

              )}

            </div>


            {/* ===================================================
            API SETTINGS
        =================================================== */}

            <div className="mt-4 text-center">

              <button
                onClick={() =>
                  setShowSettings(
                    (s) => !s
                  )
                }

                className="hover-ink inline-flex items-center gap-1.5 text-xs text-muted transition-colors"
              >

                <Settings2 className="w-3.5 h-3.5" />

                {apiUrl}

              </button>


              {showSettings && (

                <div
                  className="mt-2 flex justify-center"

                  style={{
                    animation:
                      "fade-up 0.2s ease-out"
                  }}
                >

                  <input
                    type="text"

                    value={apiUrl}

                    onChange={(e) =>
                      setApiUrl(
                        e.target.value
                      )
                    }

                    className="input-field ff-mono text-xs px-3 py-2 rounded-lg border w-64"

                    placeholder="http://localhost:8000"
                  />

                </div>

              )}

            </div>

          </div>

          {/* RIGHT COLUMN: VIDEO */}
          {result && (
            <div
              className="bg-paper-raised rounded-2xl border border-sage shadow-sm overflow-hidden p-6 flex flex-col h-full"
              style={{ animation: "fade-in-right 0.6s ease-out forwards", animationFillMode: "both", animationDelay: "0.2s" }}
            >
              <div className="mb-4">
                <h2 className="ff-display text-ink text-xl font-semibold">Reference Walkthrough</h2>
                <p className="text-sm text-muted mt-1">Watch this reference video for guidance on disease management.</p>
              </div>

              <div className="relative w-full rounded-xl overflow-hidden bg-sage shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]" style={{ aspectRatio: "16/9" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/FHY6SGRDE4Q"
                  title="Plant Disease Reference Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}