// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

// Package adk provides Google Agent Development Kit (ADK) integration for OmniTrade.
//
// This package implements the Intelligence Plane using Google ADK-Go for structured
// multi-agent orchestration while maintaining LiteLLM Gateway as the model backend.
//
// # Architecture Overview
//
// The package consists of several key components:
//
//   - LiteLLMModel: Implements model.LLM interface, routing requests through LiteLLM Gateway
//   - ToolAdapter: Converts OmniTrade tools to ADK-compatible tool.Tool interface
//   - Trading Agents: Specialized agents for data fetching, RAG, risk assessment, and portfolio management
//   - Workflow: Sequential agent orchestration for trade proposal generation
//
// # Usage
//
// Basic workflow setup:
//
//	model, err := adk.NewLiteLLMModel("gpt-5.3", "http://litellm:4000", "api-key")
//	if err != nil {
//	    log.Fatal(err)
//	}
//
//	workflow, err := adk.NewTradingWorkflow(model, tools, cache, memory)
//	if err != nil {
//	    log.Fatal(err)
//	}
//
//	result, err := workflow.Run(ctx, adk.TradeProposalInput{
//	    Symbol:   "AAPL",
//	    Strategy: "lynch",
//	})
//
// # Integration with OmniTrade
//
// This package integrates with existing OmniTrade infrastructure:
//
//   - Semantic Cache: Redis-based caching for LLM responses
//   - Memory Service: Working and episodic memory for agents
//   - Tool System: Existing OmniTrade tools wrapped as ADK tools
//   - HITL Boundary: Human-in-the-loop approval preserved
package adk
