# OmniTrade Plugin Agents Reference

## Overview

OmniTrade plugin includes four specialized agents for expert assistance across trading, risk, debugging, and frontend development. Agents are invoked automatically based on task context or can be summoned explicitly.

## Agent List

### 1. Trading Reviewer Agent

**File**: `agents/trading-reviewer.md`

**Purpose**: Post-trade analysis, compliance validation, performance reporting

**When Invoked**:
- Reviewing executed trades
- Analyzing trade performance vs. predictions
- Validating compliance with financial rules
- Investigating rejected or failed trades
- Generating daily/weekly performance reports

**Key Capabilities**:
```markdown
✓ Pre-trade validation (confidence ≥ 0.70, HITL enforced)
✓ Execution quality analysis (slippage, timing)
✓ Performance vs. prediction comparison
✓ Compliance checklist (decimal types, audit logs, role-based access)
✓ Red flag detection (rule violations, missing approvals)
```

**Model**: claude-3-5-sonnet (temperature: 0.3)
**Max Tokens**: 4000

**Tools Available**:
- ReadTool: Access trade_proposals, immutable_audit_log
- SearchTool: Query historical trades
- CalculateTool: Performance metrics, Sharpe ratio
- ValidateTool: Compliance checks

**Output Format**: Structured markdown with executive summary, metrics, compliance checklist, recommendations

### 2. Risk Analyst Agent

**File**: `agents/risk-analyst.md`

**Purpose**: Market risk assessment, portfolio exposure analysis, circuit breaker monitoring

**When Invoked**:
- Analyzing current market risk conditions
- Evaluating portfolio exposure and concentration
- Checking VIX levels and circuit breaker status
- Assessing position sizing for new trades
- Generating risk reports

**Key Capabilities**:
```markdown
✓ VIX-based circuit breakers (30, 40 thresholds)
✓ Position limits (10% single, 25% sector)
✓ Portfolio concentration analysis (HHI)
✓ Value at Risk (VaR) calculation
✓ Maximum drawdown tracking
✓ Scenario analysis (best/base/worst/black swan)
```

**Risk Limits**:
```go
const (
    MaxSinglePositionPct = 0.10  // 10% max per asset
    MaxSectorExposurePct = 0.25  // 25% max per sector
    VIXReduceThreshold   = 30.0  // 50% size reduction
    VIXHoldThreshold     = 40.0  // Hold only, no new buys
)
```

**Model**: claude-3-5-sonnet (temperature: 0.2)
**Max Tokens**: 3000

**Tools Available**:
- GetVIX: Fetch current VIX index
- GetPortfolio: Query positions and allocations
- GetQuote: Real-time price data
- CalculateBeta: Compute beta vs. S&P 500
- CheckLimits: Validate position/sector limits
- HistoricalVolatility: Rolling volatility calculation

**Reporting**: Real-time alerts, hourly VIX monitoring, daily full risk report

### 3. Genkit Flow Debugger Agent

**File**: `agents/genkit-flow-debugger.md`

**Purpose**: Debug Google Genkit flows, trace agent execution, diagnose orchestration issues

**When Invoked**:
- A Genkit flow is failing or hanging
- Agent outputs are unexpected or incorrect
- Performance is slower than expected
- Investigating timeout issues
- Analyzing conflict resolution
- Debugging Risk Manager veto behavior

**Key Capabilities**:
```markdown
✓ Flow tracing through all agents and stages
✓ Performance bottleneck identification
✓ Error root cause analysis
✓ Agent conflict debugging
✓ Timeout issue diagnosis
✓ Optimization recommendations
```

**Flow Architecture**:
```
Data Fetcher (5s)
    ↓
Parallel Analysis (errgroup)
    ├─ Fundamental (30s) [REQUIRED]
    ├─ Technical (10s) [REQUIRED]
    ├─ Sentiment (15s) [OPTIONAL]
    └─ Alt Data (20s) [OPTIONAL]
    ↓
Risk Manager (20s) [MANDATORY VETO]
    ↓
Portfolio Manager (60s) [SYNTHESIS]
```

**Performance Baselines**:
- Expected total: < 120s (2 minutes)
- Any stage > baseline → investigate

**Model**: claude-3-5-sonnet (temperature: 0.1)
**Max Tokens**: 5000

**Debugging Workflow**:
1. Gather context (logs, agent status)
2. Analyze trace (Genkit UI)
3. Identify root cause (timing table)
4. Propose solution (code fix)

**Common Issues**:
- Flow hangs → Check agent timeouts
- Low confidence → Agent conflict analysis
- Unexpected REJECT → VIX/circuit breaker check

### 4. Frontend Architect Agent

**File**: `agents/frontend-architect.md`

**Purpose**: React 19, Vanilla CSS "Liquid Glass" design, component architecture

**When Invoked**:
- Building new UI components
- Implementing glassmorphism design
- Structuring React components/hooks
- Designing responsive layouts
- Creating real-time visualizations
- Implementing HITL approval queue UI

**Tech Stack**:
```json
{
  "framework": "React 19 + Vite",
  "styling": "Vanilla CSS (no Tailwind, no CSS-in-JS)",
  "state": "React 19 use() + Zustand",
  "real-time": "WebSocket",
  "charts": "TradingView Lightweight Charts",
  "forms": "React Hook Form + Zod"
}
```

**Design System: Liquid Glass**:
```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: rgba(0, 0, 0, 0.3);
}

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px var(--glass-shadow);
}
```

**Model**: claude-3-5-sonnet (temperature: 0.4)
**Max Tokens**: 4000

**Component Examples**:
- Glass Card (base component)
- Trade Proposal Card (HITL queue)
- Real-Time Market Chart
- Approval Queue UI

**Accessibility**: WCAG 2.2 Level AA minimum

## Agent Invocation

### Automatic Invocation

Agents invoke automatically based on task context:

| User Message | Agent Invoked |
|-------------|---------------|
| "Review the last trade" | trading-reviewer |
| "What's our risk exposure?" | risk-analyst |
| "Why is the flow hanging?" | genkit-flow-debugger |
| "Build a trade card component" | frontend-architect |

### Manual Invocation

Explicitly summon an agent:
```
Use the trading-reviewer agent to analyze this trade
```

## Agent Configuration

### Model Selection

Agents use specific models optimized for their tasks:

| Agent | Model | Temperature | Rationale |
|-------|-------|-------------|-----------|
| Trading Reviewer | claude-3-5-sonnet | 0.3 | Balanced creativity/consistency |
| Risk Analyst | claude-3-5-sonnet | 0.2 | Very low for consistent assessment |
| Flow Debugger | claude-3-5-sonnet | 0.1 | Very low for precise debugging |
| Frontend Architect | claude-3-5-sonnet | 0.4 | Higher for UI creativity |

### Tool Restrictions

Each agent has tool access appropriate to its domain:

**Trading Reviewer**: Read-only database access
**Risk Analyst**: Market data, portfolio queries
**Flow Debugger**: Logs, traces, Genkit UI
**Frontend Architect**: File system (frontend/ only)

## Custom Agent Creation

To add a new agent:

1. Create `.claude-plugin/agents/your-agent.md`
2. Add YAML frontmatter:
```yaml
---
name: your-agent
description: Use when [specific triggering conditions]
---
```

3. Define system prompt and capabilities
4. Specify model configuration
5. Document tools available
6. Restart Claude Code to load

## Agent Testing

Test an agent's behavior:

```bash
# Use skill with test scenario
/claude "Use the trading-reviewer agent to analyze a mock trade with confidence 0.65"

# Verify agent follows its rules
/claude "Use the risk-analyst agent with VIX at 45 - should recommend HOLD only"
```

## Agent Troubleshooting

### Agent Not Invoking

**Symptom**: Expected agent doesn't activate

**Diagnosis**:
1. Check agent description matches task
2. Verify agent file has correct frontmatter
3. Restart Claude Code
4. Check for conflicting agents

### Agent Misbehaving

**Symptom**: Agent violates its own rules

**Diagnosis**:
1. Review agent's system prompt
2. Check for unclear instructions
3. Add explicit red flags section
4. Test with pressure scenarios

### Agent Performance Issues

**Symptom**: Agent too slow or token-heavy

**Diagnosis**:
1. Reduce maxTokens setting
2. Lower temperature for consistency
3. Simplify system prompt
4. Add quick reference section

## Related Documentation

- [Commands Reference](./commands.md)
- [Hooks Configuration](./hooks.md)
- [MCP Integration](./mcp-integration.md)
