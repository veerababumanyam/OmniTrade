// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"context"
	"fmt"
)

// MediatorInstruction is the system prompt for the Mediator agent
const MediatorInstruction = `You are the Mediator Agent for OmniTrade.

YOUR ROLE:
- Analyze opinions from specialist agents (RAGAnalysis, RiskAssessment)
- Identify conflicts and disagreements between agents
- Synthesize a final recommendation based on evidence quality
- Escalate to human review if conflicts are irresolvable

CONFLICT RESOLUTION STRATEGIES:
1. EVIDENCE_BASED: Weight opinions by supporting data quality
2. CONFIDENCE_WEIGHTED: Weight by each agent's confidence score
3. RISK_ADJUSTED: Favor more conservative recommendations in high volatility
4. ESCALATE: Forward to human review if severe conflicts exist

CONSTRAINTS:
- You MUST provide clear reasoning for your decision
- If agents disagree by >40% on action, flag for human review
- Never override risk assessment's maximum position size
- All decisions require PortfolioManager synthesis before HITL

OUTPUT FORMAT:
Return a JSON object with:
{
  "final_action": "BUY" | "SELL" | "HOLD",
  "final_confidence": 0.0-1.0,
  "resolution_reasoning": "Explanation of why this decision was made",
  "conflict_summary": "Summary of any conflicts detected",
  "strategy": "WEIGHTED_VOTE" | "EVIDENCE_BASED" | "RISK_ADJUSTED" | "ESCALATED",
  "requires_human_review": true | false
}`

// ResolutionStrategy defines how conflicts are resolved
type ResolutionStrategy interface {
	Resolve(ctx context.Context, debate *DebateContext) (*MediatorDecision, error)
}

// MediatorAgent resolves conflicts between specialist agents
type MediatorAgent struct {
	name              string
	description       string
	instruction        string
	strategy          ResolutionStrategy
	conflictThreshold float64 // Threshold for escalation (default 0.4 = 40%)
}

// NewMediatorAgent creates a new mediator agent with default strategy
func NewMediatorAgent() *MediatorAgent {
	return &MediatorAgent{
		name:              "mediator",
		description:       "Resolves conflicts between specialist agents",
		instruction:        MediatorInstruction,
		strategy:          &WeightedEvidenceStrategy{},
		conflictThreshold: 004,
	}
}

// Name returns the agent's name
func (m *MediatorAgent) Name() string {
	return m.name
}

// Description returns the agent's description
func (m *MediatorAgent) Description() string {
	return m.description
}

// Instruction returns the agent's instruction
func (m *MediatorAgent) Instruction() string {
	return m.instruction
}

// Resolve executes the resolution strategy
func (m *MediatorAgent) Resolve(ctx context.Context, debate *DebateContext) (*MediatorDecision, error) {
	if debate == nil {
		return nil, fmt.Errorf("debate context is nil")
	}
	if len(debate.AgentOpinions) == 0 {
		return nil, fmt.Errorf("no agent opinions to resolve")
	}

	return m.strategy.Resolve(ctx, debate)
}

// WeightedEvidenceStrategy weights opinions by data quality and confidence
type WeightedEvidenceStrategy struct{}

// Resolve implements weighted evidence-based conflict resolution
func (s *WeightedEvidenceStrategy) Resolve(ctx context.Context, debate *DebateContext) (*MediatorDecision, error) {
	if debate == nil || len(debate.AgentOpinions) == 0 {
		return nil, fmt.Errorf("no agent opinions to resolve")
	}

	// Calculate weighted scores for each action
	actionScores := make(map[string]float64)
	actionConfidences := make(map[string][]float64)

	for _, opinion := range debate.AgentOpinions {
		action := opinion.ActionRecommendation
		if action == "" {
			continue
		}

		// Weight by confidence and evidence quality
		weight := opinion.ConfidenceScore
		if opinion.SupportingData != nil && len(opinion.SupportingData) > 0 {
			// Bonus for having supporting data
			weight += 0.1
		}

		actionScores[action] += weight
		actionConfidences[action] = append(actionConfidences[action], opinion.ConfidenceScore)
	}

	// Find the action with highest score
	var finalAction string
	var maxScore float64
	for action, score := range actionScores {
		if score > maxScore {
			maxScore = score
			finalAction = action
		}
	}

	// Calculate average confidence for winning action
	var avgConfidence float64
	if confidences, ok := actionConfidences[finalAction]; ok {
		total := 0.0
		for _, conf := range confidences {
			total += conf
		}
		avgConfidence = total / float64(len(confidences))
	}

	// Identify conflicts
	conflicts := s.identifyConflicts(debate)

	// Determine resolution strategy
	strategy := "WEIGHTED_VOTE"
	if len(conflicts) > 0 {
		if hasHighSeverity(conflicts) {
			strategy = "ESCALATED"
		} else if hasConflictingActions(debate) {
			strategy = "EVIDENCE_BASED"
		}
	}

	// Build conflict summary
	var conflictSummary string
	if len(conflicts) == 0 {
		conflictSummary = "No conflicts detected"
	} else {
		conflictSummary = s.buildConflictSummary(conflicts)
	}

	return &MediatorDecision{
		FinalAction:         finalAction,
		FinalConfidence:     avgConfidence,
		ResolutionReasoning: fmt.Sprintf("Selected %s based on weighted evidence (score: %.2f, opinions: %d)", finalAction, maxScore, len(debate.AgentOpinions)),
		ConflictSummary:     conflictSummary,
		Strategy:            strategy,
	}, nil
}

// identifyConflicts detects disagreements between agents
func (s *WeightedEvidenceStrategy) identifyConflicts(debate *DebateContext) []ConflictPoint {
	if len(debate.AgentOpinions) < 2 {
		return nil
	}

	var conflicts []ConflictPoint

	// Check for action disagreement
	actions := make(map[string][]string)
	for _, opinion := range debate.AgentOpinions {
		action := opinion.ActionRecommendation
		if action != "" {
			actions[action] = append(actions[action], opinion.AgentName)
		}
	}

	// If agents disagree on action
	if len(actions) > 1 {
		positions := make(map[string]string)
		for action, agents := range actions {
			positions[action] = fmt.Sprintf("%d agents", len(agents))
		}

		var agentList []string
		for _, agents := range actions {
			agentList = append(agentList, agents...)
		}

		conflicts = append(conflicts, ConflictPoint{
			Topic:     "action_recommendation",
			Agents:    agentList,
			Positions: positions,
			Severity: "HIGH",
		})
	}

	// Check for confidence divergence
	highConfidence := 0.0
	lowConfidence := 1.0
	for _, opinion := range debate.AgentOpinions {
		if opinion.ConfidenceScore > highConfidence {
			highConfidence = opinion.ConfidenceScore
		}
		if lowConfidence == 1.0 || opinion.ConfidenceScore < lowConfidence {
			lowConfidence = opinion.ConfidenceScore
		}
	}

	// If significant confidence divergence (>0.4)
	if highConfidence > 0 && lowConfidence > 0 && (highConfidence-lowConfidence) > 0.4 {
		var highAgents []string
		var lowAgents []string

		for _, opinion := range debate.AgentOpinions {
			if opinion.ConfidenceScore >= highConfidence-0.2 {
				highAgents = append(highAgents, opinion.AgentName)
			}
			if opinion.ConfidenceScore <= lowConfidence+0.2 {
				lowAgents = append(lowAgents, opinion.AgentName)
			}
		}

		positions := make(map[string]string)
		positions["high_confidence"] = fmt.Sprintf("%.2f", highConfidence)
		positions["low_confidence"] = fmt.Sprintf("%.2f", lowConfidence)

		conflicts = append(conflicts, ConflictPoint{
			Topic:     "confidence_divergence",
			Agents:    append(highAgents, lowAgents...),
			Positions: positions,
			Severity: "MEDIUM",
		})
	}

	return conflicts
}

// buildConflictSummary creates a human-readable summary of conflicts
func (s *WeightedEvidenceStrategy) buildConflictSummary(conflicts []ConflictPoint) string {
	var summary string
	for _, conflict := range conflicts {
		summary += fmt.Sprintf("- %s: (Severity: %s)\n", conflict.Topic, conflict.Severity)
		for action, position := range conflict.Positions {
			summary += fmt.Sprintf("  - %s: %s\n", action, position)
		}
	}
	return summary
}

// hasHighSeverity checks if any conflicts have high severity
func hasHighSeverity(conflicts []ConflictPoint) bool {
	for _, conflict := range conflicts {
		if conflict.Severity == "HIGH" {
			return true
		}
	}
	return false
}

// hasConflictingActions checks if agents have conflicting action recommendations
func hasConflictingActions(debate *DebateContext) bool {
	actions := make(map[string]bool)
	for _, opinion := range debate.AgentOpinions {
		if opinion.ActionRecommendation != "" {
			actions[opinion.ActionRecommendation] = true
		}
	}
	return len(actions) > 1
}
