https://github.com/tradermonty/claude-trading-skills.git         
https://github.com/quant-sentiment-ai/claude-equity-research                                 
https://github.com/degentic-tools/claude-code-trading-terminal                               
https://github.com/AI4Finance-Foundation/FinRobot                                            
https://github.com/AI4Finance-Foundation/FinGPT https://github.com/microsoft/qlib            
https://github.com/pipiku915/FinMem-LLM-StockTrading                                         
https://github.com/virattt/ai-hedge-fund                                                     
https://github.com/CarlosFinEngg/equity-research-agent                                       
https://github.com/namanlalitnyu/ticker-teller https://github.com/vudiep411/LLM-Search-RAG   
https://github.com/Sasha-Cui/Awesome-Applied-Agents-for-Investment/                          
https://github.com/georgezouq/awesome-ai-in-finance                                          
https://github.com/hananedupouy/LLMs-in-Finance      

Financial AI Repositories Research Report
Executive Summary
This report analyzes several requested financial AI repositories and curated reference lists to determine their conceptual alignment with the OmniTrade AI Trading Platform.

Unlike OpenClaw, these repositories are highly aligned with OmniTrade's domain (Quantitative Finance, LLMs, Multi-Agent Systems, RAG). While we cannot directly "clone" these repos because they are primarily built in Python (OmniTrade requires a Go backend), they provide excellent architectural blueprints, prompting strategies, and agent topologies that we should emulate in our Genkit flows.

1. Project-Specific Analysis
A. AI Hedge Fund (virattt/ai-hedge-fund)
Concept: An educational multi-agent hedge fund team.
Alignment: High.
Key Takeaway: This repo models the exact multi-agent structure we want in OmniTrade's Intelligence Plane. By studying how their agents interact (e.g., passing context between a Quant Analyst and a Portfolio Manager), we can replicate this debate topology using Google Genkit in Go.
B. Equity Research Agent (CarlosFinEngg/equity-research-agent)
Concept: A multi-agent Python system for comprehensive stock analysis and reporting.
Alignment: High.
Key Takeaway: It specializes agents by domain: Fundamental, Technical, Fund Flow, and Policy. It also utilizes MCP tools and web search. This is a perfect blueprint for how to structure the specialized agents that feed signals into our human-in-the-loop approval queue.
C. Ticker Teller (namanlalitnyu/ticker-teller)
Concept: An LSTM forecasting model combined with LLM sentiment analysis of WSJ articles. (Hackathon project).
Alignment: Moderate (It leans heavily on traditional ML/LSTM rather than purely AI agents).
Key Takeaway: It highlights the importance of the Quantitative Factor Modeling feature outlined in OmniTrade's requirements. It proves that combining traditional time-series forecasting (LSTM) with LLM sentiment analysis is a highly effective hybrid approach.
D. LLM-Search-RAG (vudiep411/LLM-Search-RAG)
Concept: Stock sentiment analysis using AI agents, web search, and local RAG (Llama 3).
Alignment: High (specifically for the Data Plane).
Key Takeaway: This repo outlines a clean pipeline: (1) Get Price via API -> (2) Search Articles -> (3) Filter Articles by relevance -> (4) Run RAG sentiment analysis. We should implement this exact modular pipeline in our Data Retrieval Agent.
2. The "Awesome Lists" (Curated Meta-Repositories)
The following repositories are curated lists of papers, tools, and other repos:

Sasha-Cui/Awesome-Applied-Agents-for-Investment/
georgezouq/awesome-ai-in-finance
hananedupouy/LLMs-in-Finance
How We Will Use Them
These are not applications we can run; they are library indexes. They represent a goldmine of academic research on LLMs in finance. We will use them as reference material when designing the prompts and evaluation criteria for our Genkit agents. For example, if we need to know the state-of-the-art method for extracting sentiment from a 10-K filing, we refer to these lists to find the seminal paper on the topic.

3. OmniTrade Implementation Strategy
Since OmniTrade requires a Go 1.24+ backend with React 19, we cannot simply clone these Python-based repositories and run them.

However, we should use them as reference implementations:

Agent Topology: We will recreate the multi-agent hierarchy found in ai-hedge-fund and equity-research-agent using Google Genkit in Go.
RAG Pipeline: We will adopt the price/search/filter/RAG workflow from LLM-Search-RAG to ingest our alternative data.
Hybrid Modeling: We will ensure our system accommodates traditional Quant signals (like the LSTM approaches in ticker-teller) alongside LLM outputs.

4. LLM Provider API References

US Cloud Providers:
- OpenAI API: https://platform.openai.com/docs/api-reference
- Anthropic API: https://docs.anthropic.com/en/api
- Google Gemini API: https://ai.google.dev/api

China/Asia Cloud Providers:
- DeepSeek API: https://platform.deepseek.com/api-docs
- Zhipu AI (GLM): https://open.bigmodel.cn/dev/api
- Moonshot (Kimi): https://platform.moonshot.cn/docs
- ByteDance (Doubao): https://www.volcengine.com/docs/82379
- Alibaba (Qwen): https://help.aliyun.com/zh/dashscope/
- Baidu (ERNIE): https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html
- Tencent (Hunyuan): https://cloud.tencent.com/document/product/1729
- Minimax: https://www.minimaxi.com/document/
- SiliconFlow: https://docs.siliconflow.cn/
- Z.ai: https://docs.z.ai/

Aggregators:
- OpenRouter: https://openrouter.ai/docs
- Together AI: https://docs.together.ai/
- Groq: https://console.groq.com/docs
- Fireworks AI: https://docs.fireworks.ai/

Local/Private Execution:
- Ollama: https://github.com/ollama/ollama/blob/main/docs/api.md
- LM Studio: https://lmstudio.ai/docs
- vLLM: https://docs.vllm.ai/