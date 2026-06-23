"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Star, AlertCircle, Award, Scale, HelpCircle } from "lucide-react";

interface ComparePanelProps {
  comparison: string;
}

export default function ComparePanel({ comparison }: ComparePanelProps) {
  const [parsed, setParsed] = useState({
    scoreA: 0,
    scoreB: 0,
    strengthsA: [] as string[],
    strengthsB: [] as string[],
    differences: [] as string[],
    winner: "",
    reason: "",
  });

  useEffect(() => {
    const parseComparison = (text: string) => {
      let scoreA = 0;
      let scoreB = 0;
      const strengthsA: string[] = [];
      const strengthsB: string[] = [];
      const differences: string[] = [];
      let winner = "";
      let reason = "";

      if (!text) return { scoreA, scoreB, strengthsA, strengthsB, differences, winner, reason };

      const cleanText = text.replace(/\r\n/g, "\n");

      // Extract scores
      const scoreAMatch = cleanText.match(/Report A Score:\s*([\d\.]+)\/10/i);
      if (scoreAMatch) scoreA = parseFloat(scoreAMatch[1]);

      const scoreBMatch = cleanText.match(/Report B Score:\s*([\d\.]+)\/10/i);
      if (scoreBMatch) scoreB = parseFloat(scoreBMatch[1]);

      // Split sections by keywords
      const strengthsAMatch = cleanText.match(/Report A Strengths:([\s\S]*?)(Report B Strengths:|Key Differences:|Winner:|Reason:|$)/i);
      const strengthsBMatch = cleanText.match(/Report B Strengths:([\s\S]*?)(Key Differences:|Winner:|Reason:|Report A Strengths:|$)/i);
      const differencesMatch = cleanText.match(/Key Differences:([\s\S]*?)(Winner:|Reason:|$)/i);
      const winnerMatch = cleanText.match(/Winner:\s*([^\n]+)/i);
      const reasonMatch = cleanText.match(/Reason:\s*([\s\S]*)/i);

      const parseBullets = (sectionText: string) => {
        if (!sectionText) return [];
        return sectionText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("-") || line.startsWith("*"))
          .map((line) => line.replace(/^[\-\*\s]+/, "").trim());
      };

      if (strengthsAMatch && strengthsAMatch[1]) strengthsA.push(...parseBullets(strengthsAMatch[1]));
      if (strengthsBMatch && strengthsBMatch[1]) strengthsB.push(...parseBullets(strengthsBMatch[1]));
      if (differencesMatch && differencesMatch[1]) differences.push(...parseBullets(differencesMatch[1]));
      if (winnerMatch && winnerMatch[1]) winner = winnerMatch[1].trim();
      if (reasonMatch && reasonMatch[1]) reason = reasonMatch[1].trim();

      // Fallback
      if (strengthsA.length === 0 && strengthsB.length === 0 && !winner) {
        reason = text;
      }

      return { scoreA, scoreB, strengthsA, strengthsB, differences, winner, reason };
    };

    setParsed(parseComparison(comparison));
  }, [comparison]);

  const radius = 30;
  const circumference = 2 * Math.PI * radius; // 188.49

  return (
    <div className="w-full bg-card border border-border-custom rounded-2xl p-6 shadow-md flex flex-col">
      <div className="flex items-center space-x-2 pb-4 border-b border-border-custom w-full mb-6">
        <Scale className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-bold text-text">AI vs. User Report Comparison</h3>
      </div>

      {/* Side by side scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Report A */}
        <div className="flex flex-col items-center p-3 bg-accent/5 rounded-xl border border-accent/10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent mb-2">
            AI Report (A)
          </span>
          <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r={radius} stroke="var(--border-custom)" strokeWidth="6" fill="transparent" />
              <motion.circle
                cx="40"
                cy="40"
                r={radius}
                stroke="var(--accent)"
                strokeWidth="6"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (circumference * parsed.scoreA) / 10 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute text-lg font-black text-text">{parsed.scoreA}/10</span>
          </div>
        </div>

        {/* Report B */}
        <div className="flex flex-col items-center p-3 bg-card rounded-xl border border-border-custom">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted mb-2">
            Your Report (B)
          </span>
          <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r={radius} stroke="var(--border-custom)" strokeWidth="6" fill="transparent" />
              <motion.circle
                cx="40"
                cy="40"
                r={radius}
                stroke="var(--accent)"
                strokeWidth="6"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (circumference * parsed.scoreB) / 10 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute text-lg font-black text-text">{parsed.scoreB}/10</span>
          </div>
        </div>
      </div>

      {/* Winner Display */}
      {parsed.winner && (
        <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 shadow-inner text-center">
          <div className="flex items-center justify-center space-x-1.5 mb-1 text-amber-500">
            <Award className="w-5 h-5 animate-pulse" />
            <h4 className="text-xs font-black uppercase tracking-widest">
              Winner: Report {parsed.winner}
            </h4>
          </div>
          {parsed.reason && (
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              {parsed.reason}
            </p>
          )}
        </div>
      )}

      {/* Key Differences */}
      {parsed.differences.length > 0 && (
        <div className="w-full mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5 flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-accent" />
            <span>Key Differences</span>
          </h4>
          <ul className="space-y-2">
            {parsed.differences.map((diff, idx) => (
              <li key={idx} className="text-xs text-text/90 flex items-start space-x-2 leading-relaxed">
                <span className="text-accent select-none mt-0.5">•</span>
                <span>{diff}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths lists (A vs B) */}
      <div className="space-y-4">
        {parsed.strengthsA.length > 0 && (
          <div className="w-full text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
              AI Report (A) Strengths
            </h4>
            <ul className="space-y-1.5">
              {parsed.strengthsA.map((str, idx) => (
                <li key={idx} className="text-[11px] text-text/80 flex items-start space-x-1.5">
                  <span className="text-success select-none">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsed.strengthsB.length > 0 && (
          <div className="w-full text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Your Report (B) Strengths
            </h4>
            <ul className="space-y-1.5">
              {parsed.strengthsB.map((str, idx) => (
                <li key={idx} className="text-[11px] text-text/80 flex items-start space-x-1.5">
                  <span className="text-success select-none">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
