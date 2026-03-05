package a2a

import (
	"encoding/json"
	"net/http"
)

// AgentCard represents the metadata, identity, and integration details
// for a single AI agent following the Google A2A protocol format.
type AgentCard struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Publisher   string            `json:"publisher"`
	Version     string            `json:"version"`
	Skills      []string          `json:"skills,omitempty"`
	Tools       []ToolDefinition  `json:"tools,omitempty"`
	Routing     RoutingParameters `json:"routing"`
}

// ToolDefinition defines a function that the agent can invoke or offer.
type ToolDefinition struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Schema      any    `json:"schema"` // JSON Schema for input validation
}

// RoutingParameters specifies how LiteLLM or other orchestrators should connect to this agent.
type RoutingParameters struct {
	Endpoint     string `json:"endpoint"`
	Model        string `json:"model"`
	Provider     string `json:"provider"`
	RequiresAuth bool   `json:"requires_auth"`
}

// Registry manages the available agent cards.
type Registry struct {
	cards map[string]AgentCard
}

// NewRegistry creates a new A2A agent card registry.
func NewRegistry() *Registry {
	return &Registry{
		cards: make(map[string]AgentCard),
	}
}

// Register adds an agent card to the registry.
func (r *Registry) Register(card AgentCard) {
	r.cards[card.ID] = card
}

// Handler returns an HTTP handler that serves the Agent Cards registry.
func (r *Registry) Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var cardList []AgentCard
		for _, card := range r.cards {
			cardList = append(cardList, card)
		}
		
		if err := json.NewEncoder(w).Encode(map[string]interface{}{
			"agents": cardList,
			"version": "1.0",
			"protocol": "a2a",
		}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}
