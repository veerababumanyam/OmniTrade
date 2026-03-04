# OmniTrade Agent Plugin Architecture Documentation

This directory contains comprehensive documentation for OmniTrade's internal agent plugin architecture. The documentation covers the plugin development, tool registration, hook systems, and Google Agent Development Kit (ADK) integration.

## Overview

OmniTrade implements a sophisticated plugin architecture that enables extensible AI-powered trading agents. The architecture follows a layered approach with clear separation of concerns:

### Key Components

| Component | Package | Description |
|------------|---------|-------------|
| **Plugin System** | `backend/internal/agent/plugins/` | Core plugin lifecycle management |
| **Tools Registry** | `backend/internal/agent/tools/` | Tool registration and execution |
| **Hooks System** | `backend/internal/agent/hooks/` | Event-driven hook execution |
| **ADK Integration** | `backend/internal/agent/adk/` | Google ADK wrapper and agent integration |

## Quick Start

### Prerequisites

- Go 1.21+
- PostgreSQL with pgvector extension
- Redis (for caching and pub/sub)
- Google Cloud credentials (for ADK)

### Installation

```bash
# Clone the repository
git clone https://github.com/omnitrade/omnitrade.git
cd omnitrade

# Install dependencies
cd backend
go mod download

# Run the server
go run main.go
```

### Your First Plugin

```go
package main

import (
    "context"
    "github.com/omnitrade/backend/internal/agent/plugins"
)

// Define your plugin
type MyPlugin struct {
    plugins.BasePlugin
}

func New() *MyPlugin {
    return &MyPlugin{
        BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
        ID:          "my_plugin",
        Name:        "My Custom Plugin",
        Version:     "1.0.0",
        Description: "A custom plugin for OmniTrade",
        Priority:    plugins.PriorityNormal,
        Capabilities: []plugins.PluginCapability{
            plugins.CapabilityAnalysis,
        },
    }),
    )
}

// Initialize sets up the plugin
func (p *MyPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    // Your initialization logic here
    return nil
}

// Execute runs the plugin's main operation
func (p *MyPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    // Your execution logic here
    return &plugins.PluginResult{
        Success: true,
        Data:    map[string]interface{}{"result": "ok"},
    }, nil
}
```

## Documentation Index

- [Architecture Overview](./architecture.md) - Complete system architecture documentation
- [Plugin Development Guide](./plugin-development-guide.md) - How to create plugins
- [Tool Reference](./tool-reference.md) - All available tools documentation
- [Hooks Reference](./hooks-reference.md) - Complete hooks reference
- [Examples](./examples/) - Example implementations

## Architecture Highlights

### Three-Plane Architecture

OmniTrade follows a three-plane architecture pattern:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   DATA PLANE   │ --> │ INTELLIGENCE  │ --> │   ACTION PLANE   │
│   (Read-Only)    │     │    PLANE        │     │    (HITL)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Data Plane**: Real-time market data ingestion (WebSockets/APIs)
- **Intelligence Plane**: Multi-agent AI orchestration (Google Genkit)
- **Action Plane**: Human-in-the-loop trade approval

### Plugin Lifecycle

```
StateUnloaded -> StateLoaded -> StateInitializing -> StateActive -> StateDegraded -> StateError
```

### Event Flow

```
User Request -> HookRegistry -> Executor -> ToolRegistry -> Plugin -> Result
```

## Best Practices

- Always use DECIMAL types for monetary values
- Implement circuit breakers for external API calls
- All trades require human approval (HITL)
- Maintain audit context for all operations
- Follow the minimum 0.70 confidence threshold for AI suggestions

## Support
For questions or issues, consult the [Troubleshooting Guide](./troubleshooting.md)
