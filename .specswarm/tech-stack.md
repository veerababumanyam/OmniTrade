# OmniTrade Tech Stack

> **Last Updated**: 2026-03-04
> **Auto-Generated**: Yes
> **Detection Source**: package.json, go.mod, README.md

---

## Project Overview

- **Name**: OmniTrade
- **Type**: Monorepo (Frontend + Backend)
- **Architecture**: Three-Plane (Data, Intelligence, Action)

---

## Frontend Stack

### Core Framework

- **React 19.2**
  - Purpose: UI framework
  - Notes: Functional components with hooks only

- **TypeScript 5.x**
  - Purpose: Type-safe development
  - Notes: Strict mode enabled

- **Vite 7.3**
  - Purpose: Build tool and dev server
  - Notes: Fast HMR, ES modules

### Styling

- **Vanilla CSS**
  - Purpose: Component styling
  - Notes: "Liquid Glass" design system with CSS variables

### State Management

- **React Context + useReducer**
  - Purpose: Application state
  - Notes: Prefer for simple state, consider Zustand for complex needs

### Testing

- **React Testing Library (RTL)**
  - Purpose: Component testing
  - Notes: User-centric testing approach

- **Vitest** (recommended)
  - Purpose: Unit testing
  - Notes: Fast, Vite-native

---

## Backend Stack

### Core Framework

- **Go 1.26+**
  - Purpose: Primary backend language
  - Notes: Explicit error handling, no panics in production code

- **go-chi**
  - Purpose: HTTP router
  - Notes: Lightweight, middleware-friendly

- **sqlx**
  - Purpose: Database access
  - Notes: Named queries, struct scanning

### AI/ML

- **Google Genkit Go SDK 1.4+**
  - Purpose: Multi-agent orchestration
  - Notes: Supports GPT-5.3, Claude 4.6, Gemini 3.1, Llama 4

### Testing

- **Go testing package**
  - Purpose: Unit and integration tests
  - Notes: Table-driven tests preferred

---

## Database Stack

### Primary Database

- **PostgreSQL 16+**
  - Purpose: Primary data store
  - Notes: ACID compliance for financial data

- **pgvector**
  - Purpose: Vector similarity search
  - Notes: AI embeddings for semantic search

### Caching

- **Redis**
  - Purpose: Caching and real-time data
  - Notes: Market data, session storage

---

## Supported LLM Providers

| Provider | Model | Use Case |
|----------|-------|----------|
| OpenAI | GPT-5.3 | Complex reasoning |
| Anthropic | Claude 4.6 | Analysis and synthesis |
| Google | Gemini 3.1 | Multi-modal tasks |
| DeepSeek | DeepSeek-V4 | Cost-effective reasoning |
| Local | Llama 4 (Ollama) | Privacy-sensitive operations |

---

## Approved Libraries

### Frontend

```json
{
  "zod": "Runtime validation",
  "date-fns": "Date manipulation",
  "react-router": "Routing (if needed)"
}
```

### Backend

```go
// Approved packages
"github.com/go-chi/chi/v5"           // Router
"github.com/jmoiron/sqlx"            // DB
"github.com/lib/pq"                  // PostgreSQL driver
"github.com/redis/go-redis/v9"       // Redis client
"github.com/google/uuid"             // UUID generation
```

---

## Prohibited Patterns

### Frontend

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| Class components | Legacy pattern | Functional components with hooks |
| PropTypes | TypeScript available | Use TypeScript interfaces |
| Moment.js | Large bundle | date-fns |
| Redux (complex setup) | Overkill for this scale | Context + useReducer |
| `any` type | Type safety | Proper TypeScript types |

### Backend

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| Global state | Concurrency issues | Dependency injection |
| Panic in handlers | Crash risk | Explicit error returns |
| `interface{}` everywhere | Type safety | Generic types |
| Direct DB queries in handlers | Testability | Repository pattern |
| Hardcoded secrets | Security | Environment variables |

---

## Monorepo Structure

```
OmniTrade/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Go + go-chi + sqlx
├── docs/              # Documentation
└── .specswarm/        # SpecSwarm configuration
```

---

## Notes

- This file was auto-detected from `package.json`, `go.mod`, and `README.md`
- Update when adding new technologies or patterns
- Run `/specswarm:init` again to update with new detections
