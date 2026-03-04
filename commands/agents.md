---
name: agents
description: Agent orchestration commands for OmniTrade's Genkit multi-agent system - list, status, debug, and manage AI agents
---

# Agent Orchestration

## Commands Reference

### `/agents:list`
Display all available agents with their current status and timeout configurations.

**Usage:**
```
/agents:list
```

**Shows:**
| Agent | Model | Timeout | Status | Required |
|-------|-------|---------|--------|----------|
| Data Fetcher | Go (no LLM) | 5s | Active | Yes |
| Fundamental Analyst | gpt-4o | 30s | Active | Yes |
| Technical Analyst | gemini-1.5-flash | 10s | Active | Yes |
| Sentiment Analyst | llama3.2:3b | 15s | Standby | No |
| Risk Manager | claude-3-5-haiku | 20s | Active | Yes |
| Portfolio Manager | claude-3-5-sonnet | 60s | Active | Yes |

### `/agents:status <agent-name>`
Check detailed status of a specific agent including recent execution logs.

**Usage:**
```
/agents:status fundamental-analyst
/agents:status risk-manager
```

**Shows:**
- Last execution timestamp
- Average response time
- Error rate
- Recent outputs

### `/agents:debug <flow-name>`
Debug a Genkit flow with detailed trace information.

**Usage:**
```
/agents:debug GenerateTradeProposal
```

**Provides:**
- Per-agent timing breakdown
- Error traces (if any)
- Intermediate outputs
- Confidence score calculation

### `/agents:test <agent-name> <mock-data>`
Test an agent with mock market data without affecting production.

**Usage:**
```
/agents:test technical-analyst mock_data/AAPL_bullish.json
```

**Use for:**
- Agent development
- Testing new prompts
- Validating timeout configurations

## Agent Topology

```
┌─────────────────────────────────────┐
│         Trigger Event               │
│    (Cron / API Signal / Manual)     │
└─────────────────┬───────────────────┘
                  ↓
        ┌─────────────────┐
        │   Data Fetcher  │ ← Go functions (no LLM)
        │      5s timeout │
        └────────┬────────┘
                 ↓
┌─────────────────────────────────────┐
│      Parallel Analysis Layer        │ ← errgroup concurrent
│  ┌──────────────────────────────┐  │
│  │ Fundamental Analyst (30s)    │  │ ← Required
│  │ Technical Analyst (10s)      │  │ ← Required
│  │ Sentiment Analyst (15s)      │  │ ← Optional
│  │ News Summarizer (10s)        │  │ ← Optional
│  └──────────────────────────────┘  │
└─────────────────┬───────────────────┘
                  ↓
        ┌─────────────────┐
        │   Risk Manager  │ ← MANDATORY VETO
        │     20s timeout │
        └────────┬────────┘
                 ↓
        ┌─────────────────┐
        │ Portfolio       │ ← Synthesis
        │   Manager       │
        │    60s timeout  │
        └────────┬────────┘
                 ↓
        TradeProposal → HITL Queue
```

## Agent Registry

Edit `backend/internal/agent/orchestrator.go` to modify agent configurations.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Flow hangs at 30s | Fundamental Analyst timeout | Increase timeout in orchestrator |
| REJECT on all trades | VIX > 40 circuit breaker | Check market conditions |
| Low confidence scores | Agent disagreement | Review conflict resolution formula |
| Optional agent missing | Service unavailable | Check MCP server status |
