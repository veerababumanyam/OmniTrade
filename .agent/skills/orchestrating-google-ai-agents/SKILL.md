---
name: orchestrating-google-ai-agents
description: Orchestrates multi-agent systems using the Google AI Agent ecosystem, including ADK (Agent Development Kit), A2A (Agent2Agent Protocol), and Genkit. Use when implementing agent discovery, inter-agent communication, or complex Genkit flows.
---

# Orchestrating Google AI Agents

This skill provides the logic for building, deploying, and coordinating AI agents using Google's modular ecosystem. It covers the **Agent Development Kit (ADK)** for building agents, the **Agent2Agent (A2A)** protocol for collaboration, and **Genkit** for application-level orchestration.

## When to use this skill
- When building multi-agent systems where agents need to discover and talk to each other.
- When implementing **A2A Agent Cards** for interoperability.
- When creating complex **Genkit Flows** or custom **Genkit Tools**.
- When deploying agents to Vertex AI Agent Engine or Cloud Run.

## Workflow

- [ ] **Define Agent Role**: Use ADK to define the agent's purpose, model (Gemini), and toolset.
- [ ] **Create Agent Card**: Generate a JSON-based A2A Agent Card for discovery.
- [ ] **Implement Genkit Flow**: Define the orchestrator logic using `genkit.DefineFlow`.
- [ ] **Equip Tools**: Register functions as tools using `genkit.DefineTool` or ADK custom tools.
- [ ] **Configure A2A Discovery**: Set up the discovery endpoint or registry for inter-agent communication.
- [ ] **Validate multi-agent diplomacy**: Ensure conflict resolution patterns are in place for agent disagreements.

## Instructions

### 1. Agent Development Kit (ADK)
ADK focuses on modularity. When defining an agent, separate the **Capability** (what it can do) from the **Logic** (how it thinks).
- Use `agent.Capability` to wrap tools.
- Use `agent.Orchestrator` to manage handoffs between specialized agents.
- **Blueprint-First Assembly**: Design agents that output "Functional Blueprints" for UI assembly.
- **Signal Bus Integration**: Agents must publish telemetry and status updates via the high-frequency event bus for real-time UI reflection.

### 2. Agent2Agent (A2A) Protocol
Standardize agent metadata using Agent Cards.
- **Agent Card**: A manifest file (usually `.well-known/agent-card.json`) that describes capabilities, safety boundaries, and pricing.
- **Handshake**: Use the A2A handshake protocol for secure context exchange between a Client Agent and a Remote Agent.

### 3. Google Genkit (Go Integration)
In the OmniTrade backend, use Genkit for typed flows:
- **Define Flow**:
  ```go
  genkit.DefineFlow("marketAnalysisFlow", func(ctx context.Context, input string) (OutputStruct, error) {
      // Logic here
  })
  ```
- **Define Tool**:
  ```go
  genkit.DefineTool("getPrice", "gets current asset price", func(ctx context.Context, input struct{Symbol string}) (float64, error) {
      // Tool logic
  })
  ```

### 4. Conflict Resolution (Three-Plane Architecture)
Following the OmniTrade architecture:
- Data Plane agents provide telemetry.
- Intelligence Plane agents debate (Debate Topology).
- Action Plane agents require HITL (Human-in-the-Loop) before commit.

## Resources
- [Agent Card Template](resources/AGENT_CARD_TEMPLATE.json)
- [Example: A2A Handshake](examples/a2a-handshake.go)
- [Genkit Reference](https://genkit.dev/docs/go)
