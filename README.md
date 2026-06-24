# NEXUS (Multi AI Research Agent)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**NEXUS** is an autonomous, full-stack AI research assistant. Imagine having a team of specialized researchers working for you around the clock. You simply give NEXUS a topic, and it deploys a swarm of AI agents to scour the live internet, read articles, extract facts, and synthesize everything into a beautifully structured, comprehensive literature review. It then uniquely grades its own work to ensure the highest quality output—saving you hours of manual research and writing.

---

## 🏗️ Architecture Diagram
Below is the high-level architecture of how the NEXUS frontend and backend interact:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#fff', 'primaryBorderColor': '#7C3AED', 'lineColor': '#8b5cf6', 'secondaryColor': '#0f172a', 'tertiaryColor': 'transparent', 'clusterBkg': 'transparent'}}}%%
flowchart TB
    classDef frontend fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef backend fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef agent fill:#1e1e2e,stroke:#a855f7,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef external fill:#27272a,stroke:#f59e0b,stroke-width:2px,color:#fff,stroke-dasharray: 5 5;

    subgraph Frontend [📱 Next.js UI Environment]
        UI[User Dashboard]:::frontend
        SSE[SSE Client Stream]:::frontend
    end

    subgraph Backend [⚙️ FastAPI Server Environment]
        API[⚡ FastAPI Router]:::backend
        Pipe[🔄 Pipeline Orchestrator]:::backend
        API ==>|Triggers Execution| Pipe
        
        subgraph Agents [🤖 LangChain Agent Swarm]
            SA[🔍 Search Agent]:::agent
            RA[📖 Reader Agent]:::agent
            WA[✍️ Writer Agent]:::agent
            CA[🧠 Critic Agent]:::agent
            
            Pipe --> SA
            SA ==>|Top 10 URLs| RA
            RA ==>|Clean Context| WA
            WA ==>|Draft Report| CA
        end
    end
    
    subgraph External [🌐 External APIs]
        Tavily[Tavily Search API]:::external
        Web[Live Websites]:::external
        Groq[Groq Llama-3 API]:::external
    end

    %% Connections
    UI -->|POST /api/generate| API
    API -.->|Streams JSON Chunks| SSE
    SA -->|Queries| Tavily
    RA -.->|Scrapes HTML| Web
    WA -->|Generates Markdown| Groq
    CA -->|Evaluates Quality| Groq
```

---

## 🤖 Agent Workflow

```mermaid
flowchart LR
    classDef search fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef reader fill:#0f172a,stroke:#a855f7,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef writer fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef critic fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff,rx:8,ry:8
    classDef user fill:#1e1e2e,stroke:#fff,stroke-width:2px,color:#fff,rx:20,ry:20

    U((👤 User)):::user
    S[🔍 Search Agent]:::search
    R[📖 Reader Agent]:::reader
    W[✍️ Writer Agent]:::writer
    C[🧠 Critic Agent]:::critic
    
    U -->|1. Submits Topic| S
    S -->|2. Finds 10 URLs| R
    R -->|3. Scrapes Content| W
    W -->|4. Drafts Report| C
    C -->|5. Grades & Reviews| U
```

---

## ✨ Features
- **Multi-Agent Orchestration**: Specialized LangChain agents working autonomously in sequence.
- **Real-Time Streaming**: Server-Sent Events (SSE) stream the pipeline progress live to the UI.
- **Review & Compare Modes**: Upload your own `.docx` or `.pdf` drafts to bypass the search phase and have the Critic Agent review or compare reports locally.
- **Stunning UI**: A dark-mode, glassmorphic Next.js interface with Framer Motion micro-animations and an interactive "Orbital Sphere".
- **Instant Report Generation**: Compiles the final LLM output into styled, in-memory Word (`.docx`) files for immediate download.

---

## 📸 Live Demo & Screenshots

### Live Video Demo
Watch NEXUS autonomously research, synthesize, and critique a topic in real-time.

<video src="assets/DEMO.mp4" controls width="100%"></video>

<br/>
### 1. Research Dashboard
The central hub for NEXUS. This sleek, dark-mode interface features a dynamic "Orbital Sphere" that animates as background agents perform their tasks. You can quickly select between Generate, Review, or Compare modes to start your workflow.

<img src="assets/1-dashboard.png" alt="Dashboard" width="800"/>

### 2. Live Report Generation
Once a topic is provided, the multi-agent swarm scours the web and generates a beautifully formatted 12-section literature review right before your eyes.

<img src="assets/2-generation.png" alt="Generation of Report" width="800"/>

### 3. Critic's Review Mode
Bypass the generation phase by uploading your own `.docx` or `.pdf` file. The Critic Agent strictly analyzes your writing, assigns a score out of 10, highlights strengths, and provides actionable feedback to improve your draft.

<img src="assets/3-review.png" alt="Critics Review" width="800"/>

### 4. Comparison Setup
Prepare to compare two reports side-by-side. Simply provide a research topic for NEXUS to generate a pristine AI report, and upload your own draft on the same topic for comparison.

<img src="assets/4-compare-setup.png" alt="Comparison Setup" width="800"/>

### 5. Final Comparison & Grading
The ultimate showdown. The Critic Agent compares your uploaded report against the AI-generated report, judging both on structure, credibility, and depth. It declares a winner, outlines key differences, and lets you download the winning report instantly!

<img src="assets/5-compare-result.png" alt="Comparison Result" width="800"/>

---

## 💻 Tech Stack
**Frontend:**
- Next.js 16 (App Router)
- React 19 & TypeScript
- Tailwind CSS (v4)
- Framer Motion (Animations)
- Lucide React (Icons)

**Backend:**
- Python 3.10+
- FastAPI & Uvicorn
- LangChain
- BeautifulSoup (Web Scraping)
- API Integrations: Groq (Llama 3), Tavily (Search)

---

## 📂 Folder Structure
The project is built as a clean, decoupled monorepo:

```text
MRLA/
├── backend/
│   ├── main.py              # FastAPI server, API routes, SSE endpoints
│   ├── pipeline.py          # Core workflow logic connecting the agents
│   ├── agent.py             # LangChain prompts and agent configurations
│   ├── tools.py             # Tavily search and BeautifulSoup scrapers
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # API Keys (Groq, Tavily)
│
└── frontend/
    ├── package.json         # Node.js dependencies
    ├── src/
    │   ├── app/
    │   │   ├── globals.css  # Dark-mode UI variables
    │   │   ├── layout.tsx   # Root Next.js layout
    │   │   └── page.tsx     # Unified dashboard application
    │   ├── components/      # UI components (OrbitalSphere, ReportViewer, etc.)
    │   └── hooks/
    │       └── useSSE.ts    # React hook for FastAPI streaming
```

---

## 🚀 Future Improvements
- **Google Scholar Integration**: Adding an academic search tool to the Search Agent to prioritize peer-reviewed papers.
- **Streaming Markdown Writing**: Updating the Writer Agent to stream its markdown output character-by-character to the frontend instead of waiting for the full response.
- **PDF Export**: Adding an option to export the generated literature review as a perfectly formatted PDF directly from the browser.
- **Custom Agent Prompts**: Adding a settings menu allowing users to tweak the "persona" of the Critic Agent.

---

## ⚡ How to Run

NEXUS is built as a split full-stack application. The easiest way to run it is by using **VS Code's Split Terminal**.

### Step 1: Start the Backend (Terminal 1)
1. Open the root `MRLA` folder in VS Code.
2. Open a new terminal and navigate to the backend:
   ```bash
   cd backend
   ```
3. Activate your virtual environment and start the Python server:
   ```bash
   ..\.venv\Scripts\activate
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   *(Wait for `Uvicorn running on http://127.0.0.1:8000`)*

### Step 2: Start the Frontend (Terminal 2)
1. Split your terminal (`Ctrl + Shift + 5`) to open a second pane.
2. Navigate to the frontend folder and start the Next.js app:
   ```bash
   cd frontend
   npm run dev
   ```
   *(Wait for `Local: http://localhost:3000`)*

### Step 3: Begin Researching!
Hold **`Ctrl`** and click `http://localhost:3000` in your terminal to open the NEXUS dashboard in your browser.
