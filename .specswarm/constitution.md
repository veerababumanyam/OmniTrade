# OmniTrade Project Constitution

> **Last Updated**: 2026-03-04
> **Auto-Generated**: Yes

---

## Project Governance

### Decision Authority

| Decision Type | Authority | Escalation |
|---------------|-----------|------------|
| Feature Design | Team Lead | Architecture Review |
| API Changes | Backend Lead | Full Team Review |
| UI/UX Changes | Frontend Lead | User Testing |
| Security Changes | Security Lead | Mandatory Review |
| Database Schema | DBA/Lead | Migration Review |

### Review Requirements

- **Code Review**: All changes require at least 1 approval
- **Security Review**: Required for authentication, authorization, and data handling
- **Performance Review**: Required for trading engine and data pipeline changes
- **Architecture Review**: Required for new services or major refactors

---

## Core Coding Principles

### 1. DRY (Don't Repeat Yourself)

- Extract common logic into shared utilities
- Prefer composition over inheritance
- Use TypeScript interfaces for type sharing between frontend/backend

```typescript
// Good: Shared types
interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
}
```

### 2. SOLID Principles

- **S**ingle Responsibility: One purpose per module/class
- **O**pen/Closed: Extend behavior without modification
- **L**iskov Substitution: Subtypes must be substitutable
- **I**nterface Segregation: Many specific interfaces
- **D**ependency Inversion: Depend on abstractions, not concretions

### 3. Type Safety

- **TypeScript strict mode** on frontend
- **Go explicit types** with no `any` equivalents
- Runtime validation for external data (Zod for frontend)
- API contracts must be typed and validated

### 4. Audit Trails

As a financial platform, all operations must be traceable:

- Log all trade decisions with reasoning
- Store AI agent reasoning chains
- Maintain immutable decision history
- Human-in-the-Loop (HITL) confirmation logs

```go
// Every trade action must have audit context
type AuditContext struct {
    Timestamp   time.Time
    Actor       string // "ai:analyst" or "human:trader"
    Reasoning   string
    Confidence  float64
    ApprovedBy  string // Human approval required
}
```

### 5. Test Coverage

- **90% minimum coverage** for critical paths
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for user workflows

---

## Financial Domain Rules

### Trading Logic

1. **Never auto-execute**: All trades require human confirmation
2. **Confidence thresholds**: Minimum 0.7 confidence for AI suggestions
3. **Risk limits**: Enforce position size limits per trade
4. **Circuit breakers**: Automatic halt on unusual activity

### Data Handling

1. **Read-only AI access**: AI agents read data, never write directly
2. **Input validation**: All market data validated before processing
3. **Timestamp integrity**: Use UTC, never local time
4. **Precision**: Use decimal types for financial calculations

### Security

1. **No secrets in code**: Use environment variables
2. **API key rotation**: Support key rotation without downtime
3. **Rate limiting**: Protect all endpoints
4. **Input sanitization**: Never trust external data

---

## Communication Standards

### Commit Messages

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Titles

```
[<ticket>] <type>: <description>
```

Example: `[TRADE-123] feat: Add risk assessment agent`

### Code Comments

- **Why, not What**: Explain reasoning, not syntax
- **TODO format**: `TODO(author): description [TRADE-XXX]`
- **Complex logic**: Add inline explanations

---

## Enforcement

This constitution is enforced by:

- **Pre-commit hooks**: Linting, type checking
- **CI/CD gates**: Tests, coverage, quality scores
- **Code review**: Human verification
- **SpecSwarm**: Automated compliance checking

---

*This constitution was created by `/specswarm:init`. Update as your team evolves.*
