"use client";

import React, { useState, useEffect, useRef } from "react";
import API_BASE_URL from "@/config/api";
import { motion as motionFramer, AnimatePresence as AnimatePresenceFramer } from "framer-motion";
import {
  Search,
  FileText,
  Scale,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Terminal,
  HelpCircle,
  FileSearch,
  CheckCircle,
  Sparkles,
  Loader2,
  Cpu,
  ChevronRight,
  Award,
  BookMarked,
  X,
  FileDown,
} from "lucide-react";
import { useSSE, AgentType, StepStatus } from "@/hooks/useSSE";
import FileUpload from "@/components/FileUpload";
import PipelineTracker from "@/components/PipelineTracker";
import ReportViewer from "@/components/ReportViewer";
import CriticPanel from "@/components/CriticPanel";
import ComparePanel from "@/components/ComparePanel";
import OrbitalSphere from "@/components/OrbitalSphere";

const smoothTransition = { type: "spring" as const, stiffness: 250, damping: 25, mass: 0.5 };

const TOPIC_SUGGESTIONS = [
  "Quantum Computing",
  "AI in Healthcare",
  "Renewable Energy",
  "Large Language Models",
];

type AppMode = "generate" | "review" | "compare";
type ViewState = "setup" | "running" | "done";

export default function HomePage() {
  const [logoText, setLogoText] = useState("");
  const [selectedMode, setSelectedMode] = useState<AppMode>("generate");
  const [viewState, setViewState] = useState<ViewState>("setup");
  const [showDocs, setShowDocs] = useState(false);

  // Inputs
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Verification & Local Errors
  const [localError, setLocalError] = useState("");
  const [errorCount, setErrorCount] = useState(0); // to trigger shake animation
  const [countdown, setCountdown] = useState<number | null>(null);

  // Review mode states
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Compare mode transition
  const [showCompareModal, setShowCompareModal] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // SSE hook
  const {
    steps,
    report,
    feedback,
    comparison,
    error: sseError,
    isLoading: sseLoading,
    retryAfter,
    logs,
    startGenerate,
    startCompare,
    reset: resetSSE,
  } = useSSE();

  // Typewriter logo animation
  useEffect(() => {
    const fullText = "NEXUS(Multi Ai Research Agent)";
    setLogoText(""); // Reset text on mount
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setLogoText(fullText.substring(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
      }
    }, 150); // slightly faster
    return () => clearInterval(timer);
  }, []);

  // Sync Rate Limit Countdown
  useEffect(() => {
    if (retryAfter !== null) {
      setCountdown(retryAfter);
    } else {
      setCountdown(null);
    }
  }, [retryAfter]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Scroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, viewState]);

  // Sync view state when SSE completes
  useEffect(() => {
    if (viewState === "running" && !sseLoading && (report || comparison) && !sseError) {
      setViewState("done");
    }
  }, [sseLoading, report, comparison, sseError, viewState]);

  const triggerShake = () => {
    setErrorCount((c) => c + 1);
  };

  const handleStartGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setLocalError("Please enter a research topic.");
      triggerShake();
      return;
    }
    setLocalError("");
    setViewState("running");
    startGenerate(topic);
  };

  const handleStartReview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file) {
      setLocalError("Please upload a report file first.");
      triggerShake();
      return;
    }

    setLocalError("");
    setReviewLoading(true);
    setReviewFeedback("");
    setViewState("running");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/review`, {
        method: "POST",
        body: formData,
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const retrySecs = data.retry_after || 60;
        setCountdown(retrySecs);
        throw new Error("Rate limit reached. Please try again after the countdown.");
      }

      if (!response.ok) {
        const errText = await response.json().catch(() => ({ detail: "Review failed" }));
        throw new Error(errText.detail || "Failed to review the report.");
      }

      const data = await response.json();
      setReviewFeedback(data.feedback);
      setViewState("done");
    } catch (err: any) {
      setLocalError(err.message || "Connection failed.");
      setViewState("setup");
      triggerShake();
    } finally {
      setReviewLoading(false);
    }
  };

  const handleStartCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setLocalError("Please enter the topic to compare.");
      triggerShake();
      return;
    }
    if (!file) {
      setLocalError("Please upload your report file.");
      triggerShake();
      return;
    }

    setLocalError("");
    setViewState("running");
    startCompare(topic, file);
  };

  const handleReset = () => {
    resetSSE();
    setTopic("");
    setFile(null);
    setReviewFeedback("");
    setViewState("setup");
    setLocalError("");
    setShowCompareModal(false);
  };

  const triggerCompareFromActionBar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setLocalError("Please upload a report file.");
      return;
    }
    setShowCompareModal(false);
    setViewState("running");
    startCompare(topic, file);
  };

  const activeError = localError || sseError;
  const activeLoading = sseLoading || reviewLoading;

  // Find active step information to feed the central orbital sphere
  const getActiveAgentInfo = (): { agent: AgentType | null; status: StepStatus | null } => {
    if (viewState !== "running") return { agent: null, status: null };
    if (selectedMode === "review") return { agent: "critic", status: "running" };

    const activeStep = steps.find((s) => s.status === "running");
    if (activeStep) {
      return { agent: activeStep.agent, status: "running" };
    }
    // Check if the writer completed but critic hasn't started yet
    const lastDoneStep = [...steps].reverse().find((s) => s.status === "done");
    if (lastDoneStep) {
      return { agent: lastDoneStep.agent, status: "done" };
    }
    return { agent: null, status: null };
  };

  const { agent: currentAgent, status: currentStatus } = getActiveAgentInfo();

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 md:px-8 py-6 overflow-x-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 -z-50 overflow-hidden bg-bg">
        <div
          className="absolute -top-[40%] -left-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-accent/15 to-indigo-500/5 blur-[120px] animate-pulse-glow"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute -bottom-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-bl from-blue-500/5 to-accent/15 blur-[120px] animate-pulse-glow"
          style={{ animationDuration: "15s" }}
        />
      </div>

      {/* DASHBOARD GRID SYSTEM (Shown for Setup and Running views) */}
      <AnimatePresenceFramer mode="wait">
        {viewState !== "done" ? (
          <motionFramer.div
            key="dashboard-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={smoothTransition}
            className="w-full max-w-7xl flex-1 flex flex-col space-y-8 py-4"
          >
            {/* Top Navbar */}
            <header className="flex items-center justify-between pb-4 border-b border-border-custom">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-widest text-text">
                  {logoText}
                </span>
              </div>
              <nav className="flex items-center space-x-6 text-xs font-bold text-text-muted select-none">
                <span
                  onClick={handleReset}
                  className="text-text hover:text-accent cursor-pointer transition-colors"
                >
                  Home
                </span>
                <span
                  onClick={() => setShowDocs(true)}
                  className="hover:text-accent cursor-pointer transition-colors"
                >
                  Docs
                </span>
              </nav>
              <div className="w-16" /> {/* Spacer replacement for sign-in option */}
            </header>

            {/* Dashboard Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN (branding, key metrics, workflow) */}
              <div className="lg:col-span-4 flex flex-col space-y-6">
                
                {/* Hero Headers */}
                <div className="space-y-3 text-left">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-[9px] font-black uppercase tracking-widest text-accent">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>AI-Powered Research OS</span>
                  </div>
                  <h2 className="text-3xl font-black leading-tight tracking-tight text-text">
                    AI Research. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-cyan-400">
                      Reimagined.
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted leading-relaxed">
                    NEXUS orchestrates a sequence of specialized AI agents to autonomously search, read, write, and critique comprehensive literature reviews, delivering deep insights faster and smarter.
                  </p>
                </div>

                {/* Primary Trigger Buttons (Setup view only - watch demo removed) */}
                {viewState === "setup" && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        const target = document.getElementById("search-input");
                        target?.focus();
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-accent/15"
                    >
                      <span>Start Research</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Left Mini Stats (Updated with project records) */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Search Scope", value: "10 Results" },
                    { label: "Active Agents", value: "4 Sequential" },
                    { label: "Report Sections", value: "12 Structured" },
                  ].map((stat, sIdx) => (
                    <div key={sIdx} className="bg-card/40 border border-border-custom/50 p-2.5 rounded-xl text-center">
                      <p className="text-xs font-black text-text">{stat.value}</p>
                      <p className="text-[9px] text-text-muted mt-0.5 leading-tight">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* How MRLA Works */}
                <div className="bg-card/30 border border-border-custom/50 rounded-2xl p-4 flex flex-col">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-3 text-left">
                    How NEXUS Works
                  </h4>
                  <div className="flex items-center justify-between text-center relative select-none">
                    {[
                      { step: "Search", label: "Tavily Query" },
                      { step: "Read", label: "Scrape Content" },
                      { step: "Analyze", label: "Draft Markdown" },
                      { step: "Critique", label: "Evaluate score" },
                    ].map((w, wIdx) => (
                      <React.Fragment key={wIdx}>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full border border-border-custom bg-card flex items-center justify-center text-xs font-bold text-accent">
                            {wIdx + 1}
                          </div>
                          <span className="text-[9px] font-bold text-text mt-1.5">{w.step}</span>
                        </div>
                        {wIdx < 3 && (
                          <ChevronRight className="w-3.5 h-3.5 text-border-custom shrink-0 mt-[-16px]" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

              </div>

              {/* CENTER COLUMN (Orbital Sphere & Input/Stream Forms) */}
              <div className="lg:col-span-5 flex flex-col items-center space-y-6">
                
                {/* 1. Dynamic Orbital Sphere Core */}
                <OrbitalSphere activeAgent={currentAgent} activeStatus={currentStatus} />

                {/* 2. Unified Card (Topic search / logs / suggestions) */}
                <motionFramer.div
                  layout
                  key={errorCount}
                  className={`w-full bg-card/65 border border-border-custom rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md ${
                    activeError ? "animate-shake border-rose-500/40" : ""
                  }`}
                >
                  <AnimatePresenceFramer mode="wait">
                    {viewState === "setup" ? (
                      // Search View Form
                      <motionFramer.div
                        key="search-form"
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.2 } }}
                        transition={smoothTransition}
                        className="space-y-4"
                      >
                        {/* Tab mode selection */}
                        <div className="flex items-center space-x-1 bg-bg/50 border border-border-custom/40 p-1 rounded-xl w-fit">
                          {[
                            { id: "generate", label: "Generate", icon: Search },
                            { id: "review", label: "Review My Report", icon: FileText },
                            { id: "compare", label: "Compare", icon: Scale },
                          ].map((tab) => {
                            const TabIcon = tab.icon;
                            const active = selectedMode === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMode(tab.id as AppMode);
                                  setLocalError("");
                                }}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                  active
                                    ? "bg-accent text-white shadow-sm"
                                    : "text-text-muted hover:text-text"
                                }`}
                              >
                                <TabIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{tab.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Suggested Topic pills */}
                        {selectedMode !== "review" && (
                          <div className="flex flex-wrap gap-2 text-left">
                            <span className="text-[10px] font-bold text-text-muted mt-1 mr-1">
                              Try these:
                            </span>
                            {TOPIC_SUGGESTIONS.map((pill) => (
                              <button
                                key={pill}
                                type="button"
                                onClick={() => {
                                  setTopic(pill);
                                  setLocalError("");
                                }}
                                className="text-[10px] px-2.5 py-1 rounded-full border border-border-custom bg-card/45 text-text-muted hover:border-accent hover:text-accent transition-colors"
                              >
                                {pill}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Conditional Inputs */}
                        {selectedMode === "generate" && (
                          <form onSubmit={handleStartGenerate} className="space-y-4">
                            <div className="flex flex-col space-y-1.5 text-left">
                              <label htmlFor="search-input" className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                                What do you want to research?
                              </label>
                              <div className="relative">
                                <input
                                  id="search-input"
                                  type="text"
                                  value={topic}
                                  onChange={(e) => setTopic(e.target.value)}
                                  placeholder="Enter any research topic (e.g. Climate Change, AI in Healthcare)..."
                                  className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-border-custom bg-bg/50 text-text placeholder:text-text-muted/50 transition-all duration-200 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 focus:animate-border-glow"
                                />
                                <button
                                  type="submit"
                                  className="absolute right-2 top-2 p-2 bg-accent text-white rounded-lg hover:brightness-110 active:scale-95 transition-all"
                                  aria-label="Submit search"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </form>
                        )}

                        {selectedMode === "review" && (
                          <form onSubmit={handleStartReview} className="space-y-4">
                            <div className="flex flex-col space-y-1.5 text-left">
                              <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                                Upload custom draft report
                              </label>
                              <FileUpload
                                onFileSelect={setFile}
                                selectedFile={file}
                                allowedExtensions={[".docx"]}
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-accent text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-accent/20"
                            >
                              <FileSearch className="w-4 h-4" />
                              <span>Review Draft Report</span>
                            </button>
                          </form>
                        )}

                        {selectedMode === "compare" && (
                          <form onSubmit={handleStartCompare} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                              <div className="flex flex-col space-y-1.5">
                                <label htmlFor="compare-input" className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                                  Topic Cover
                                </label>
                                <input
                                  id="compare-input"
                                  type="text"
                                  value={topic}
                                  onChange={(e) => setTopic(e.target.value)}
                                  placeholder="e.g. Electric Vehicles..."
                                  className="w-full px-4 py-3 rounded-xl border border-border-custom bg-bg/50 text-text placeholder:text-text-muted/50 transition-all focus:outline-none focus:border-accent"
                                />
                              </div>
                              <div className="flex flex-col space-y-1.5">
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                                  Report File (.docx / .pdf)
                                </label>
                                <FileUpload
                                  onFileSelect={setFile}
                                  selectedFile={file}
                                  allowedExtensions={[".docx", ".pdf"]}
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-accent text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-accent/20"
                            >
                              <Scale className="w-4 h-4" />
                              <span>Run Comparison</span>
                            </button>
                          </form>
                        )}
                      </motionFramer.div>
                    ) : (
                      // Running View Log Console
                      <motionFramer.div
                        key="log-console"
                        initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(4px)" }}
                        transition={smoothTransition}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-border-custom/30 pb-2 text-text-muted font-mono text-[10px]">
                          <div className="flex items-center space-x-2">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Pipeline Live Output Logs</span>
                          </div>
                          <span className="text-[8px] bg-accent/15 px-2 py-0.5 rounded text-accent animate-pulse font-extrabold uppercase tracking-widest">
                            STREAMING
                          </span>
                        </div>
                        <div className="bg-[#040409] border border-border-custom/40 rounded-xl p-3.5 h-56 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed text-zinc-300 text-left whitespace-pre-wrap select-text">
                          {logs ? (
                            logs
                          ) : (
                            <span className="text-text-muted">
                              {selectedMode === "review"
                                ? "[SYSTEM]: Reading file upload buffer...\n[SYSTEM]: Submitting report contents to Critic Agent..."
                                : "[SYSTEM]: Preparing pipelines.\n[SYSTEM]: Sending query string to Search Agent..."}
                            </span>
                          )}
                          <div ref={logsEndRef} />
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={handleReset}
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-border-custom bg-card hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-[10px] font-bold text-text-muted transition-all duration-200"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Cancel Execution</span>
                          </button>
                        </div>
                      </motionFramer.div>
                    )}
                  </AnimatePresenceFramer>

                  {/* Errors and countdowns */}
                  <AnimatePresenceFramer>
                    {activeError && (
                      <motionFramer.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ type: "spring" as const, bounce: 0.2, duration: 0.5 }}
                        className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] flex flex-col space-y-2 text-left"
                      >
                        <div className="font-semibold">{activeError}</div>
                        {countdown !== null && (
                          <div className="font-mono text-center py-1 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                            Retry available in: <span className="font-black text-sm">{countdown}s</span>
                          </div>
                        )}
                      </motionFramer.div>
                    )}
                  </AnimatePresenceFramer>
                </motionFramer.div>

              </div>

              {/* RIGHT COLUMN (Progress Timelines) - Knowledge graph removed */}
              <div className="lg:col-span-3">
                
                {/* Research Progress Panel */}
                <div className="w-full bg-card border border-border-custom rounded-2xl p-5 shadow-md flex flex-col text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-border-custom/50 mb-4 select-none">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <h4 className="text-xs font-bold text-text">Research Status</h4>
                    </div>
                    {viewState === "running" && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                      </span>
                    )}
                  </div>

                  {/* Timeline Tracker */}
                  <div className="space-y-4">
                    {[
                      { id: "search", label: "Search Agent", desc: "Crawls Tavily search index" },
                      { id: "reader", label: "Reader Agent", desc: "Scrapes clean text buffers" },
                      { id: "writer", label: "Writer Agent", desc: "Drafts the 12-section layout" },
                      { id: "critic", label: "Critic Agent", desc: "Analyzes and grades draft" },
                    ].map((step, sIdx) => {
                      const apiStep = steps.find((s) => s.agent === step.id);
                      const isIdle = viewState === "setup" || !apiStep || apiStep.status === "idle";
                      const isRunning = viewState === "running" && apiStep?.status === "running";
                      const isDone = viewState === "running" && apiStep?.status === "done";
                      const isFailed = viewState === "running" && apiStep?.status === "failed";

                      return (
                        <div key={step.id} className="flex items-center space-x-3">
                          {/* Dot status */}
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black shrink-0 transition-colors duration-300 ${
                              isIdle
                                ? "border-border-custom bg-card text-text-muted opacity-50"
                                : isRunning
                                ? "border-accent bg-accent/25 text-accent animate-pulse"
                                : isDone
                                ? "border-success bg-success/20 text-success"
                                : "border-rose-500 bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : isRunning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              sIdx + 1
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold transition-all duration-300 ${isIdle ? "text-text-muted opacity-50" : "text-text"}`}>
                              {step.label}
                            </p>
                            <p className="text-[9px] text-text-muted truncate select-none leading-none mt-0.5">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom real project metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-border-custom pt-6 select-none">
              {[
                { label: "Max URLs Scraped", value: "5 Sources" },
                { label: "Active AI Agents", value: "4 Agents" },
                { label: "Report layout", value: "12 Sections" },
                { label: "Search Engine", value: "Tavily API" },
              ].map((metric, mIdx) => (
                <div key={mIdx} className="bg-card/20 p-4 border border-border-custom/40 rounded-xl text-center shadow-inner">
                  <p className="text-xl font-black text-text">{metric.value}</p>
                  <p className="text-[10px] font-bold text-text-muted tracking-wider uppercase mt-1">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Agent Workflow textual indicator (Testimonial mockup removed) */}
            <div className="w-full max-w-2xl mx-auto text-center select-none py-2 border border-border-custom/30 bg-card/30 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Pipeline: Search Agent (Tavily) <span className="text-accent">→</span> Reader Agent (HTML Scrape) <span className="text-accent">→</span> Writer Agent (Llama 3.3) <span className="text-accent">→</span> Critic Agent (Grade feedback)
              </p>
            </div>

          </motionFramer.div>
        ) : (
          // DONE STATE REPORT SCREEN (slides in as overlay)
          <motionFramer.div
            key="done-view-screen"
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            transition={{ type: "spring" as const, stiffness: 200, damping: 25, mass: 0.8 }}
            className="w-full max-w-6xl flex-1 flex flex-col py-6 pb-24"
          >
            {selectedMode === "review" ? (
              // Review mode done: centered critic feedback
              <div className="max-w-2xl mx-auto w-full">
                <CriticPanel
                  feedback={reviewFeedback}
                  onReRun={() => handleStartReview()}
                  isLoading={reviewLoading}
                />
              </div>
            ) : (
              // Generate or Compare: split layout
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Report Viewer */}
                <div className="lg:col-span-8">
                  {report ? (
                    <ReportViewer report={report} topic={topic} />
                  ) : (
                    <div className="bg-card border border-border-custom rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                      <FileText className="w-12 h-12 text-text-muted mb-3" />
                      <p className="text-sm font-semibold text-text">No Report Generated</p>
                    </div>
                  )}
                </div>

                {/* Right Evaluation Sidebar */}
                <div className="lg:col-span-4 lg:sticky lg:top-20">
                  {selectedMode === "compare" && comparison ? (
                    <ComparePanel comparison={comparison} />
                  ) : feedback ? (
                    <CriticPanel feedback={feedback} />
                  ) : null}
                </div>

              </div>
            )}

            {/* Done View Floating Action Bar */}
            <motionFramer.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-card/85 backdrop-blur-md border border-border-custom/95 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3"
            >
              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-border-custom bg-card hover:bg-bg text-xs font-bold text-text transition-all duration-200 hover:-translate-y-[2px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Research</span>
              </button>

              {selectedMode === "generate" && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-accent bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold transition-all duration-200 hover:-translate-y-[2px]"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare with my report</span>
                </button>
              )}

              {report && (
                <button
                  onClick={async () => {
                    const response = await fetch(`${API_BASE_URL}/api/download`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: report, topic }),
                    });
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${topic.replace(/\s+/g, "_").toLowerCase()}_report.docx`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    }
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-accent text-white hover:brightness-110 text-xs font-bold transition-all duration-200 hover:-translate-y-[2px] shadow-sm shadow-accent/10"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              )}
            </motionFramer.div>
          </motionFramer.div>
        )}
      </AnimatePresenceFramer>

      {/* Docs Modal Overlay */}
      <AnimatePresenceFramer>
        {showDocs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motionFramer.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocs(false)}
              className="absolute inset-0 bg-[#000000]/70 backdrop-blur-sm"
            />
            <motionFramer.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-2xl bg-card border border-border-custom rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar text-left"
            >
              <div className="flex items-center justify-between border-b border-border-custom/50 pb-3 mb-4">
                <h3 className="text-base font-bold text-text flex items-center space-x-2">
                  <BookMarked className="w-5 h-5 text-accent" />
                  <span>NEXUS Documentation</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDocs(false)}
                  className="p-1 rounded-full text-text-muted hover:text-text hover:bg-card/85"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-text-muted leading-relaxed">
                <section className="space-y-1.5">
                  <h4 className="text-sm font-bold text-text">Overview</h4>
                  <p>
                    NEXUS (Multi AI Research Agent) is a LangChain-based AI research pipeline.
                    It orchestrates multiple intelligent agents sequentially to explore queries, scrape raw contents, 
                    synthesize documents, and critique quality reviews.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-text">Agent Architecture</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <strong className="text-text">Search Agent (🔍):</strong> Executes the query string directly against
                      the <strong className="text-text">Tavily API</strong> search indexes to collect the top 10 relevant website
                      results (Titles, URLs, Snippets) without paraphrasing.
                    </li>
                    <li>
                      <strong className="text-text">Reader Agent (📖):</strong> Extracts deduplicated links from search outputs,
                      scrapes raw HTML body text from up to <strong className="text-text">5 source URLs</strong>, separates scripts/nav/footers,
                      and caps context chunks to 8,000 characters to prevent LLM rate blowups.
                    </li>
                    <li>
                      <strong className="text-text">Writer Agent (✍️):</strong> Takes the gathered research blobs and drafts a highly analytical
                      document following an exact <strong className="text-text">12-section layout</strong> structure. Powered by
                      the <strong className="text-text">Llama 3.3 70B</strong> versatile LLM model via Groq API.
                    </li>
                    <li>
                      <strong className="text-text">Critic Agent (🧠):</strong> Strictly reviews the generated markdown report,
                      grading it on a scale of 10, highlighting strengths, detailing improvement fields, and presenting a verdict.
                    </li>
                  </ol>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-sm font-bold text-text">Modes of Operation</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-text">Generate:</strong> Full sequential pipeline (Search → Read → Write → Critique) on a search query.</li>
                    <li><strong className="text-text">Review My Report:</strong> Bypasses web search. Immediately submits an uploaded draft file (`.docx`) to the Critic Agent for evaluation.</li>
                    <li><strong className="text-text">Compare Reports:</strong> Generates the AI report first, parses your uploaded report (`.docx` / `.pdf`), and submits both to the Critic Judge to score both and determine a winner with rationale.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="text-sm font-bold text-text">Downloads</h4>
                  <p>
                    All research layouts can be compiled directly in-memory and downloaded as styled Word files (`.docx`) using the floating action bar controls.
                  </p>
                </section>
              </div>

              <div className="flex justify-end pt-4 mt-6 border-t border-border-custom/50">
                <button
                  type="button"
                  onClick={() => setShowDocs(false)}
                  className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110 transition-all"
                >
                  Close
                </button>
              </div>
            </motionFramer.div>
          </div>
        )}
      </AnimatePresenceFramer>

      {/* Compare Modal Overlay */}
      <AnimatePresenceFramer>
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motionFramer.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompareModal(false)}
              className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
            />
            <motionFramer.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-card border border-border-custom rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <h3 className="text-base font-bold text-text mb-2 flex items-center space-x-1.5">
                <Scale className="w-5 h-5 text-accent" />
                <span>Compare with your own report</span>
              </h3>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                Upload your literature review report file to run a comparison against the AI report we generated for:
                <span className="font-semibold text-text ml-1 block mt-0.5 truncate bg-bg/50 px-2 py-1 rounded">
                  &ldquo;{topic}&rdquo;
                </span>
              </p>

              <form onSubmit={triggerCompareFromActionBar} className="space-y-4">
                <FileUpload
                  onFileSelect={setFile}
                  selectedFile={file}
                  allowedExtensions={[".docx", ".pdf"]}
                />
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(false)}
                    className="px-4 py-2 rounded-xl border border-border-custom hover:bg-bg text-xs font-semibold text-text-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!file}
                    className="px-4 py-2 rounded-xl bg-accent text-white font-bold hover:brightness-110 text-xs disabled:opacity-50"
                  >
                    Compare Now
                  </button>
                </div>
              </form>
            </motionFramer.div>
          </div>
        )}
      </AnimatePresenceFramer>

    </div>
  );
}
