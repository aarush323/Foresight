# Automotive Predictive Maintenance AI System (LangGraph Edition)

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain)](https://github.com/langchain-ai/langgraph)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An autonomous, multi-agent fleet health management system designed for proactive automotive maintenance. This version represents a significant evolution of the project, transitioning to **LangGraph** for more robust, stateful orchestration and improved agentic control.

> [!NOTE]
> This is the improved **LangGraph** implementation of the system. For the previous **CrewAI** version, please visit: [Automotive-Predictive-Maintenance-AI-System_CREWAI](https://github.com/aarush323/Automotive-Predictive-Maintenance-AI-System_CREWAI)

---
## Prototype visual:
<img width="1919" height="970" alt="landing" src="https://github.com/user-attachments/assets/398e6dff-e685-43a0-9ac4-235837625cac" />
<img width="1914" height="979" alt="lang_db_1" src="https://github.com/user-attachments/assets/445ec1d5-3f38-4090-8323-944418cd72d5" />
<img width="1919" height="950" alt="lang_db_2" src="https://github.com/user-attachments/assets/ddd7d833-5fae-45e2-8308-01c6209621eb" />
<img width="492" height="954" alt="reasoning_1" src="https://github.com/user-attachments/assets/c35a7173-749b-480e-87cc-d4e3c34b907a" />
<img width="523" height="952" alt="reasoning_2" src="https://github.com/user-attachments/assets/72b958bc-182d-4b92-b145-e8688865e893" />

## 🚀 Evolution & Key Improvements

This implementation brings several architectural enhancements over the original CrewAI version:
- **Stateful Orchestration**: Powered by LangGraph's state management, allowing for reliable recovery and complex cyclical workflows.
- **Unified Data Persistence**: Real-time synchronization between agent outputs and a centralized SQLite database.
- **Improved Diagnostic Reasoning**: Enhanced agent logic for Z-Score anomaly detection and cross-fleet pattern recognition.
- **Live Thought Trace**: Real-time SSE log streaming that provides direct visibility into the AI agents' reasoning process during active runs.

---

## 🛠 Features

### 🤖 Autonomous AI Orchestration
- **LangGraph Multi-Agent System**: A sophisticated DAG (Directed Acyclic Graph) of AI agents that process vehicle data, perform diagnostic reasoning, and initiate remedial actions.
- **Hybrid LLM Strategy**: Utilizes specialized models for different tasks (e.g., **Phi-3** for data analysis, **GPT-class models** for complex diagnostics).

### 📈 Predictive Intelligence
- **Cross-Fleet RCA (Root Cause Analysis)**: Detects manufacturing-level failure patterns across the entire fleet to identify systemic defects.
- **Automated Risk Scoring**: Real-time calculation of vehicle health scores based on anomalous sensor telemetry and historical failure trends.

### 🔌 Real-Time Visibility
- **Live Execution Console**: A specialized log stream that provides "Developer-in-the-Loop" visibility into the AI's thread of thought.
- **Glassmorphic Dashboard**: A premium UI featuring real-time health trends, failure distribution analytics, and interactive maps.

---

## 🏗 Tech Stack

### Backend & AI
- **Python 3.12**: Core logic and data processing.
- **FastAPI**: High-performance REST API and SSE log streaming.
- **LangGraph**: Sophisticated agent state management and orchestration.
- **SQLite**: Local persistence for historical run data, failure logs, and appointments.

### Frontend
- **React 18 + Vite**: Lightning-fast UI and modern developer experience.
- **Tailwind CSS**: Utility-first styling with a custom modern design system.
- **Framer Motion**: Smooth, high-fidelity micro-animations and transitions.
- **Lucide React**: Modern iconography.

---

## 🏗 System Architecture

The system is split into two core layers:
1.  **Orchestration Layer (LangGraph)**: Manages specialized nodes for Data Analysis, AI Diagnosis, Engagement, Scheduling, and Manufacturing RCA.
2.  **Infrastructure Layer (FastAPI & SQLite)**: Manages a unified `get_db()` singleton pattern to ensure data consistency across the parallel agent runs.

---

## 🚦 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Ollama (for local LLM execution)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd EY_LAtest_theres_hope
   ```

2. **Backend Setup**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd dashboard/client
   npm install
   ```

### Running the System

1. **Start the Backend**
   ```bash
   python main.py
   ```

2. **Start the Frontend**
   ```bash
   cd dashboard/client
   npm run dev
   ```

---

## 📂 Project Structure

```text
├── app/                  # FastAPI Backend & Core Logic
│   ├── api.py            # REST API Endpoints & SSE Streaming
│   ├── database.py       # SQLite Persistence (Singleton Pattern)
│   ├── pipeline.py       # Orchestration Glue for LangGraph
├── dashboard/client/     # React/Vite Frontend
├── graph/                # LangGraph Implementation (Nodes, State, Edges)
├── tools/                # Specialized APIs (Telematics, Service Centers)
└── main.py               # Backend Entry Point
```

