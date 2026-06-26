"use client";

import React, { useState } from "react";
import API_BASE_URL from "@/config/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Copy, Download, Link2, Check } from "lucide-react";

interface ReportViewerProps {
  report: string;
  topic: string;
}

interface Section {
  number: number;
  title: string;
  content: string;
}

// Map section numbers to design tokens
const getSectionTheme = (num: number) => {
  if ([3, 6, 7].includes(num)) {
    return {
      border: "border-l-4 border-l-purple-500",
      accent: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/5 dark:bg-purple-500/10",
      bgHover: "hover:bg-purple-500/10 dark:hover:bg-purple-500/20",
      glow: "shadow-purple-500/5",
    };
  }
  if ([1, 2, 5].includes(num)) {
    return {
      border: "border-l-4 border-l-blue-500",
      accent: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/5 dark:bg-blue-500/10",
      bgHover: "hover:bg-blue-500/10 dark:hover:bg-blue-500/20",
      glow: "shadow-blue-500/5",
    };
  }
  if (num === 10) {
    return {
      border: "border-l-4 border-l-green-500",
      accent: "text-green-500 dark:text-green-400",
      bg: "bg-green-500/5 dark:bg-green-500/10",
      bgHover: "hover:bg-green-500/10 dark:hover:bg-green-500/20",
      glow: "shadow-green-500/5",
    };
  }
  if (num === 8) {
    return {
      border: "border-l-4 border-l-orange-500",
      accent: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-500/5 dark:bg-orange-500/10",
      bgHover: "hover:bg-orange-500/10 dark:hover:bg-orange-500/20",
      glow: "shadow-orange-500/5",
    };
  }
  // Default Gray
  return {
    border: "border-l-4 border-l-slate-400 dark:border-l-slate-500",
    accent: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/5 dark:bg-slate-500/10",
    bgHover: "hover:bg-slate-500/10 dark:hover:bg-slate-500/20",
    glow: "shadow-slate-500/5",
  };
};

export default function ReportViewer({ report, topic }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: true, // open first section by default
  });

  const parseReport = (md: string): Section[] => {
    if (!md) return [];
    const sections: Section[] = [];
    const parts = md.split(/^##\s+/m);

    for (const part of parts) {
      if (!part.trim()) continue;
      const match = part.match(/^(\d+)\.\s+([^\n]+)\n([\s\S]*)/);
      if (match) {
        sections.push({
          number: parseInt(match[1], 10),
          title: match[2].trim(),
          content: match[3].trim(),
        });
      }
    }

    if (sections.length === 0) {
      // Fallback if markdown doesn't follow expected headers
      sections.push({
        number: 1,
        title: "Research Output",
        content: md,
      });
    }

    return sections;
  };

  const sections = parseReport(report);

  const toggleSection = (num: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [num]: !prev[num],
    }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report: ", err);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: report,
          topic,
        }),
      });

      if (!response.ok) throw new Error("Failed to download DOCX");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const safeTopic = topic.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").toLowerCase();
      a.download = `${safeTopic || "mrla_report"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  // Helper to format bold text and raw links in markdown body
  const renderTextContent = (text: string, sectionNumber: number) => {
    // 12. Sources handling - extract and show clickable chips
    if (sectionNumber === 12) {
      const urlRegex = /(https?:\/\/[^\s\)\],]+)/g;
      const urls = Array.from(new Set(text.match(urlRegex) || []));

      if (urls.length > 0) {
        return (
          <div className="flex flex-wrap gap-2.5 mt-2">
            {urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 hover:border-accent/40 transition-all duration-200"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="truncate max-w-xs">{url.replace(/^https?:\/\/(www\.)?/, "")}</span>
              </a>
            ))}
          </div>
        );
      }
    }

    const lines = text.split("\n");
    let insideList = false;
    let listItems: string[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-sm text-text/90">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseMarkdownFormat(item) }} />
            ))}
          </ul>
        );
        listItems = [];
        insideList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check if line is list item
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        insideList = true;
        listItems.push(trimmed.substring(2));
      } else {
        if (insideList) {
          flushList(`list-${index}`);
        }

        if (trimmed.startsWith("### ")) {
          elements.push(
            <h4 key={index} className="text-sm font-semibold text-text mt-3 mb-1">
              {trimmed.substring(4)}
            </h4>
          );
        } else if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          // Table parsing (very basic support for styling)
          const cells = trimmed.split("|").map(c => c.trim()).filter(c => c);
          if (trimmed.includes("---")) return; // skip header separator
          
          elements.push(
            <div key={index} className="overflow-x-auto my-2">
              <table className="min-w-full divide-y divide-border-custom border border-border-custom text-xs">
                <tbody>
                  <tr className="bg-card/50">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 font-medium border-r border-border-custom text-text/80">
                        {cell}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        } else if (trimmed === "") {
          elements.push(<div key={index} className="h-2" />);
        } else {
          elements.push(
            <p
              key={index}
              className="text-sm text-text/90 leading-relaxed my-1.5"
              dangerouslySetInnerHTML={{ __html: parseMarkdownFormat(trimmed) }}
            />
          );
        }
      }
    });

    if (insideList) {
      flushList("list-end");
    }

    return elements;
  };

  const parseMarkdownFormat = (str: string): string => {
    // Bold replace: **text** -> <strong>text</strong>
    let formatted = str.replace(/\*\*([^*]+)\*\*/g, "<strong class='font-semibold text-text'>$1</strong>");
    // Code replace: `code` -> <code class='px-1 py-0.5 rounded bg-bg text-rose-500 font-mono text-xs'>code</code>
    formatted = formatted.replace(/`([^`]+)`/g, "<code class='px-1 py-0.5 rounded bg-bg text-rose-500 font-mono text-xs'>$1</code>");
    return formatted;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  } as const;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 border-b border-border-custom">
        <h2 className="text-lg font-bold text-text truncate max-w-[200px] md:max-w-md">
          {topic}
        </h2>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border-custom bg-card hover:bg-bg text-xs font-semibold shadow-sm transition-all duration-200 text-text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success animate-scale" />
                <span className="text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border-custom bg-card hover:bg-bg text-xs font-semibold shadow-sm transition-all duration-200 text-text disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? "Downloading..." : "Word (.docx)"}</span>
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {sections.map((sec) => {
          const theme = getSectionTheme(sec.number);
          const isExpanded = !!expandedSections[sec.number];

          return (
            <motion.div
              key={sec.number}
              variants={itemVariants}
              className={`rounded-xl border border-border-custom bg-card/60 shadow-sm ${theme.border} transition-all duration-300 overflow-hidden ${theme.glow}`}
            >
              {/* Header Toggle Trigger */}
              <button
                onClick={() => toggleSection(sec.number)}
                className={`flex items-center justify-between w-full p-4 text-left transition-colors duration-200 ${theme.bgHover}`}
              >
                <div className="flex items-center space-x-3 pr-4">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${theme.bg} ${theme.accent}`}>
                    {sec.number.toString().padStart(2, "0")}
                  </span>
                  <h3 className="text-sm font-bold text-text truncate">
                    {sec.title}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-text-muted"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              {/* Collapsible Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-border-custom/30 bg-card/10 select-text">
                      {renderTextContent(sec.content, sec.number)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
