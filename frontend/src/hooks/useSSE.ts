"use client";

import { useState, useCallback, useRef } from "react";
import API_BASE_URL from "@/config/api";

export type AgentType = "search" | "reader" | "writer" | "critic";
export type StepStatus = "idle" | "running" | "done" | "failed";

export interface PipelineStep {
  agent: AgentType;
  status: StepStatus;
  content: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  { agent: "search", status: "idle", content: "" },
  { agent: "reader", status: "idle", content: "" },
  { agent: "writer", status: "idle", content: "" },
  { agent: "critic", status: "idle", content: "" },
];

export function useSSE() {
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [report, setReport] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [comparison, setComparison] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [logs, setLogs] = useState<string>("");

  const activeReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const reset = useCallback(() => {
    setSteps(JSON.parse(JSON.stringify(INITIAL_STEPS)));
    setReport("");
    setFeedback("");
    setComparison("");
    setError("");
    setLogs("");
    setRetryAfter(null);
    setIsLoading(false);
    if (activeReaderRef.current) {
      activeReaderRef.current.cancel().catch(() => {});
      activeReaderRef.current = null;
    }
  }, []);

  const processStream = async (response: Response, onCompletion?: () => void) => {
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      const retrySecs = data.retry_after || 60;
      setRetryAfter(retrySecs);
      setError(`Rate limit hit. Please try again after the countdown.`);
      setIsLoading(false);
      return;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      setError(errText || `Server returned error ${response.status}`);
      setIsLoading(false);
      return;
    }

    if (!response.body) {
      setError("No readable stream in response");
      setIsLoading(false);
      return;
    }

    const reader = response.body.getReader();
    activeReaderRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // save incomplete line for next iteration

        let currentEvent = "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("event:")) {
            currentEvent = trimmed.substring(6).trim();
          } else if (trimmed.startsWith("data:")) {
            const rawData = trimmed.substring(5).trim();
            try {
              const parsedData = JSON.parse(rawData);
              
              if (currentEvent === "step") {
                const { agent, status, content } = parsedData as {
                  agent: AgentType;
                  status: StepStatus;
                  content: string;
                };

                setSteps((prev) =>
                  prev.map((s) => {
                    if (s.agent === agent) {
                      return { agent, status, content };
                    }
                    // If a step completed, mark previous steps as done if they aren't already
                    if (
                      (agent === "reader" && s.agent === "search") ||
                      (agent === "writer" && (s.agent === "search" || s.agent === "reader")) ||
                      (agent === "critic" && s.agent !== "critic")
                    ) {
                      if (s.status !== "done") {
                        return { ...s, status: "done" };
                      }
                    }
                    return s;
                  })
                );

                // Update logs
                const timestamp = new Date().toLocaleTimeString();
                const logHeader = `[${timestamp}] [${agent.toUpperCase()} AGENT - ${status.toUpperCase()}]:`;
                if (status === "running") {
                  setLogs((l) => l + `${logHeader} ${content}\n`);
                } else if (status === "done") {
                  setLogs((l) => l + `${logHeader} Step complete. Preview:\n${content.substring(0, 300)}...\n\n`);
                }
              } else if (currentEvent === "report") {
                setReport(parsedData.report || "");
                setFeedback(parsedData.feedback || "");
                setLogs((l) => l + `[SYSTEM]: Report generated & reviewed successfully!\n`);
              } else if (currentEvent === "ai_report") {
                setReport(parsedData.report || "");
                setLogs((l) => l + `[SYSTEM]: AI reference report generated for comparison.\n`);
              } else if (currentEvent === "comparison") {
                setComparison(parsedData.comparison || "");
                setReport(parsedData.ai_report || "");
                setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
                setLogs((l) => l + `[SYSTEM]: Comparison report completed.\n`);
              } else if (currentEvent === "error") {
                setError(parsedData.message || "An unexpected pipeline error occurred.");
                setSteps((prev) =>
                  prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s))
                );
                setLogs((l) => l + `[ERROR]: ${parsedData.message || "Error during execution."}\n`);
              }
            } catch (err) {
              console.error("Failed to parse SSE event JSON data", err, rawData);
            }
          }
        }
      }
      if (onCompletion) onCompletion();
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Connection failed or was interrupted.");
        setLogs((l) => l + `[ERROR]: Stream interrupted.\n`);
      }
    } finally {
      setIsLoading(false);
      activeReaderRef.current = null;
    }
  };

  const startGenerate = useCallback(
    async (topic: string) => {
      reset();
      setIsLoading(true);
      setLogs(`[SYSTEM]: Initializing multi-agent research pipeline for topic: "${topic}"\n\n`);

      try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic }),
        });

        await processStream(response);
      } catch (err: any) {
        setError(err.message || "Failed to contact backend API.");
        setLogs((l) => l + `[ERROR]: Connection failed.\n`);
        setIsLoading(false);
      }
    },
    [reset]
  );

  const startCompare = useCallback(
    async (topic: string, file: File) => {
      reset();
      setIsLoading(true);
      setLogs(`[SYSTEM]: Starting comparison pipeline for topic: "${topic}"\n`);
      setLogs((l) => l + `[SYSTEM]: Uploaded report file: "${file.name}"\n\n`);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("topic", topic);

        const response = await fetch(`${API_BASE_URL}/api/compare`, {
          method: "POST",
          body: formData,
        });

        await processStream(response);
      } catch (err: any) {
        setError(err.message || "Failed to contact backend API.");
        setLogs((l) => l + `[ERROR]: Connection failed.\n`);
        setIsLoading(false);
      }
    },
    [reset]
  );

  return {
    steps,
    report,
    feedback,
    comparison,
    error,
    isLoading,
    retryAfter,
    logs,
    startGenerate,
    startCompare,
    reset,
  };
}
