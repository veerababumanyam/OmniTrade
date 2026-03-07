package adk

import (
	"testing"

	"github.com/v13478/omnitrade/backend/internal/action"
	"github.com/v13478/omnitrade/backend/internal/fmp"
)

func TestTradingWorkflow_Initialization(t *testing.T) {
	// Initialize empty configs to verify dependency injection compiles and doesn't panic
	cfg := TradingWorkflowConfig{
		Agents:   &TradingAgents{},
		FMP:      &fmp.Service{},
		ActionDB: &action.ActionPlaneDB{},
	}

	workflow, err := NewTradingWorkflow(cfg)
	if err == nil {
		t.Errorf("Expected error due to invalid agents validation, got nil")
	}

	// Just checking struct fields are accessible
	_ = workflow
}

func TestDebateWorkflow_Initialization(t *testing.T) {
	cfg := DebateWorkflowConfig{
		Agents:   &TradingAgents{},
		FMP:      &fmp.Service{},
		ActionDB: &action.ActionPlaneDB{},
		GK:       nil,
	}

	workflow, err := NewDebateWorkflow(cfg)
	if err == nil {
		t.Errorf("Expected error due to invalid agents validation, got nil")
	}

	_ = workflow
}
