// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import ()

// AgentOpinion represents an agent's analysis and recommendation
type AgentOpinion struct {
	AgentName            string                 `json:"agent_name"`
	ActionRecommendation string                 `json:"action_recommendation"` // BUY, SELL, HOLD
	ConfidenceScore      float64                `json:"confidence_score"`
	Reasoning            string                 `json:"reasoning"`
	SupportingData       map[string]interface{} `json:"supporting_data,omitempty"`
}

// ConflictPoint represents a disagreement between agents
type ConflictPoint struct {
	Topic     string            `json:"topic"`
	Agents    []string          `json:"agents"`
	Positions map[string]string `json:"positions"`
	Severity  string            `json:"severity"` // LOW, MEDIUM, HIGH
}

// DebateContext holds the context for a multi-agent debate
type DebateContext struct {
	SessionID      string
	Symbol         string
	MarketData     map[string]interface{}
	AgentOpinions  []AgentOpinion
	Conflicts      []ConflictPoint
	DebateRound    int
	MaxRounds      int
}

// MediatorDecision represents the mediator's final decision
type MediatorDecision struct {
	FinalAction         string  `json:"final_action"`
	FinalConfidence     float64 `json:"final_confidence"`
	ResolutionReasoning string  `json:"resolution_reasoning"`
	ConflictSummary     string  `json:"conflict_summary"`
	Strategy            string  `json:"strategy"` // WEIGHTED_VOTE, EVIDENCE_BASED, ESCALATED
}

// getAllAgentNames returns list of all agent names
func getAllAgentNames(debate *DebateContext) []string {
	agents := make([]string, len(debate.AgentOpinions))
	for _, opinion := range debate.AgentOpinions {
		agents = append(agents, opinion.AgentName)
	}
	return agents
}
