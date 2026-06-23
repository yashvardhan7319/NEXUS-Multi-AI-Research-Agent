"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, PenTool, Check, Loader2, AlertCircle, Award } from "lucide-react";
import { PipelineStep, AgentType, StepStatus } from "@/hooks/useSSE";

interface PipelineTrackerProps {
  steps: PipelineStep[];
}

const AGENT_DETAILS = {
  search: {
    title: "Search Agent",
    description: "Queries Tavily Search to gather relevant web resources.",
    icon: Search,
  },
  reader: {
    title: "Reader Agent",
    description: "Scrapes and parses clean text content from top URLs.",
    icon: BookOpen,
  },
  writer: {
    title: "Writer Agent",
    description: "Synthesizes data into a detailed 12-section draft.",
    icon: PenTool,
  },
  critic: {
    title: "Critic Agent",
    description: "Evaluates the draft and produces feedback + score.",
    icon: Award,
  },
};

export default function PipelineTracker({ steps }: PipelineTrackerProps) {
  // Return line status based on step indices
  const getLineClass = (index: number) => {
    const current = steps[index];
    const next = steps[index + 1];

    if (!next) return "bg-border-custom";

    if (next.status === "running" || next.status === "done") {
      return "bg-success transition-all duration-700 h-full"; // Green completed line
    }
    if (current.status === "done") {
      return "bg-accent animate-pulse transition-all duration-500 h-full"; // Active running line (purple)
    }
    return "bg-border-custom h-full"; // Idle gray line
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto py-4">
      <div className="relative flex flex-col space-y-8">
        {steps.map((step, index) => {
          const details = AGENT_DETAILS[step.agent];
          const Icon = details.icon;
          const isIdle = step.status === "idle";
          const isRunning = step.status === "running";
          const isDone = step.status === "done";
          const isFailed = step.status === "failed";

          return (
            <div key={step.agent} className="relative flex items-start group">
              {/* Connector Line (drawn except for last step) */}
              {index < steps.length - 1 && (
                <div className="absolute left-[22px] top-11 bottom-[-32px] w-[3px] bg-border-custom -z-10 rounded">
                  <div className={getLineClass(index)} />
                </div>
              )}

              {/* Icon Node */}
              <motion.div
                initial={false}
                animate={
                  isRunning
                    ? { scale: 1.05, boxShadow: "0 0 20px rgba(108, 71, 255, 0.4)" }
                    : { scale: 1, boxShadow: "0 0 0px rgba(0,0,0,0)" }
                }
                transition={{ duration: 0.2 }}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 shrink-0 z-10 transition-colors duration-300 ${
                  isIdle
                    ? "border-border-custom bg-card text-text-muted opacity-60"
                    : isRunning
                    ? "border-accent bg-accent/10 text-accent animate-pulse-glow"
                    : isDone
                    ? "border-success bg-success/15 text-success"
                    : "border-rose-500 bg-rose-500/10 text-rose-500 animate-shake"
                }`}
              >
                {isDone ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <motion.path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </svg>
                ) : isRunning ? (
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    <Loader2 className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 animate-spin text-accent" />
                  </div>
                ) : isFailed ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>

              {/* Step Card Content */}
              <div className="ml-5 flex-1 min-w-0">
                <div
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isIdle
                      ? "border-border-custom/50 bg-card/20 opacity-60"
                      : isRunning
                      ? "border-accent/50 bg-accent/5 shadow-sm shadow-accent/5"
                      : isDone
                      ? "border-success/30 bg-card/60"
                      : "border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text">{details.title}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isIdle
                          ? "bg-border-custom/30 text-text-muted"
                          : isRunning
                          ? "bg-accent/25 text-accent animate-pulse"
                          : isDone
                          ? "bg-success/20 text-success"
                          : "bg-rose-500/20 text-rose-500"
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted mt-1">{details.description}</p>

                  <AnimatePresence>
                    {/* Live Preview / Status message */}
                    {isRunning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 text-xs text-accent/80 font-medium flex items-center space-x-1.5"
                      >
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </span>
                        <span>Agent is working...</span>
                      </motion.div>
                    )}

                    {isDone && step.content && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 bg-bg/50 border border-border-custom/40 p-2.5 rounded-lg text-xs font-mono text-text-muted max-h-20 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-none"
                      >
                        {step.content.substring(0, 100)}
                        {step.content.length > 100 && "..."}
                      </motion.div>
                    )}

                    {isFailed && step.content && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-lg text-xs font-mono text-rose-500"
                      >
                        {step.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
