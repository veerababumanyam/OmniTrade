# OmniTrade AI Trading Platform

<div align="center">

![OmniTrade Logo](./assets/omnitrade_logo.png)

[![Go Version](https://img.shields.io/badge/Go-1.26+-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![React Version](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Genkit](https://img.shields.io/badge/Google-Genkit_1.4-4285F4?style=for-the-badge&logo=google)](https://firebase.google.com/docs/genkit)
[![Quality](https://img.shields.io/badge/Quality-90%25+-success?style=for-the-badge)](./.specswarm/quality-standards.md)
[![Design](https://img.shields.io/badge/Design-Liquid_Glass-FF69B4?style=for-the-badge)](./docs/08_UI_UX_Design_Standards_2026.md)

**OmniTrade** is a next-generation multi-agent AI quantitative trading and research platform. Built with a high-integrity **Three-Plane Architecture** and a premium **Liquid Glass** aesthetic, it empowers traders with autonomous intelligence and human-in-the-loop safeguards.

[Explore Documentation](./docs) • [Architecture](./docs/AI_Trading_System_Architecture.md) • [Features](#-key-features) • [Getting Started](#-getting-started)

</div>

---

## 💎 The Vision

OmniTrade represents the convergence of specialized AI intelligence and elite financial research. By orchestrating a **Swarm of 50+ Specialized Agents**, the platform decomposes complex market analysis into verifiable, collaborative reasoning steps, achieving unprecedented token efficiency and decision accuracy.

### 🌊 Liquid Glass Experience
Our UI follows the **2026 "Liquid Glass" Design System**. It’s not just transparent; it’s physics-based. Surfaces simulate refraction, lensing, and dynamic specularity, creating a workspace that feel alive and professional.

---

## 🛠️ Three-Plane Architecture

OmniTrade is engineered for security and precision:

1.  **📡 Data Plane (Read-Only)**: Real-time ingestion of market OHLCV, SEC filings, and global news. Agents operate via the `medisync_readonly` role, ensuring zero unauthorized mutations.
2.  **🧠 Intelligence Plane**: A Google Genkit-powered Multi-Agent System (MAS). Specialized analysts (Fundamental, Technical, Sentiment) engage in a "Debate Topology" to reach high-conviction consensus.
3.  **🛡️ Action Plane (HITL)**: The execution layer. AI proposes, human approves. Every trade includes a full **Chain-of-Thought (CoT)** reasoning audit and confidence score.

---

## 🚀 Key Features

- **Advanced Debate Topology**: Hierarchical agent structure (Parallel Analysis -> Strategy Optimization -> Synthesis).
- **Universal LLM Integration**: support for OpenAI (GPT-5), Anthropic (Claude 6), Gemini 2.x, DeepSeek-V4, and local inference via **Ollama**.
- **Token Efficiency Engine**: Smart routing and context compression reducing costs by up to 40%.
- **Hallucination Control**: Multi-source validation and cross-checking guardrails.
- **Agent Collaboration Framework**: Formal A2A (Agent-to-Agent) protocols for knowledge distillation and peer review.
- **Full i18n Support**: Native English (LTR) and Arabic (RTL) capabilities.

---

## 🏗️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Foundation** | Go 1.26+, `go-chi`, `sqlx`, Genkit Go SDK 1.4+ |
| **Intelligence** | Multi-Agent Orchestration, Vector RAG (pgvector), Redis Cache |
| **Frontend** | React 19.2, Vite 7.3, Vanilla CSS, CopilotKit |
| **Protocols** | A2A (Agent-to-Agent), MCP (Model Context), ACP (Agent Client) |
| **Observability** | SpecSwarm Quality Gates, Immutable Audit Logs |

---

## 🤖 Specialized Agent Swarm

OmniTrade utilizes over **50+ specialized trading agents** categorized into expert domains:

- 📊 **Fundamental Analysis**: Valuation models, Growth trends, Forensic accounting.
- 📉 **Technical Analysis**: Breakout detection, Volume profiles, Support/Resistance.
- 📈 **Market Sentiment**: News synthesis, Social media scraping, Analyst ratings.
- 🌍 **Alternative Data**: Geopolitical events, Macro-indicators, Insider tracking.
- 🧠 **Meta Agents**: Bayes inference, Risk management, Portfolio synthesis.

---

## 🚦 Getting Started

### Prerequisites
- **Go 1.26+**
- **Node.js 22+**
- **PostgreSQL + pgvector**
- **Docker** (for infrastructure services)

### Local Setup

1. **Clone & Install Dependencies**
   ```bash
   git clone https://github.com/v13478/OmniTrade.git
   cd OmniTrade
   npm install && cd backend && go mod download
   ```

2. **Run Infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Start Development Servers**
   ```bash
   # From root
   npm run dev
   ```

---

## 📖 Documentation Index

- [Product Requirements (PRD)](./docs/PRD_OmniTrade.md)
- [Agent Intelligence System](./docs/02_Agent_Intelligence_System.md)
- [Liquid Glass Design Specs](./docs/08_UI_UX_Design_Standards_2026.md)
- [API Specifications](./docs/04_API_Specification.md)
- [Security & HITL Protocol](./docs/05_Security_HITL_Protocol.md)

---

## 📋 Quality Standards (SpecSwarm)

We maintain strict quality gates enforced by **SpecSwarm**:

| Metric | Threshold |
| :--- | :--- |
| **Test Coverage** | 90% Minimum |
| **Quality Score** | 90/100 Minimum |
| **Security** | Zero Critical Vulnerabilities |

---

<div align="center">
Built with ❤️ by the OmniTrade Core Team
</div>
