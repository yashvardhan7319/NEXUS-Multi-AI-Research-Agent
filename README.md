# NEXUS (Multi AI Research Agent)

NEXUS is a powerful, LangChain-based full-stack AI research pipeline. It orchestrates a sequence of intelligent AI agents to autonomously explore topics, scrape raw content, synthesize comprehensive markdown documents, and critique quality reviews.

## Project Structure

This is a monorepo setup divided into two isolated environments:

- **`backend/`**: A FastAPI application housing the Uvicorn server, LangChain agents (Search, Reader, Writer, Critic), Tavily web tools, and streaming Server-Sent Events (SSE).
- **`frontend/`**: A Next.js 16 application featuring a responsive, animated dark-mode UI with live pipeline tracking, report viewing, and interactive orbital status spheres.

---

## 🚀 How to Run the Project in VS Code

Since the project uses both a Python backend and a Node frontend, the easiest way to run the entire project is by utilizing VS Code's **Split Terminal** feature. Follow this step-by-step guide:

### Step 1: Open the Project
1. Open VS Code.
2. Go to **File > Open Folder** and select the root folder of this project (`MRLA`).

### Step 2: Start the Backend (Terminal 1)
1. Open the integrated terminal in VS Code by pressing **`` Ctrl + ` ``** (the backtick key) or navigating to **Terminal > New Terminal**.
2. Type the following command to move into the backend folder:
   ```powershell
   cd backend
   ```
3. Activate the Python virtual environment. (Assuming you are using the `.venv` folder in the root directory):
   ```powershell
   ..\.venv\Scripts\activate
   ```
4. Start the FastAPI server:
   ```powershell
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   *You should see `Uvicorn running on http://127.0.0.1:8000`.*

### Step 3: Start the Frontend (Terminal 2)
Now, split your terminal so you can see both servers running at the same time:

1. In the top right corner of the terminal window, click the **Split Terminal** icon (or press **`Ctrl + Shift + 5`**). This will open a second terminal pane side-by-side.
2. In this new terminal pane, navigate to the frontend folder:
   ```powershell
   cd frontend
   ```
3. Start the Next.js development server:
   ```powershell
   npm run dev
   ```
   *You should see `Ready in ...` and `Local: http://localhost:3000`.*

### Step 4: Access the App
Everything is now running! 
Hold **`Ctrl`** and click the `http://localhost:3000` link in your terminal, or manually type it into your browser to start your AI research.
