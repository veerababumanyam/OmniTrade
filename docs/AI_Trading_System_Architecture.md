# AI Trading System Architecture & Research

## 1. Executive Summary
This document outlines the findings from an extensive research phase covering state-of-the-art AI trading repositories and frameworks. Based on these insights, we present a comprehensive architecture proposal for developing a modern, AI-powered quantitative trading and analysis application.

## 2. Key Research Findings

Our research surveyed several cutting-edge open-source projects including FinGPT, Qlib, Claude Code Trading Terminal, AI Hedge Fund, FinMem, and various agentic frameworks. 

### 2.1 Multi-Agent Systems (MAS)
Modern financial AI heavily relies on multi-agent architectures rather than monolithic LLMs.
- **Specialized Roles**: Systems like `ai-hedge-fund` and `equity-research-agent` utilize distinct agents for specific tasks (e.g., Fundamental Analyst, Technical Analyst, Risk Manager, Portfolio Manager).
- **Debate and Consensus**: Agents often debate or aggregated their signals to form a final trading decision, reducing hallucinations and improving robustness.

### 2.2 Retrieval-Augmented Generation (RAG)
LLMs are inherently limited by their training data cutoff. RAG is critical for real-time finance.
- **News & Sentiment**: Using APIs (like Tavily, NewsAPI) to fetch current articles and feeding them to LLMs for sentiment scoring.
- **Financial Documents**: Parsing SEC filings, earnings call transcripts, and research reports to extract fundamental data.

### 2.3 Financial LLMs and Fine-tuning
- **FinGPT**: Demonstrates that lightweight adaptation (LoRA/QLoRA) of open-source models (like Llama-4) on financial data is more cost-effective and sometimes more performant than using general-purpose models like GPT-5.3 for specific financial tasks.
- **Sentiment & Forecasting**: Models fine-tuned specifically for financial sentiment analysis and stock price forecasting are readily available.

### 2.4 Quantitative Pipelines
- **Qlib Componentization**: A full quantitative pipeline requires distinct components: Data Processing (feature engineering), ML Model Training (supervised/RL), Backtesting, and Online Serving (live trading).
- **Model Variety**: Integrating traditional quant models (LightGBM, XGBoost) alongside deep learning (LSTM, Temporal Fusion Transformers) and LLM-based signals provides a balanced approach.
- **ML Microservice**: A dedicated Python/FastAPI microservice runs quantitative ML models (LightGBM, XGBoost, LSTM, TFT, PPO, SAC), managed by MLflow for experiment tracking and Vectorbt for backtesting. See `09_Machine_Learning_Models.md`.

### 2.5 Real-Time Trading Terminals
- **Institutional Grade Pipelines**: Projects like `claude-code-trading-terminal` highlight the need for robust real-time data ingestion using WebSockets, data normalization, and message queues (like Redis/Kafka).
- **Execution & Risk Management**: Dedicated modules for executing trades across exchanges (CEX/DEX) and monitoring risk limits in real-time are essential.

## 3. Proposed Application Architecture

Based on the research, we propose a modular, three-plane architecture for the application, adhering to the "Liquid Glass" design principles and prioritizing security/auditability.

### 3.1 The Three-Plane Architecture

1. **Data Plane (Read-Only AI Access)**
   - **Market Data ingestion**: Real-time WebSockets (e.g., Binance, Polygon) and historical data APIs.
   - **Alternative Data**: News feeds, SEC filings, social sentiment.
   - **Database**: PostgreSQL (via `sqlx`) for structured data, vector database (e.g., pgvector or Milvus) for RAG document embeddings.
   - *Constraint*: AI agents operate with a strictly read-only database role (`medisync_readonly`).

2. **Intelligence Plane (Genkit Flows)**
   - **Multi-Agent Orchestrator**: Built using Google Genkit, managing specialized agents.
   - **Agents**:
     - *Data Retrieval Agent*: Fetches live price/news data.
     - *Fundamental Agent*: Analyzes financial statements via RAG.
     - *Quantitative Agent*: Runs statistical/ML models.
     - *Risk Analyst*: Evaluates portfolio exposure.
     - *Portfolio Manager*: Aggregates signals and proposes trades.
   - **Universal LLM Support**: Provider-agnostic abstraction layer supporting:
     - US providers: OpenAI, Anthropic, Google Gemini, xAI Grok
     - China/Asia providers: DeepSeek, Zhipu, Moonshot, ByteDance, Alibaba, Baidu, Tencent, Minimax, SiliconFlow, Z.ai
     - Aggregators: OpenRouter, Together, Groq, Fireworks
     - Local: Ollama, LM Studio, vLLM, custom endpoints
   - **Per-Agent Configuration**: Users can assign any model to any agent role.
   - **Zero Hardcoding**: No LLM models, providers, API keys, prompts, or temperatures are hardcoded in the codebase. All configuration is stored in the database (`llm_providers`, `llm_models`, `agent_model_config`, `agent_skills` tables) and managed via the Agent Management UI at runtime.

3. **Action Plane (Human-in-the-loop)**
   - **Trade Proposal Generation**: The Intelligence Plane proposes trades with full reasoning and confidence scores.
   - **Approval Workflow**: No trades are executed without explicit human approval.
   - **Execution Engine**: Interfaces with broker APIs once approved.
   - **Audit Log**: Every AI decision, retrieved context, and human action is logged to an immutable audit table.

### 3.2 Tech Stack
- **Backend**: Go 1.24+, `go-chi` v5.x for routing, `sqlx` for database access, Google Genkit Go SDK for AI workflows.
- **Frontend**: React 19.x, Vite 6.x, TypeScript 5.7.x, Vanilla CSS with "Liquid Glass" aesthetic (glassmorphism, modern typography, micro-animations).
- **Database**: PostgreSQL 17.x with pgvector extension.
- **Infrastructure**: Docker for containerization, Redis 8.x for caching/queues.
- **LLM Support**: Universal provider abstraction supporting OpenAI, Anthropic, Google Gemini, xAI Grok, DeepSeek, Zhipu, Moonshot, ByteDance, Alibaba, Baidu, Tencent, Minimax, SiliconFlow, Z.ai, OpenRouter, Together, Groq, Fireworks, Ollama, LM Studio, vLLM, and custom endpoints.
- **ML Microservice**: Python 3.12+, FastAPI, LightGBM, XGBoost, PyTorch (LSTM, TFT, CNN, Neural GARCH), Stable-Baselines3 (PPO, SAC), Qlib, MLflow, Vectorbt.

## 4. Development Roadmap

1. **Phase 1: Foundation & Data**
   - Setup Go backend and React frontend.
   - Implement database schema and read-only roles.
   - Build data ingestion pipelines for historical and real-time stock data.
2. **Phase 2: Intelligence Plane (Core Agents)**
   - Initialize Google Genkit.
   - Develop the Data Retrieval and Quantitative Analyst agents.
   - Implement basic RAG for financial news sentiment.
3. **Phase 3: Multi-Agent Orchestration & Action Plane**
   - Develop the Portfolio Manager agent to synthesize signals.
   - Build the Human-In-The-Loop approval UI.
   - Implement the immutable audit logging system.
4. **Phase 4: ML Quantitative Models**
   - Build the Python ML microservice (FastAPI).
   - Implement feature engineering (200+ technical/fundamental features).
   - Train baseline models (LightGBM, LSTM, TFT, GARCH).
   - Setup MLflow model registry and Vectorbt backtesting.
5. **Phase 5: Refinement & Premium UI**
   - Polish the React frontend to achieve the "Liquid Glass" standard.
   - Add comprehensive backtesting visualization.
   - Build the Agent Management UI for dynamic config.
