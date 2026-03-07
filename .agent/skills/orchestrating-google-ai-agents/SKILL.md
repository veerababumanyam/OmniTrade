---
name: orchestrating-google-ai-agents
description: Orchestrates multi-agent systems using the Google AI Agent ecosystem, including ADK (Agent Development Kit), A2A (Agent2Agent Protocol), and Genkit. Use when implementing agent discovery, inter-agent communication, or complex Genkit flows.
---

# Orchestrating Google AI Agents

This skill provides the logic for building, deploying, and coordinating AI agents using Google's modular ecosystem and the **OmniTrade MCP Gateway**.

## When to use this skill
- When building multi-agent systems where agents need to discover and talk to each other.
- When configuring multi-model failover or cost routing via **omnitrade-gateway**.
- When discovering or executing backend flows via **genkit-mcp-server**.
- When creating complex **Genkit Flows** or custom **Genkit Tools**.

## Workflow

- [ ] **Discovery**: Use **`genkit-mcp-server:list_flows`** to see available agent tools.
- [ ] **Execution**: Use **`genkit-mcp-server:run_flow`** to trigger long-running analysis.
- [ ] **Model Selection**: Use **`omnitrade-gateway`** to route specific tasks to specialized models (e.g., Gemini 1.5 Pro for market context, Claude 3.5 for code).
- [ ] **Define Agent Role**: Use ADK to define the agent's purpose, model, and toolset.
- [ ] **Create Agent Card**: Generate a JSON-based A2A Agent Card for discovery.
- [ ] **Implement Genkit Flow**: Define the orchestrator logic using `genkit.DefineFlow`.

## Instructions

### 1. Multi-Model Gateway (omnitrade-gateway)
The LiteLLM gateway allows agents to utilize over 100+ models.
- **Failover**: If a primary model (e.g., GPT-4) hits a rate limit, the gateway can automatically route to a secondary model.
- **Cost Efficiency**: Route sub-tasks like "Summarization" to cheaper models while keeping "Reasoning" on high-tier models.

### 2. Genkit Flow Debugging (genkit-mcp-server)
Use the MCP server to inspect backend logic live.
```bash
# List all registered flows
tools/call genkit-mcp-server list_flows {}

# Inspect a specific flow's input schema
tools/call genkit-mcp-server get_flow_info { "flowName": "analyzeFundamentalData" }
```

### 3. Agent Development Kit (ADK)
ADK focuses on modularity. When defining an agent, separate the **Capability** (what it can do) from the **Logic** (how it thinks).
- Use `agent.Capability` to wrap tools.
- Use `agent.Orchestrator` to manage handoffs between specialized agents.

## Resources
- [Leveraging MCP Ecosystem](../leveraging-omnitrade-mcp-ecosystem/SKILL.md)
- [Agent Card Template](resources/AGENT_CARD_TEMPLATE.json)
- [Example: A2A Handshake](examples/a2a-handshake.go)
- [Genkit Reference](https://genkit.dev/docs/go)
