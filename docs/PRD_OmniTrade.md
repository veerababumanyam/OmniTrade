# Product Requirements Document (PRD): OmniTrade AI Trading Platform

## 1. Product Vision
OmniTrade is an advanced, multi-agent AI quantitative trading and research platform. It leverages state-of-the-art agentic workflows to analyze markets, synthesize financial data, and propose high-conviction trades. The platform is designed with a strong emphasis on cost-efficiency (minimizing LLM token usage) and flexibility (supporting a wide array of global and local LLM providers), wrapped in a premium "Liquid Glass" user interface.

## 2. Target Audience
- Retail Quantitative Traders
- Financial Researchers and Analysts
- AI-driven Hedge Fund Managers (Boutique)

## 3. Core Architecture Principles
The system operates on a strict **Three-Plane Architecture**:
1.  **Data Plane (Read-Only)**: Ingests market data, news, and alternative data. AI agents operate with strictly read-only access to prevent unauthorized state changes.
2.  **Intelligence Plane (Agent Orchestration)**: Genkit-powered multi-agent system (MAS) responsible for analysis, reasoning, and trade signaling.
3.  **Action Plane (Human-in-the-Loop)**: Secure execution environment where human operators review, approve, and audit AI-proposed trades before routing to brokerages.

## 4. Key Features & Requirements

### 4.1 Multi-Agent Orchestration & Token Efficiency
**Description:** The core analysis engine must use specialized agents working collaboratively to reduce relying on massive, monolithic LLM calls.

**Requirements:**
- **Agent Roles:** Implement specialized agents (Data Fetcher, Fundamental Analyst, Technical Analyst, Risk Manager, Portfolio Manager).
- **Token Optimization:**
    - Use smaller, high-efficiency models (e.g., Llama-4-Maverick, DeepSeek-V3.2) for intermediate tasks (sentiment extraction, data structuring) instead of defaulting to GPT-5.3 or Claude 4.6 for everything.
    - Implement caching for repetitive fundamental data queries to avoid redundant RAG cycles.
    - Employ strict summarization pipelines before feeding context into reasoning agents to minimize input tokens.
- **Workflow Orchestration:** Utilize Google Genkit Go SDK 1.4+ flows to explicitly define agent interactions, input/output schemas (Pydantic/Typed Structs), and stateful sessions.

### 4.2 Universal LLM Provider Support
**Description:** The platform must not be locked into a single AI provider, ensuring global usability, redundancy, and local privacy options.

**Requirements:**
- **US Cloud Providers:**
    - OpenAI (GPT-4.x, GPT-5.x, o1, o3-mini series)
    - Anthropic (Claude 4.x/5.x/6.x Opus, Sonnet, Haiku series)
    - Google Gemini (Gemini 2.x Flash, Pro series)
- **China/Asia Cloud Providers:**
    - DeepSeek (V3, V4, R1 series)
    - Zhipu AI (GLM-4, GLM-5 series)
    - Moonshot/Kimi (V1 series with 8K-128K context)
    - ByteDance/Doubao (Pro, Lite series)
    - Alibaba Qwen (Max, Plus, Turbo, VL series)
    - Baidu ERNIE (4.0, 3.5 series)
    - Tencent Hunyuan (Lite, Standard, Pro)
    - Minimax (ABAB 6.5, 5.5 series)
    - SiliconFlow (Multi-model aggregator)
    - Z.ai
- **Aggregators/Routing:**
    - OpenRouter (access to 200+ models via single API)
    - Together AI (open-source models)
    - Groq (ultra-fast inference)
    - Fireworks AI (fast inference)
- **Local/Private Execution:**
    - Ollama (any local model)
    - LM Studio (any GGUF model)
    - vLLM (high-performance serving)
    - Custom OpenAI-compatible endpoints
- **Dynamic Model Selection:** Users must be able to assign specific models to specific agents (e.g., use Llama 3.2 for data parsing, and Claude Opus 4.6 for final Portfolio Manager synthesis).
- **User Flexibility:** Per-agent model configuration via UI, with ability to add custom providers and models.

### 4.3 Algorithmic Strategy Execution
**Description:** Support diverse trading horizons and risk profiles as identified in the architecture research.

**Requirements:**
- **Short-Term Growth (20%+):** Event-driven trading based on earnings surprises and real-time sentiment analysis using RAG on news feeds.
- **Mid-Term Steady Growth (500%+):** Value investing leveraging deep fundamental analysis of 10-K/10-Q filings paired with ML-based quantitative ranking (e.g., Qlib integration).
- **Intraday High-Volatility (Commodities):** Fast-paced technical trading using reinforcement learning models for Gold, Silver, and Oil, capitalizing on order book imbalances.

### 4.4 Human-in-the-Loop (HITL) Action Plane
**Description:** AI proposals must be vetted by a human before execution.

**Requirements:**
- **Trade Dashboards:** Present AI signals with full "chain-of-thought" transparency, confidence scores, and risk assessments.
- **Approval Mechanism:** One-click approval/rejection interface for proposed trades.
- **Audit Logging:** Immutable logging of all generated signals, the context used to generate them, and the resulting human decision.

### 4.5 Premium User Interface
**Description:** The UI must adhere to the "Liquid Glass" design aesthetic, feeling premium and state-of-the-art.

**Requirements:**
- **Tech Stack:** React 19.2, Vite 7.3, Vanilla CSS.
- **Aesthetics:** Glassmorphism, smooth gradients, highly curated typography (Inter/Outfit), and subtle micro-animations for responsiveness. No generic templates.
- **Generative UI:** Utilize CopilotKit or similar to render dynamic financial charts and analysis directly within chat/agent interfaces.

## 5. Non-Functional Requirements
- **Security:** Ensure API keys for various LLM providers are securely stored and encrypted. Strict adherence to read-only database connections for the Intelligence Plane.
- **Performance:** WebSocket integration for real-time market data to ensure low-latency signal generation for intraday strategies.
- **i18n:** Built-in support for English (LTR) and Arabic (RTL) locales.

## 6. Success Metrics
- **Token Cost:** Achieve a 40% reduction in average token cost per trade signal compared to monolithic GPT-5.3 baseline workflows.
- **Provider Uptime:** 99.9% availability through LLM model fallback mechanisms.
- **User Engagement:** High adoption of the HITL approval dashboard demonstrating trust in the AI's reasoning.
