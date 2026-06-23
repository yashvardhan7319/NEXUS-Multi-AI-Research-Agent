# NEXUS (Multi AI Research Agent)

NEXUS is a powerful, LangChain-based full-stack AI research pipeline. It orchestrates a sequence of intelligent AI agents to autonomously explore topics, scrape raw content, synthesize comprehensive markdown documents, and critique quality reviews.

---

## 🏗️ Architecture Diagram
Below is the high-level architecture of how the NEXUS frontend and backend interact:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1e1e2e', 'primaryTextColor': '#fff', 'primaryBorderColor': '#7C3AED', 'lineColor': '#8b5cf6', 'secondaryColor': '#0f172a', 'tertiaryColor': '#fff'}}}%%
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
- **Review & Compare Modes**: Upload your own `.docx` drafts to bypass the search phase and have the Critic Agent review or compare reports locally.
- **Stunning UI**: A dark-mode, glassmorphic Next.js interface with Framer Motion micro-animations and an interactive "Orbital Sphere".
- **Instant Report Generation**: Compiles the final LLM output into styled, in-memory Word (`.docx`) files for immediate download.

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


