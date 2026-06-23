"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, PenTool, Award, ShieldCheck, Sparkles } from "lucide-react";
import { AgentType, StepStatus } from "@/hooks/useSSE";

interface OrbitalSphereProps {
  activeAgent: AgentType | null;
  activeStatus: StepStatus | null;
}

export default function OrbitalSphere({ activeAgent, activeStatus }: OrbitalSphereProps) {
  const isAgentActive = (agent: AgentType) => {
    return activeAgent === agent && activeStatus === "running";
  };

  const getAgentColorClass = (agent: AgentType) => {
    if (isAgentActive(agent)) {
      return "border-accent text-accent shadow-accent/40 bg-accent/20 scale-105";
    }
    if (activeAgent && activeAgent !== agent) {
      return "border-border-custom/50 text-text-muted/50 opacity-40 bg-card/20";
    }
    return "border-border-custom text-text-muted bg-card/60 hover:border-accent/40";
  };

  return (
    <div className="relative w-full h-[360px] flex items-center justify-center select-none overflow-visible animate-float">
      {/* Glow Backplate */}
      <div className="absolute w-64 h-64 rounded-full bg-accent/5 blur-[80px] -z-10" />

      {/* Orbit 1 (Horizontal) */}
      <div className="absolute w-72 h-32 rounded-full border border-accent/20 rotate-[-15deg] transform-gpu animate-orbit-cw pointer-events-none">
        <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-accent/80 glow-accent shadow-md shadow-accent/50" />
      </div>

      {/* Orbit 2 (Vertical slanted) */}
      <div className="absolute w-44 h-72 rounded-full border border-indigo-500/10 rotate-[35deg] transform-gpu animate-orbit-ccw pointer-events-none">
        <div className="absolute top-1/2 -right-1.5 w-2 h-2 rounded-full bg-indigo-400/80 shadow-md shadow-indigo-500/50" />
      </div>

      {/* Orbit 3 (Diagonal) */}
      <div className="absolute w-64 h-64 rounded-full border border-cyan-500/10 rotate-[75deg] transform-gpu animate-orbit-cw pointer-events-none">
        <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-cyan-400/60 shadow-md shadow-cyan-500/50" />
      </div>

      {/* Central Core Sphere */}
      <div className="relative w-36 h-36 rounded-full flex items-center justify-center z-10">
        {/* Core Outer Pulse Ring */}
        <div className={`absolute inset-0 rounded-full border border-accent/30 animate-ping opacity-25 ${
          activeStatus === "running" ? "duration-1000" : "duration-[3000ms]"
        }`} />
        
        {/* Core Inner Glass Sphere */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-accent/25 via-[#0b0c16]/90 to-cyan-500/10 border border-accent/30 shadow-lg shadow-accent/15 flex items-center justify-center backdrop-blur-sm overflow-hidden">
          {/* Internal rotating light */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-accent/20 to-transparent animate-spin duration-[4s]" />
          
          <div className="relative flex flex-col items-center justify-center text-center p-2 z-20">
            <Sparkles className={`w-8 h-8 text-accent mb-1 ${
              activeStatus === "running" ? "animate-pulse" : ""
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-text">
              NEXUS Core
            </span>
          </div>
        </div>
      </div>

      {/* Floating Agent Nodes */}
      
      {/* 1. Search Agent (Top Left) */}
      <motion.div
        animate={isAgentActive("search") ? { scale: [1, 1.04, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`absolute top-6 left-6 md:-left-4 flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 z-20 ${getAgentColorClass("search")}`}
      >
        <div className={`w-2 h-2 rounded-full ${isAgentActive("search") ? "bg-accent animate-ping" : "bg-zinc-600"}`} />
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] font-bold tracking-wider">Search Agent</span>
      </motion.div>

      {/* 2. Reader Agent (Top Right) */}
      <motion.div
        animate={isAgentActive("reader") ? { scale: [1, 1.04, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`absolute top-16 right-4 md:-right-8 flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 z-20 ${getAgentColorClass("reader")}`}
      >
        <div className={`w-2 h-2 rounded-full ${isAgentActive("reader") ? "bg-cyan-400 animate-ping" : "bg-zinc-600"}`} />
        <BookOpen className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] font-bold tracking-wider">Reader Agent</span>
      </motion.div>

      {/* 3. Writer Agent (Bottom Left) */}
      <motion.div
        animate={isAgentActive("writer") ? { scale: [1, 1.04, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`absolute bottom-20 left-4 md:-left-8 flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 z-20 ${getAgentColorClass("writer")}`}
      >
        <div className={`w-2 h-2 rounded-full ${isAgentActive("writer") ? "bg-amber-400 animate-ping" : "bg-zinc-600"}`} />
        <PenTool className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] font-bold tracking-wider">Writer Agent</span>
      </motion.div>

      {/* 4. Critic Agent (Bottom Right) */}
      <motion.div
        animate={isAgentActive("critic") ? { scale: [1, 1.04, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`absolute bottom-10 right-6 md:-right-4 flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 z-20 ${getAgentColorClass("critic")}`}
      >
        <div className={`w-2 h-2 rounded-full ${isAgentActive("critic") ? "bg-emerald-400 animate-ping" : "bg-zinc-600"}`} />
        <Award className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] font-bold tracking-wider">Critic Agent</span>
      </motion.div>

      {/* 5. Citation/Sync Status Node (Top Center) */}
      <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-border-custom bg-card/60 text-[9px] font-extrabold tracking-widest text-text-muted transition-opacity duration-300 ${
        activeStatus === "running" ? "opacity-100 animate-pulse" : "opacity-70"
      }`}>
        <ShieldCheck className="w-3 h-3 text-accent" />
        <span>SECURE NODE</span>
      </div>
    </div>
  );
}
