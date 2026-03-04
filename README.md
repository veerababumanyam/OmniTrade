# OmniTrade AI Trading Platform

<div align="center">

![OmniTrade Banner](https://images.unsplash.com/photo-1611974717433-28ebbfba0989?q=80&w=2070&auto=format&fit=crop)

[![Go Version](https://img.shields.io/badge/Go-1.26+-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![React Version](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Genkit](https://img.shields.io/badge/Google-Genkit-4285F4?style=for-the-badge&logo=google)](https://firebase.google.com/docs/genkit)
[![Design](https://img.shields.io/badge/Design-Liquid_Glass-FF69B4?style=for-the-badge)](https://github.com/v13478/OmniTrade)

**OmniTrade** is a multi-agent AI quantitative trading and research platform. It leverages state-of-the-art agentic workflows to analyze markets, synthesize financial data, and propose high-conviction trades with a premium "Liquid Glass" experience.

[Explore Documentation](./docs) • [Architecture](./docs/AI_Trading_System_Architecture.md) • [Features](#key-features)

</div>

---

## 💎 The Vision

OmniTrade represents the next generation of financial intelligence. By moving away from monolithic AI models and adopting a **Multi-Agent Orchestration** strategy, we achieve unprecedented precision, token efficiency, and cross-market analysis capabilities.

### 🌊 Liquid Glass Design
Built with a "Liquid Glass" philosophy, the interface feels premium, alive, and professional. Transparent surfaces, smooth Gaussian blurs, and micro-interactivity define the OmniTrade experience.

---

## 🛠️ Three-Plane Architecture

OmniTrade is built on a high-integrity architectural foundation:

1.  **📡 Data Plane (Read-Only)**: Ingests real-time market data, technical indicators, and news sentiment. AI agents operate with a strictly read-only role (`medisync_readonly`) to ensure data integrity.
2.  **🧠 Intelligence Plane**: A Google Genkit-powered multi-agent system (MAS). Specialized agents perform deep research, fundamental analysis, and risk assessment before reaching consensus.
3.  **🛡️ Action Plane (HITL)**: A "Human-in-the-Loop" secure execution layer. No trade is ever placed without human oversight, supported by transparent reasoning and confidence scores.

---

## 🚀 Key Features

- **Agentic Workflows**: Specialized roles for Data Fetching, Fundamental/Technical Analysis, Risk Management, and Portfolio Synthesis.
- **Universal LLM Support**: Support for OpenAI, Anthropic, Gemini, DeepSeek, and local inference via Ollama/LM Studio.
- **Token Optimization**: Smart model routing to minimize costs while maximizing reasoning depth.
- **Multi-Horizon Strategies**: From event-driven growth to intraday high-volatility technical trading.
- **Auditability**: Immutable logs of all AI reasoning and human decisions.
- **i18n**: Support for English (LTR) and Arabic (RTL) out of the box.

---

## 🏗️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Go 1.26+, `go-chi`, `sqlx`, Genkit Go SDK |
| **Frontend** | React 19, Vite, Vanilla CSS, CopilotKit |
| **Database** | PostgreSQL + pgvector, Redis |
| **AI Models** | GPT-4o, Claude 3.5, Gemini 1.5 Pro, Llama 3 (Local) |

---

## 🚦 Getting Started

### Prerequisites
- Go 1.26 or higher
- Node.js 20+
- PostgreSQL instance

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/v13478/OmniTrade.git
   cd OmniTrade
   ```

2. **Setup Backend**
   ```bash
   cd backend
   go mod download
   go run main.go
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📖 Documentation
Detailed technical specifications and research findings can be found in the `/docs` directory:
- [Product Requirements (PRD)](./docs/PRD_OmniTrade.md)
- [System Architecture](./docs/AI_Trading_System_Architecture.md)
- [Trading Strategies](./docs/AI_Trading_Strategies.md)

---

<div align="center">
Built with ❤️ by the OmniTrade Team
</div>
