# Technical Specification: OmniTrade AI Platform

## 1. System Components

The system is divided into three primary services:
1. **Data Ingestion Service (Go)**: Connects to WebSockets/APIs (Binance, Polygon) and writes to the database.
2. **Intelligence Service (Go/Genkit)**: Hosts the Genkit flows and agents. Uses the `medisync_readonly` database role.
3. **Frontend Interface (React/Vite)**: The user-facing dashboard for HITL approval and strategy monitoring.

## 2. Database Schema (PostgreSQL)

The database enforces security through role-based access. AI agents cannot write to primary tables.

### 2.1 Core Tables
```sql
-- Read-only to AI agents
CREATE TABLE stock_assets (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100),
    sector VARCHAR(50)
);

CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    price DECIMAL(15, 4),
    volume BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fundamental_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    report_type VARCHAR(20), -- 10-K, 10-Q
    content TEXT,
    embedding vector(1536) -- For RAG
);
```

### 2.2 Action Plane Tables
```sql
-- Read/Write accessible for Audit & Execution (Not accessible directly by AI flows)
CREATE TABLE trade_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    action VARCHAR(10), -- BUY/SELL
    confidence_score DECIMAL(3, 2),
    reasoning TEXT,
    proposed_by_model VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES trade_proposals(id),
    action_taken VARCHAR(50),
    user_id UUID,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 LLM Configuration Tables
```sql
-- Store LLM provider configurations (encrypted credentials)
CREATE TABLE llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'openai', 'anthropic', 'gemini', etc.
    display_name VARCHAR(100),
    provider_type VARCHAR(30), -- 'cloud', 'local', 'aggregator'
    base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store available models per provider
CREATE TABLE llm_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES llm_providers(id),
    model_id VARCHAR(100) NOT NULL, -- 'gpt-4.5-turbo', 'claude-sonnet-4-6', etc.
    display_name VARCHAR(100),
    context_window INTEGER, -- token limit
    supports_streaming BOOLEAN DEFAULT true,
    supports_vision BOOLEAN DEFAULT false,
    supports_function_calling BOOLEAN DEFAULT true,
    input_cost_per_1k_tokens DECIMAL(10, 6),
    output_cost_per_1k_tokens DECIMAL(10, 6),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store user's agent-to-model mappings
CREATE TABLE agent_model_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- NULL for system defaults
    agent_role VARCHAR(50) NOT NULL, -- 'fundamental_summarizer', 'portfolio_manager', etc.
    model_id UUID REFERENCES llm_models(id),
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER,
    custom_prompt TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, agent_role)
);
```

## 3. Intelligence Plane: Genkit Agent Flows

The orchestration relies on Google Genkit to manage agent interactions.

### 3.1 Flow: `GenerateTradeProposal`
**Input Schema:**
```json
{
  "symbol": "AAPL",
  "strategy": "mid_term_growth",
  "allocator_budget": 10000
}
```

**Steps:**
1. **Data Fetcher Node**: Queries `market_data` for current price and MACD/RSI indicators. (Fast, deterministic).
2. **RAG Node**: Queries `fundamental_data` using vector search for recent earnings call context.
3. **Analysis Node (Configurable Model)**: Summarizes RAG context to minimize token usage.
4. **Portfolio Manager Node (Configurable Model)**: Synthesizes technical indicators and summarized fundamentals to output a final decision.

**Output Schema (Trade Proposal):**
```json
{
  "symbol": "AAPL",
  "action": "BUY",
  "confidence": 0.85,
  "reasoning": "Strong Q3 earnings offset short-term RSI overbought conditions. Value buy.",
  "risk_assessment": "Medium volatility expected next week due to Fed meeting."
}
```

## 4. Frontend Application Architecture

### 4.1 Tech Stack
- **React**: 19.x (Latest stable)
- **TypeScript**: 5.7.x
- **Build Tool**: Vite 6.x
- **Styling**: Vanilla CSS (Liquid Glass design system)
- **State Management**: React Context / Zustand 5.x
- **Generative UI**: CopilotKit
- **Charts**: TradingView Lightweight Charts / Recharts

### 4.2 Key Views
1. **Dashboard**: High-level overview of portfolio value and currently active LLM models.
2. **Signal Review (HITL)**: A dedicated inbox of `PENDING` trade proposals. Displays the AI's "chain-of-thought", references (links to filings), and [Approve]/[Reject] buttons.
3. **LLM Configuration Panel**: Interface to manage LLM providers, configure API keys, and assign specific models to specific agent roles.

## 5. Universal LLM Provider Abstraction Layer

The Intelligence Service implements a provider-agnostic LLM abstraction that supports any LLM provider. Users have full flexibility to select any provider and model for each agent role.

### 5.1 Supported LLM Providers

#### Cloud Providers (US)
| Provider | Provider ID | API Base URL | Notes |
|----------|-------------|--------------|-------|
| OpenAI | `openai` | `https://api.openai.com/v1` | GPT-5, GPT-5.1, o3 series |
| Anthropic | `anthropic` | `https://api.anthropic.com/v1` | Claude 4.6 Opus/Sonnet/Haiku |
| Google Gemini | `gemini` | `https://generativelanguage.googleapis.com/v1beta` | Gemini 2.5, Gemini 3 series |

#### Cloud Providers (China/Asia)
| Provider | Provider ID | API Base URL | Notes |
|----------|-------------|--------------|-------|
| DeepSeek | `deepseek` | `https://api.deepseek.com/v1` | V3, V4, R1 series |
| Zhipu AI (GLM) | `zhipu` | `https://open.bigmodel.cn/api/paas/v4` | GLM-4, GLM-5 (745B) |
| Moonshot (Kimi) | `moonshot` | `https://api.moonshot.cn/v1` | Kimi K2, K2 Thinking |
| ByteDance (Doubao) | `bytedance` | `https://ark.cn-beijing.volces.com/api/v3` | Doubao 2.0 Pro/Lite/Mini/Code |
| Alibaba (Qwen) | `alibaba` | `https://dashscope.aliyuncs.com/api/v1` | Qwen3, Qwen3-Coder, Qwen3-VL |
| Baidu (Ernie) | `baidu` | `https://aip.baidubce.com/rpc/2.0/ai_custom/v1` | ERNIE 4.0, 4.5 series |
| Tencent (Hunyuan) | `tencent` | `https://api.hunyuan.cloud.tencent.com/v1` | Hunyuan Pro, Lite |
| Minimax | `minimax` | `https://api.minimax.chat/v1` | ABAB 6.5, 7 series |
| SiliconFlow | `siliconflow` | `https://api.siliconflow.cn/v1` | Multi-model aggregator |
| Z.ai | `zai` | `https://api.z.ai/v1` | GLM-5, Z1, Z1-Rumination |

#### Aggregators
| Provider | Provider ID | API Base URL | Notes |
|----------|-------------|--------------|-------|
| OpenRouter | `openrouter` | `https://openrouter.ai/api/v1` | 200+ models via single API |
| Together AI | `together` | `https://api.together.xyz/v1` | Open-source models |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Ultra-fast inference |
| Fireworks AI | `fireworks` | `https://api.fireworks.ai/inference/v1` | Fast inference |

#### Local/Private Execution
| Provider | Provider ID | API Base URL | Notes |
|----------|-------------|--------------|-------|
| Ollama | `ollama` | `http://localhost:11434/v1` | Local inference, 50+ models |
| LM Studio | `lmstudio` | `http://localhost:1234/v1` | Any GGUF model |
| vLLM | `vllm` | `http://localhost:8000/v1` | High-performance serving |
| Custom Endpoint | `custom` | User-defined | Any OpenAI-compatible API |

### 5.2 LLM Provider Interface (Go)

```go
// pkg/llm/provider.go

package llm

import (
    "context"
)

// Provider defines the interface for all LLM providers
type Provider interface {
    // Generate performs a completion request
    Generate(ctx context.Context, req *GenerateRequest) (*GenerateResponse, error)

    // GenerateStream performs a streaming completion request
    GenerateStream(ctx context.Context, req *GenerateRequest) (<-chan StreamChunk, error)

    // Embed creates embeddings for the given texts
    Embed(ctx context.Context, req *EmbedRequest) (*EmbedResponse, error)

    // ListModels returns available models for this provider
    ListModels(ctx context.Context) ([]ModelInfo, error)

    // GetProviderInfo returns provider metadata
    GetProviderInfo() ProviderInfo
}

// GenerateRequest represents a generation request
type GenerateRequest struct {
    Model       string         `json:"model"`
    Messages    []Message      `json:"messages"`
    Temperature float64        `json:"temperature,omitempty"`
    MaxTokens   int            `json:"max_tokens,omitempty"`
    Tools       []Tool         `json:"tools,omitempty"`
    ToolChoice  interface{}    `json:"tool_choice,omitempty"`
    ResponseFormat *ResponseFormat `json:"response_format,omitempty"`
    Stream      bool           `json:"stream,omitempty"`
    Metadata    map[string]any `json:"metadata,omitempty"`
}

// Message represents a chat message
type Message struct {
    Role    string      `json:"role"` // system, user, assistant, tool
    Content interface{} `json:"content"` // string or []ContentPart for multimodal
}

// ContentPart for multimodal messages
type ContentPart struct {
    Type     string `json:"type"` // text, image_url
    Text     string `json:"text,omitempty"`
    ImageURL *ImageURL `json:"image_url,omitempty"`
}

// GenerateResponse represents a generation response
type GenerateResponse struct {
    ID        string   `json:"id"`
    Model     string   `json:"model"`
    Choices   []Choice `json:"choices"`
    Usage     Usage    `json:"usage"`
    Created   int64    `json:"created"`
}

// Choice represents a completion choice
type Choice struct {
    Index        int      `json:"index"`
    Message      Message  `json:"message"`
    FinishReason string   `json:"finish_reason"`
}

// Usage represents token usage
type Usage struct {
    PromptTokens     int `json:"prompt_tokens"`
    CompletionTokens int `json:"completion_tokens"`
    TotalTokens      int `json:"total_tokens"`
}

// ProviderInfo contains provider metadata
type ProviderInfo struct {
    ID           string   `json:"id"`
    DisplayName  string   `json:"display_name"`
    ProviderType string   `json:"provider_type"` // cloud, local, aggregator
    Features     []string `json:"features"` // streaming, vision, function_calling
}

// ModelInfo contains model metadata
type ModelInfo struct {
    ID                  string  `json:"id"`
    DisplayName         string  `json:"display_name"`
    ContextWindow       int     `json:"context_window"`
    SupportsVision      bool    `json:"supports_vision"`
    SupportsStreaming   bool    `json:"supports_streaming"`
    SupportsTools       bool    `json:"supports_tools"`
    InputCostPer1K      float64 `json:"input_cost_per_1k"`
    OutputCostPer1K     float64 `json:"output_cost_per_1k"`
}
```

### 5.3 Provider Factory

```go
// pkg/llm/factory.go

package llm

import (
    "fmt"
)

// ProviderFactory creates LLM provider instances
type ProviderFactory struct {
    registry map[string]ProviderConstructor
}

type ProviderConstructor func(config ProviderConfig) (Provider, error)

// ProviderConfig contains configuration for a provider
type ProviderConfig struct {
    ProviderID string
    APIKey     string // Encrypted at rest
    BaseURL    string // For custom endpoints
    Timeout    int    // Request timeout in seconds
    Extra      map[string]any // Provider-specific config
}

// NewProviderFactory creates a new factory with all built-in providers
func NewProviderFactory() *ProviderFactory {
    f := &ProviderFactory{
        registry: make(map[string]ProviderConstructor),
    }

    // Register built-in providers
    f.Register("openai", NewOpenAIProvider)
    f.Register("anthropic", NewAnthropicProvider)
    f.Register("gemini", NewGeminiProvider)
    f.Register("deepseek", NewDeepSeekProvider)
    f.Register("zhipu", NewZhipuProvider)
    f.Register("moonshot", NewMoonshotProvider)
    f.Register("bytedance", NewByteDanceProvider)
    f.Register("alibaba", NewAlibabaProvider)
    f.Register("baidu", NewBaiduProvider)
    f.Register("tencent", NewTencentProvider)
    f.Register("minimax", NewMinimaxProvider)
    f.Register("siliconflow", NewSiliconFlowProvider)
    f.Register("zai", NewZAIProvider)
    f.Register("openrouter", NewOpenRouterProvider)
    f.Register("together", NewTogetherProvider)
    f.Register("groq", NewGroqProvider)
    f.Register("fireworks", NewFireworksProvider)
    f.Register("ollama", NewOllamaProvider)
    f.Register("lmstudio", NewLMStudioProvider)
    f.Register("vllm", NewVLLMProvider)
    f.Register("custom", NewCustomProvider)

    return f
}

// Register adds a new provider constructor
func (f *ProviderFactory) Register(providerID string, constructor ProviderConstructor) {
    f.registry[providerID] = constructor
}

// Create creates a provider instance
func (f *ProviderFactory) Create(config ProviderConfig) (Provider, error) {
    constructor, ok := f.registry[config.ProviderID]
    if !ok {
        return nil, fmt.Errorf("unknown provider: %s", config.ProviderID)
    }
    return constructor(config)
}
```

### 5.4 OpenAI-Compatible Base Provider

Most providers support OpenAI-compatible APIs, so we implement a base provider:

```go
// pkg/llm/providers/openai_compatible.go

package providers

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"

    "omnitrade/pkg/llm"
)

// OpenAICompatibleProvider implements the Provider interface using OpenAI-compatible API
type OpenAICompatibleProvider struct {
    apiKey     string
    baseURL    string
    httpClient *http.Client
    providerID string
    headers    map[string]string
}

type OpenAICompatibleConfig struct {
    APIKey     string
    BaseURL    string
    ProviderID string
    Headers    map[string]string
    Timeout    time.Duration
}

func NewOpenAICompatibleProvider(cfg OpenAICompatibleConfig) *OpenAICompatibleProvider {
    return &OpenAICompatibleProvider{
        apiKey:     cfg.APIKey,
        baseURL:    cfg.BaseURL,
        providerID: cfg.ProviderID,
        headers:    cfg.Headers,
        httpClient: &http.Client{
            Timeout: cfg.Timeout,
        },
    }
}

func (p *OpenAICompatibleProvider) Generate(ctx context.Context, req *llm.GenerateRequest) (*llm.GenerateResponse, error) {
    body, err := json.Marshal(req)
    if err != nil {
        return nil, fmt.Errorf("marshaling request: %w", err)
    }

    httpReq, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewReader(body))
    if err != nil {
        return nil, fmt.Errorf("creating request: %w", err)
    }

    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

    // Add provider-specific headers
    for k, v := range p.headers {
        httpReq.Header.Set(k, v)
    }

    resp, err := p.httpClient.Do(httpReq)
    if err != nil {
        return nil, fmt.Errorf("executing request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API error: %s - %s", resp.Status, string(bodyBytes))
    }

    var result llm.GenerateResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("decoding response: %w", err)
    }

    return &result, nil
}

// GenerateStream implements streaming (simplified)
func (p *OpenAICompatibleProvider) GenerateStream(ctx context.Context, req *llm.GenerateRequest) (<-chan llm.StreamChunk, error) {
    req.Stream = true
    ch := make(chan llm.StreamChunk, 100)

    go func() {
        defer close(ch)
        // Implementation handles SSE streaming
    }()

    return ch, nil
}

// Additional methods (Embed, ListModels, GetProviderInfo)...
```

### 5.5 Agent Router

```go
// pkg/llm/agent_router.go

package llm

import (
    "context"
    "sync"
)

// AgentRouter routes agent requests to configured LLM models
type AgentRouter struct {
    factory   *ProviderFactory
    providers map[string]Provider
    config    AgentRouterConfig
    mu        sync.RWMutex
}

// AgentRouterConfig holds user's agent-to-model mappings
type AgentRouterConfig struct {
    // Map of agent_role -> model_config
    AgentModels map[string]AgentModelConfig
}

// AgentModelConfig defines which model an agent uses
type AgentModelConfig struct {
    ProviderID  string  `json:"provider_id"`
    ModelID     string  `json:"model_id"`
    Temperature float64 `json:"temperature"`
    MaxTokens   int     `json:"max_tokens"`
    SystemPrompt string `json:"system_prompt,omitempty"`
}

// AgentRole defines the available agent roles
type AgentRole string

const (
    AgentDataFetcher         AgentRole = "data_fetcher"
    AgentFundamentalAnalyst  AgentRole = "fundamental_analyst"
    AgentTechnicalAnalyst    AgentRole = "technical_analyst"
    AgentSentimentAnalyst    AgentRole = "sentiment_analyst"
    AgentRiskManager         AgentRole = "risk_manager"
    AgentPortfolioManager    AgentRole = "portfolio_manager"
    AgentQuantitativeAnalyst AgentRole = "quantitative_analyst"
    AgentNewsSummarizer      AgentRole = "news_summarizer"
)

// GenerateForAgent routes a generation request for a specific agent role
func (r *AgentRouter) GenerateForAgent(
    ctx context.Context,
    role AgentRole,
    messages []Message,
) (*GenerateResponse, error) {
    r.mu.RLock()
    config, ok := r.config.AgentModels[string(role)]
    r.mu.RUnlock()

    if !ok {
        // Fall back to default
        config = r.getDefaultConfig(role)
    }

    provider, err := r.getProvider(config.ProviderID)
    if err != nil {
        return nil, err
    }

    req := &GenerateRequest{
        Model:       config.ModelID,
        Messages:    messages,
        Temperature: config.Temperature,
        MaxTokens:   config.MaxTokens,
    }

    if config.SystemPrompt != "" {
        req.Messages = prependSystemPrompt(req.Messages, config.SystemPrompt)
    }

    return provider.Generate(ctx, req)
}

// UpdateAgentConfig updates the model configuration for an agent
func (r *AgentRouter) UpdateAgentConfig(role AgentRole, config AgentModelConfig) {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.config.AgentModels[string(role)] = config
}

func (r *AgentRouter) getProvider(providerID string) (Provider, error) {
    if p, ok := r.providers[providerID]; ok {
        return p, nil
    }
    // Load provider config from database and create instance
    // ...
}
```

## 6. Configuration Schema

### 6.1 LLM Routing Configuration

Users configure agent-to-model mappings via the UI or configuration file:

```yaml
# config/llm_routing.yaml

# Default configurations (can be overridden per user)
defaults:
  data_fetcher:
    provider: "ollama"
    model: "llama3.2:3b"
    temperature: 0.1
    max_tokens: 1000

  fundamental_analyst:
    provider: "openai"
    model: "gpt-5-mini"
    temperature: 0.3
    max_tokens: 4000

  technical_analyst:
    provider: "deepseek"
    model: "deepseek-chat"
    temperature: 0.2
    max_tokens: 2000

  sentiment_analyst:
    provider: "ollama"
    model: "llama3.2:3b"
    temperature: 0.4
    max_tokens: 1500

  risk_manager:
    provider: "anthropic"
    model: "claude-sonnet-4-6"
    temperature: 0.2
    max_tokens: 3000

  portfolio_manager:
    provider: "anthropic"
    model: "claude-opus-4-6"
    temperature: 0.5
    max_tokens: 4000
    system_prompt: |
      You are the Portfolio Manager agent responsible for synthesizing
      signals from multiple analyst agents and making final trading decisions.

  quantitative_analyst:
    provider: "gemini"
    model: "gemini-3-flash"
    temperature: 0.3
    max_tokens: 3000

  news_summarizer:
    provider: "ollama"
    model: "llama3.2:1b"
    temperature: 0.3
    max_tokens: 500

# Provider credentials (stored encrypted in database, shown here for reference)
providers:
  openai:
    api_key: "${OPENAI_API_KEY}"
    base_url: "https://api.openai.com/v1"

  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"
    base_url: "https://api.anthropic.com/v1"

  gemini:
    api_key: "${GOOGLE_API_KEY}"

  deepseek:
    api_key: "${DEEPSEEK_API_KEY}"
    base_url: "https://api.deepseek.com/v1"

  zhipu:
    api_key: "${ZHIPU_API_KEY}"
    base_url: "https://open.bigmodel.cn/api/paas/v4"

  moonshot:
    api_key: "${MOONSHOT_API_KEY}"
    base_url: "https://api.moonshot.cn/v1"

  bytedance:
    api_key: "${BYTEDANCE_API_KEY}"
    base_url: "https://ark.cn-beijing.volces.com/api/v3"

  alibaba:
    api_key: "${ALIBABA_API_KEY}"
    base_url: "https://dashscope.aliyuncs.com/api/v1"

  baidu:
    api_key: "${BAIDU_API_KEY}"
    secret_key: "${BAIDU_SECRET_KEY}"

  tencent:
    api_key: "${TENCENT_API_KEY}"
    base_url: "https://api.hunyuan.cloud.tencent.com/v1"

  minimax:
    api_key: "${MINIMAX_API_KEY}"
    group_id: "${MINIMAX_GROUP_ID}"
    base_url: "https://api.minimax.chat/v1"

  siliconflow:
    api_key: "${SILICONFLOW_API_KEY}"
    base_url: "https://api.siliconflow.cn/v1"

  zai:
    api_key: "${ZAI_API_KEY}"
    base_url: "https://api.z.ai/v1"

  openrouter:
    api_key: "${OPENROUTER_API_KEY}"
    base_url: "https://openrouter.ai/api/v1"

  together:
    api_key: "${TOGETHER_API_KEY}"
    base_url: "https://api.together.xyz/v1"

  groq:
    api_key: "${GROQ_API_KEY}"
    base_url: "https://api.groq.com/openai/v1"

  fireworks:
    api_key: "${FIREWORKS_API_KEY}"
    base_url: "https://api.fireworks.ai/inference/v1"

  ollama:
    base_url: "http://localhost:11434/v1"

  lmstudio:
    base_url: "http://localhost:1234/v1"

  vllm:
    base_url: "http://localhost:8000/v1"
```

### 6.2 Available Models Catalog

The system maintains a catalog of available models with their capabilities:

```yaml
# config/models_catalog.yaml

providers:
  openai:
    models:
      # GPT-5 Series (Released August 2025)
      - id: "gpt-5"
        display_name: "GPT-5"
        context_window: 1000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.02
        output_cost_per_1k: 0.06

      - id: "gpt-5-pro"
        display_name: "GPT-5 Pro"
        context_window: 1000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.03
        output_cost_per_1k: 0.10

      - id: "gpt-5-mini"
        display_name: "GPT-5 Mini"
        context_window: 128000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0003
        output_cost_per_1k: 0.0012

      - id: "gpt-5-nano"
        display_name: "GPT-5 Nano"
        context_window: 128000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0001
        output_cost_per_1k: 0.0004

      - id: "gpt-5.1"
        display_name: "GPT-5.1"
        context_window: 1000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.025
        output_cost_per_1k: 0.075

      # O-Series (Reasoning Models)
      - id: "o3-mini"
        display_name: "o3 Mini"
        context_window: 200000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0011
        output_cost_per_1k: 0.0044

      - id: "o3-pro"
        display_name: "o3 Pro"
        context_window: 200000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.02
        output_cost_per_1k: 0.08

  anthropic:
    models:
      - id: "claude-opus-4-6"
        display_name: "Claude Opus 4.6"
        context_window: 200000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.015
        output_cost_per_1k: 0.075

      - id: "claude-sonnet-4-6"
        display_name: "Claude Sonnet 4.6"
        context_window: 200000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.003
        output_cost_per_1k: 0.015

      - id: "claude-haiku-4-5"
        display_name: "Claude Haiku 4.5"
        context_window: 200000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0008
        output_cost_per_1k: 0.004

  gemini:
    models:
      # Gemini 3 Series (Released Late 2025)
      - id: "gemini-3-pro"
        display_name: "Gemini 3 Pro"
        context_window: 20000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0025
        output_cost_per_1k: 0.01

      - id: "gemini-3-flash"
        display_name: "Gemini 3 Flash"
        context_window: 1000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0001
        output_cost_per_1k: 0.0004

      # Gemini 2.5 Series
      - id: "gemini-2.5-pro"
        display_name: "Gemini 2.5 Pro"
        context_window: 1000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.00125
        output_cost_per_1k: 0.005

      - id: "gemini-2.5-flash"
        display_name: "Gemini 2.5 Flash"
        context_window: 1000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0001
        output_cost_per_1k: 0.0004

  deepseek:
    models:
      # DeepSeek V4 (Released March 2026)
      - id: "deepseek-v4"
        display_name: "DeepSeek V4"
        context_window: 1000000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0002
        output_cost_per_1k: 0.0006

      - id: "deepseek-chat"
        display_name: "DeepSeek Chat (V3)"
        context_window: 64000
        supports_vision: false
        supports_tools: true
        input_cost_per_1k: 0.00014
        output_cost_per_1k: 0.00028

      - id: "deepseek-reasoner"
        display_name: "DeepSeek R1 (Reasoner)"
        context_window: 64000
        supports_vision: false
        supports_tools: false
        input_cost_per_1k: 0.00055
        output_cost_per_1k: 0.00219

  zhipu:
    models:
      # GLM-5 Series (Released February 2026)
      - id: "glm-5"
        display_name: "GLM-5 (745B)"
        context_window: 202000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.002
        output_cost_per_1k: 0.008

      - id: "glm-4-plus"
        display_name: "GLM-4 Plus"
        context_window: 128000
        supports_vision: false
        supports_tools: true
        input_cost_per_1k: 0.001
        output_cost_per_1k: 0.004

      - id: "glm-4-air"
        display_name: "GLM-4 Air"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "glm-4-flash"
        display_name: "GLM-4 Flash"
        context_window: 128000
        supports_vision: false
        supports_tools: true

  moonshot:
    models:
      # Kimi K2 Series (2025-2026)
      - id: "kimi-k2-thinking"
        display_name: "Kimi K2 Thinking"
        context_window: 256000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.002
        output_cost_per_1k: 0.006

      - id: "kimi-k2"
        display_name: "Kimi K2"
        context_window: 256000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.001
        output_cost_per_1k: 0.003

      - id: "moonshot-v1-128k"
        display_name: "Kimi V1 (128K)"
        context_window: 131072
        supports_vision: false
        supports_tools: true

  bytedance:
    models:
      # Doubao 2.0 Series (Released February 2026)
      - id: "doubao-2-pro"
        display_name: "Doubao 2.0 Pro"
        context_window: 256000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0015
        output_cost_per_1k: 0.006

      - id: "doubao-2-lite"
        display_name: "Doubao 2.0 Lite"
        context_window: 128000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0003
        output_cost_per_1k: 0.001

      - id: "doubao-2-mini"
        display_name: "Doubao 2.0 Mini"
        context_window: 128000
        supports_vision: true
        supports_tools: true
        input_cost_per_1k: 0.0001
        output_cost_per_1k: 0.0003

      - id: "doubao-2-code"
        display_name: "Doubao 2.0 Code"
        context_window: 128000
        supports_vision: false
        supports_tools: true
        input_cost_per_1k: 0.001
        output_cost_per_1k: 0.003

  alibaba:
    models:
      # Qwen3 Series (Released April 2025)
      - id: "qwen3-235b-a22b"
        display_name: "Qwen3 235B (MoE)"
        context_window: 128000
        supports_vision: false
        supports_tools: true
        input_cost_per_1k: 0.001
        output_cost_per_1k: 0.004

      - id: "qwen3-32b"
        display_name: "Qwen3 32B"
        context_window: 128000
        supports_vision: false
        supports_tools: true
        input_cost_per_1k: 0.0005
        output_cost_per_1k: 0.002

      - id: "qwen3-coder"
        display_name: "Qwen3 Coder (480B)"
        context_window: 128000
        supports_vision: false
        supports_tools: true
        input_cost_per_1k: 0.002
        output_cost_per_1k: 0.006

      - id: "qwen3-vl"
        display_name: "Qwen3 VL (Vision)"
        context_window: 128000
        supports_vision: true
        supports_tools: true

      - id: "qwen-max"
        display_name: "Qwen Max"
        context_window: 32768
        supports_vision: false
        supports_tools: true

      - id: "qwen-plus"
        display_name: "Qwen Plus"
        context_window: 131072
        supports_vision: false
        supports_tools: true

  baidu:
    models:
      - id: "ernie-4.5-8k"
        display_name: "ERNIE 4.5 (8K)"
        context_window: 8192
        supports_vision: false
        supports_tools: true

      - id: "ernie-4.0-8k"
        display_name: "ERNIE 4.0 (8K)"
        context_window: 8192
        supports_vision: false
        supports_tools: true

  tencent:
    models:
      - id: "hunyuan-pro"
        display_name: "Hunyuan Pro"
        context_window: 32000
        supports_vision: false
        supports_tools: true

      - id: "hunyuan-lite"
        display_name: "Hunyuan Lite"
        context_window: 256000
        supports_vision: false
        supports_tools: true

  minimax:
    models:
      - id: "abab7-chat"
        display_name: "ABAB 7 Chat"
        context_window: 245000
        supports_vision: false
        supports_tools: true

      - id: "abab6.5-chat"
        display_name: "ABAB 6.5 Chat"
        context_window: 245000
        supports_vision: false
        supports_tools: true

  siliconflow:
    models:
      - id: "Qwen/Qwen3-235B-A22B"
        display_name: "Qwen3 235B (via SiliconFlow)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "deepseek-ai/DeepSeek-V4"
        display_name: "DeepSeek V4 (via SiliconFlow)"
        context_window: 1000000
        supports_vision: true
        supports_tools: true

  zai:
    models:
      # Z.ai (Zhipu's International Portal)
      - id: "glm-5"
        display_name: "GLM-5 (via Z.ai)"
        context_window: 202000
        supports_vision: true
        supports_tools: true

      - id: "z1-32b"
        display_name: "Z1 32B (Reasoning)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "z1-rumination-32b"
        display_name: "Z1 Rumination 32B (Deep Research)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

  openrouter:
    models:
      # OpenRouter provides access to 200+ models through a single API
      # Model ID format: provider/model

      # Anthropic via OpenRouter
      - id: "anthropic/claude-opus-4.6"
        display_name: "Claude Opus 4.6 (via OpenRouter)"
        context_window: 200000
        supports_vision: true
        supports_tools: true

      - id: "anthropic/claude-sonnet-4.6"
        display_name: "Claude Sonnet 4.6 (via OpenRouter)"
        context_window: 200000
        supports_vision: true
        supports_tools: true

      - id: "anthropic/claude-haiku-4.5"
        display_name: "Claude Haiku 4.5 (via OpenRouter)"
        context_window: 200000
        supports_vision: true
        supports_tools: true

      # OpenAI via OpenRouter
      - id: "openai/gpt-5"
        display_name: "GPT-5 (via OpenRouter)"
        context_window: 1000000
        supports_vision: true
        supports_tools: true

      - id: "openai/gpt-5-pro"
        display_name: "GPT-5 Pro (via OpenRouter)"
        context_window: 1000000
        supports_vision: true
        supports_tools: true

      - id: "openai/gpt-5-mini"
        display_name: "GPT-5 Mini (via OpenRouter)"
        context_window: 128000
        supports_vision: true
        supports_tools: true

      - id: "openai/o3-mini"
        display_name: "o3 Mini (via OpenRouter)"
        context_window: 200000
        supports_vision: true
        supports_tools: true

      # Google via OpenRouter
      - id: "google/gemini-3-pro"
        display_name: "Gemini 3 Pro (via OpenRouter)"
        context_window: 20000000
        supports_vision: true
        supports_tools: true

      - id: "google/gemini-3-flash"
        display_name: "Gemini 3 Flash (via OpenRouter)"
        context_window: 1000000
        supports_vision: true
        supports_tools: true

      - id: "google/gemini-2.5-pro"
        display_name: "Gemini 2.5 Pro (via OpenRouter)"
        context_window: 1000000
        supports_vision: true
        supports_tools: true

      # DeepSeek via OpenRouter
      - id: "deepseek/deepseek-v4"
        display_name: "DeepSeek V4 (via OpenRouter)"
        context_window: 1000000
        supports_vision: true
        supports_tools: true

      - id: "deepseek/deepseek-chat"
        display_name: "DeepSeek Chat (via OpenRouter)"
        context_window: 64000
        supports_vision: false
        supports_tools: true

      - id: "deepseek/deepseek-r1"
        display_name: "DeepSeek R1 (via OpenRouter)"
        context_window: 64000
        supports_vision: false
        supports_tools: false

      # Meta Llama via OpenRouter
      - id: "meta-llama/llama-3.3-70b-instruct"
        display_name: "Llama 3.3 70B (via OpenRouter)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "meta-llama/llama-3.2-3b-instruct"
        display_name: "Llama 3.2 3B (via OpenRouter)"
        context_window: 128000
        supports_vision: true
        supports_tools: true

      # Qwen via OpenRouter
      - id: "qwen/qwen3-235b-a22b"
        display_name: "Qwen3 235B MoE (via OpenRouter)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "qwen/qwen3-32b"
        display_name: "Qwen3 32B (via OpenRouter)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "qwen/qwen-2.5-72b-instruct"
        display_name: "Qwen 2.5 72B (via OpenRouter)"
        context_window: 131072
        supports_vision: false
        supports_tools: true

      # Mistral via OpenRouter
      - id: "mistralai/mistral-large-2"
        display_name: "Mistral Large 2 (via OpenRouter)"
        context_window: 128000
        supports_vision: true
        supports_tools: true

      - id: "mistralai/codestral-latest"
        display_name: "Codestral (via OpenRouter)"
        context_window: 32768
        supports_vision: false
        supports_tools: true

      # Kimi/Moonshot via OpenRouter
      - id: "moonshotai/kimi-k2"
        display_name: "Kimi K2 (via OpenRouter)"
        context_window: 256000
        supports_vision: true
        supports_tools: true

      # Perplexity via OpenRouter
      - id: "perplexity/sonar-pro"
        display_name: "Sonar Pro (via OpenRouter)"
        context_window: 200000
        supports_vision: false
        supports_tools: true

      - id: "perplexity/sonar-reasoning"
        display_name: "Sonar Reasoning (via OpenRouter)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      # xAI Grok via OpenRouter
      - id: "x-ai/grok-3"
        display_name: "Grok 3 (via OpenRouter)"
        context_window: 131072
        supports_vision: true
        supports_tools: true

      - id: "x-ai/grok-2"
        display_name: "Grok 2 (via OpenRouter)"
        context_window: 131072
        supports_vision: true
        supports_tools: true

      # Free/低成本模型
      - id: "nousresearch/hermes-3-llama-3.1-405b"
        display_name: "Hermes 3 405B (via OpenRouter)"
        context_window: 128000
        supports_vision: false
        supports_tools: true

  ollama:
    models:
      # Ollama models are discovered dynamically from local installation
      # Common models listed for reference
      - id: "llama3.3:70b"
        display_name: "Llama 3.3 70B"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "llama3.2:3b"
        display_name: "Llama 3.2 3B"
        context_window: 128000
        supports_vision: true
        supports_tools: true

      - id: "qwen3:32b"
        display_name: "Qwen3 32B"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "deepseek-r1:70b"
        display_name: "DeepSeek R1 70B"
        context_window: 128000
        supports_vision: false
        supports_tools: false

      - id: "qwen2.5-coder:32b"
        display_name: "Qwen2.5 Coder 32B"
        context_window: 128000
        supports_vision: false
        supports_tools: true

      - id: "mistral:7b"
        display_name: "Mistral 7B"
        context_window: 32768
        supports_vision: false
        supports_tools: true

  lmstudio:
    models:
      # LM Studio models are discovered dynamically from local installation
      # Any GGUF format model can be loaded
      - id: "local-model"
        display_name: "Local Model (Dynamic)"
        context_window: 8192
        supports_vision: false
        supports_tools: false

  vllm:
    models:
      # vLLM serves any HuggingFace model
      # Models are discovered dynamically
      - id: "local-model"
        display_name: "Local Model (Dynamic)"
        context_window: 8192
        supports_vision: false
        supports_tools: true
```

## 7. Backend Architecture

### 7.1 Tech Stack
- **Language**: Go 1.24+
- **Router**: `go-chi/chi` v5.x
- **Database**: `sqlx` with PostgreSQL 17.x
- **Vector Store**: pgvector extension
- **AI Framework**: Google Genkit Go SDK (latest)
- **Cache**: Redis 8.x
- **Message Queue**: Redis Streams or Kafka 4.x

### 7.2 API Endpoints

```
# Market Data
GET    /api/v1/market/:symbol              - Get current price
GET    /api/v1/market/:symbol/history      - Get historical data
WS     /api/v1/market/stream               - Real-time market stream

# Trade Proposals
GET    /api/v1/proposals                   - List pending proposals
POST   /api/v1/proposals                   - Create proposal (AI)
POST   /api/v1/proposals/:id/approve       - Approve proposal (Human)
POST   /api/v1/proposals/:id/reject        - Reject proposal (Human)

# LLM Configuration
GET    /api/v1/llm/providers               - List available providers
POST   /api/v1/llm/providers               - Add/configure provider
PUT    /api/v1/llm/providers/:id           - Update provider config
DELETE /api/v1/llm/providers/:id           - Remove provider

GET    /api/v1/llm/models                  - List available models
GET    /api/v1/llm/models/:provider        - List models by provider

GET    /api/v1/llm/agents                  - List agent roles
GET    /api/v1/llm/agents/config           - Get agent model mappings
PUT    /api/v1/llm/agents/:role/config     - Update agent model mapping

POST   /api/v1/llm/test                    - Test LLM connection

# Audit
GET    /api/v1/audit/logs                  - List audit logs
GET    /api/v1/audit/proposals/:id         - Get proposal audit trail
```

## 8. Security Considerations

### 8.1 API Key Management
- All LLM API keys are encrypted at rest using AES-256-GCM
- Keys are decrypted only at runtime when making API calls
- Keys are never logged or exposed in API responses
- Support for environment variable injection for CI/CD

### 8.2 Database Access Control
```sql
-- AI agents use read-only role
CREATE ROLE medisync_readonly NOINHERIT;
GRANT CONNECT ON DATABASE omnitrade TO medisync_readonly;
GRANT USAGE ON SCHEMA public TO medisync_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO medisync_readonly;

-- Action plane uses read-write role
CREATE ROLE medisync_readwrite NOINHERIT;
GRANT CONNECT ON DATABASE omnitrade TO medisync_readwrite;
GRANT USAGE ON SCHEMA public TO medisync_readwrite;
GRANT SELECT, INSERT, UPDATE ON trade_proposals, audit_logs TO medisync_readwrite;
```

## 9. Deployment

### 9.1 Container Structure
```yaml
# docker-compose.yml structure
services:
  postgres:
    image: postgres:17
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:8-alpine

  data-ingestion:
    build: ./services/data-ingestion
    depends_on: [postgres]

  intelligence-service:
    build: ./services/intelligence
    depends_on: [postgres, redis]

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
```

### 9.2 Environment Variables
```bash
# Required environment variables
DATABASE_URL=postgresql://user:pass@localhost:5432/omnitrade
REDIS_URL=redis://localhost:6379

# LLM Provider Keys (all optional - configure what you need)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
ZHIPU_API_KEY=
MOONSHOT_API_KEY=
BYTEDANCE_API_KEY=
ALIBABA_API_KEY=
BAIDU_API_KEY=
BAIDU_SECRET_KEY=
TENCENT_API_KEY=
MINIMAX_API_KEY=
MINIMAX_GROUP_ID=
SILICONFLOW_API_KEY=
ZAI_API_KEY=
OPENROUTER_API_KEY=
TOGETHER_API_KEY=
GROQ_API_KEY=
FIREWORKS_API_KEY=

# Local LLM endpoints (optional)
OLLAMA_BASE_URL=http://localhost:11434
LMSTUDIO_BASE_URL=http://localhost:1234
VLLM_BASE_URL=http://localhost:8000
```

## 10. Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Go backend with `go-chi` router
- [ ] Setup React 19 + Vite 6 frontend
- [ ] Implement database schema with read-only roles
- [ ] Build data ingestion pipelines

### Phase 2: LLM Abstraction (Week 3-4)
- [ ] Implement LLM Provider interface
- [ ] Build OpenAI-compatible base provider
- [ ] Add support for all cloud providers
- [ ] Add support for local providers (Ollama, LMStudio)
- [ ] Build Agent Router with configurable mappings
- [ ] Create LLM configuration UI

### Phase 3: Intelligence Plane (Week 5-6)
- [ ] Initialize Google Genkit
- [ ] Develop specialized agents
- [ ] Implement RAG for financial documents
- [ ] Build multi-agent orchestration

### Phase 4: Action Plane & UI (Week 7-8)
- [ ] Build HITL approval interface
- [ ] Implement audit logging
- [ ] Polish "Liquid Glass" UI
- [ ] Add backtesting visualization
