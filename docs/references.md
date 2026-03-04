# OmniTrade AI Trading Platform: References & Research

This document centralizes key technical references, research repositories, and API documentation relevant to the OmniTrade platform.

## 1. AI Trading Frameworks & Agents

These repositories provide architectural blueprints, prompting strategies, and agent topologies. While primarily Python-based, they serve as reference implementations for our Go-based Genkit flows.

| Repository | Focus | Key Takeaway for OmniTrade |
| :--- | :--- | :--- |
| [ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) | Multi-agent hedge fund team | Models the multi-agent debate topology for the Intelligence Plane. |
| [equity-research-agent](https://github.com/CarlosFinEngg/equity-research-agent) | Specialized stock analysis | Blueprint for domain-specific agents (Fundamental, Technical, etc.). |
| [AI-Trader](https://github.com/HKUDS/AI-Trader) | Trading operations & MCP | MCP toolchain integration and trading tool registration. |
| [FinRobot](https://github.com/AI4Finance-Foundation/FinRobot) | Modular architecture | Four-layer modular design principles for financial agents. |
| [FinGPT](https://github.com/AI4Finance-Foundation/FinGPT) | Financial LLMs | Modular design and foundational financial LLM patterns. |
| [ticker-teller](https://github.com/namanlalitnyu/ticker-teller) | Hybrid Forecasting | Combining traditional ML (LSTM) with LLM sentiment analysis. |
| [LLM-Search-RAG](https://github.com/vudiep411/LLM-Search-RAG) | RAG Pipeline | Clean pipeline: Price API -> Search -> Filter -> RAG sentiment. |
| [FinMem-LLM-StockTrading](https://github.com/pipiku915/FinMem-LLM-StockTrading) | Reliability & Memory | Patterns for long-term memory and platform reliability. |
| [claude-trading-skills](https://github.com/tradermonty/claude-trading-skills) | Event Handling | Trading event handling and error management patterns. |
| [claude-equity-research](https://github.com/quant-sentiment-ai/claude-equity-research) | Research Agents | Agentic equity research workflows. |
| [claude-code-trading-terminal](https://github.com/degentic-tools/claude-code-trading-terminal) | UI/UX Patterns | Terminal UI and tool UX patterns for trading environments. |
| [12-factor-agents](https://github.com/humanlayer/12-factor-agents) | Production Design | Production-grade agent design principles (also via [iStepnik](https://github.com/iStepnik/12-factor-agents)). |

## 2. Curated "Awesome" Lists (Library Indexes)

Valuable collections of academic research, tools, and foundational papers.

- [Awesome Applied Agents for Investment](https://github.com/Sasha-Cui/Awesome-Applied-Agents-for-Investment/)
- [Awesome AI in Finance](https://github.com/georgezouq/awesome-ai-in-finance)
- [LLMs in Finance](https://github.com/hananedupouy/LLMs-in-Finance)

## 3. Technical & Documentation References

Core technical documentation for system components and patterns.

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Google ADK Go Package](https://pkg.go.dev/google.golang.org/adk@latest)
- [ADK Go Repository](https://github.com/google/adk-go)
- [HashiCorp Go-Plugin](https://github.com/hashicorp/go-plugin) - RPC-based plugin system architecture.
- [Interface-based Patterns](https://blog.learngoprogramming.com/) - Go best practices for modular design.
- [Microsoft Qlib](https://github.com/microsoft/qlib) - Quantitative investment platform tool organization.

## 4. LLM Provider API References

### US Cloud Providers
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Anthropic API](https://docs.anthropic.com/en/api)
- [Google Gemini API](https://ai.google.dev/api)
- [xAI Grok](https://grok.com)

### China/Asia Cloud Providers
- [DeepSeek API](https://platform.deepseek.com/api-docs)
- [Zhipu AI (GLM)](https://open.bigmodel.cn/dev/api)
- [Moonshot (Kimi)](https://platform.moonshot.cn/docs)
- [ByteDance (Doubao)](https://www.volcengine.com/docs/82379)
- [Alibaba (Qwen)](https://help.aliyun.com/zh/dashscope/)
- [Baidu (ERNIE)](https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html)
- [Tencent (Hunyuan)](https://cloud.tencent.com/document/product/1729)
- [Minimax](https://www.minimaxi.com/document/)
- [SiliconFlow](https://docs.siliconflow.cn/)
- [Z.ai](https://docs.z.ai/)

### Aggregators
- [OpenRouter](https://openrouter.ai/docs)
- [Together AI](https://docs.together.ai/)
- [Groq](https://console.groq.com/docs)
- [Fireworks AI](https://docs.fireworks.ai/)

### Local/Private Execution
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [LM Studio](https://lmstudio.ai/docs)
- [vLLM](https://docs.vllm.ai/)
