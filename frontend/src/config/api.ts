// API Configuration
// In production (Vercel), use the Render backend URL.
// In development, use localhost.
const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://nexus-multi-ai-research-agent.onrender.com"
    : "http://localhost:8000";

export default API_BASE_URL;
