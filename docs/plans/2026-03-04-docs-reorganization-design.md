# Documentation Reorganization Design

**Date:** 2026-03-04
**Status:** Approved
**Goal:** Comprehensive taxonomy for developer onboarding, AI/LLM indexing, and project governance

## Approach: Domain-Based Organization

Organize by technical domain - each folder represents a distinct concern.

## Folder Structure

```
docs/
├── architecture/      # System design, tech specs, diagrams
├── strategies/        # Trading strategies, ML models, backtesting
├── agents/           # Agent definitions, flows, intelligence system
├── data/             # Schemas, ingestion, RAG, databases
├── frontend/         # UI/UX, design system, components
├── plugins/          # Plugin system, MCP integration
├── guides/           # User guides, onboarding, how-tos
├── plans/            # Active designs, ADRs, implementation plans
└── reference/        # API specs, PRD, external references
```

## File Mappings

### architecture/
- Architecture_Document.md
- AI_Trading_System_Architecture.md
- Technical_Specification.md
- 01_RAG_Architecture_Design.md

### strategies/
- AI_Trading_Strategies.md
- 09_Machine_Learning_Models.md
- The5LynchCriteria.md (from root /strategies/)
- 5LynchStrategy.png (from root /strategies/)

### agents/
- 02_Agent_Intelligence_System.md
- genkit-flow-debugger.md
- frontend-architect.md
- risk-analyst.md
- trading-reviewer.md

### data/
- 03_Data_Ingestion_Strategy.md
- USER_GUIDE_RAG.md
- schemas/ (future: database schemas)

### frontend/
- 07_Frontend_Design_System.md
- 08_UI_UX_Design_Standards_2026.md
- components/ (future: component docs)

### plugins/
- All existing plugin docs
- antigravity-skill-creator.md

### guides/
- 00_Planning_Walkthrough.md
- implementation_plan.md
- OmniTrade_Comprehensive_Features.md

### plans/
- Existing design plans
- 04_API_Specification.md
- 05_Security_HITL_Protocol.md
- 06_Infrastructure_Deployment.md

### reference/
- PRD_OmniTrade.md
- references.md

## Navigation

Each folder gets a README.md index file with:
- Brief description of the domain
- List of documents with one-line summaries
- "Start here" recommendation
- Related domains (cross-links)

Root docs/README.md provides quick navigation table for all domains.

## Benefits

1. **Developer Onboarding**: Clear mental model, easy to find relevant docs
2. **AI/LLM Indexing**: Semantic folder names aid RAG retrieval
3. **Project Governance**: Clear separation of concerns for compliance
