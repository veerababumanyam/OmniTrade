---
name: implementing-multi-agent-debate
description: Designs and implements OmniTrade's multi-agent orchestration, including parallel analysis layers, Risk Manager vetoes, and Portfolio Manager synthesis. Use when modifying agent hierarchies, conflict resolution logic, or debate topologies.
---

# Implementing Multi-Agent Debate

This skill provides the structure for OmniTrade's hierarchical "Debate Topology," where specialist agents collaborate and compete to produce high-confidence trade proposals.

## When to use this skill
- When adding new specialist agents (Fundamental, Technical, Sentiment, etc.) to the parallel analysis layer.
- When modifying the **Risk Manager's** veto logic or circuit breakers.
- When refactoring the **Portfolio Manager's** synthesis and conflict resolution formulas.
- When implementing new sequential stages in the orchestration flow.

## Workflow

- [ ] **Define Parallel Layer**: Use `errgroup` in Go to run specialists (Fundamental, Technical) in parallel.
- [ ] **Classify Agents**: Distinguish between **Required** agents (abort flow on error) and **Optional** agents (log error and continue).
- [ ] **Enforce Risk Veto**: Ensure the Risk Manager's `REJECT` status is a hard veto that cannot be overridden by the Portfolio Manager.
- [ ] **Conflict Resolution**: Apply weighted signal averaging (Fundamental > Technical > Sentiment) and document agent disagreements in the Chain-of-Thought (CoT).
- [ ] **Synthesis Probe**: Ensure the Portfolio Manager receives ALL up-stream reports before producing the final proposal.
- [ ] **Gate Confidence**: Final proposals must meet the `>= 0.70` confidence threshold after conflict penalties are applied.

## Instructions

### 1. Parallel Analysis Layer (Go)
```go
eg, egCtx := errgroup.WithContext(ctx)
eg.Go(func() error {
    reports.Technical, err = runTechnicalAnalyst(egCtx, snapshot)
    return err // Required
})
eg.Go(func() error {
    reports.Sentiment, err = runSentimentAnalyst(egCtx, snapshot)
    if err != nil { log.Printf("Error: %v", err); return nil } // Optional
    return nil
})
```

### 2. Conflict Penalty Formula
Reduce confidence proportionally to disagreement between agents.
`Confidence = max(bullishWeight, bearishWeight) * (1.0 - abs(bullishWeight - bearishWeight))`

### 3. Agent Output Schemas
- **Fundamental**: Key drivers, identified risks, and sources cited.
- **Technical**: Trend direction, market regime, and support/resistance levels.
- **Risk**: Approval status (`APPROVE|REJECT|REDUCE_SIZE`) and VIX-based reasoning.

### 4. Portfolio Manager Synthesis
The Portfolio Manager MUST cite specific findings from each specialist and explain the resolution of any conflicts in the `chain_of_thought`.

## Resources
- [Debate Topology Reference](resources/DEBATE_HIERARCHY.md)
- [Example: Synthesis Prompt](examples/synthesis-prompt.txt)
