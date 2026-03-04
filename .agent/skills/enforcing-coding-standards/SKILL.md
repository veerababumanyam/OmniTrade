---
name: enforcing-coding-standards
description: Enforces code quality, naming conventions (snake_case, camelCase), and software design principles (DRY, KISS, SOLID) across OmniTrade's Three-Plane Architecture. Use when writing or refactoring Go, Python, or TypeScript code.
---

# Enforcing Coding Standards

This skill ensures that all code in the OmniTrade ecosystem adheres to high-quality software engineering principles and maintainable patterns across its multi-language stack.

## When to use this skill
- When creating new modules, services, or models.
- When refactoring legacy or complex code blocks.
- When performing code reviews or quality audits.
- When ensuring cross-language consistency (Go, Python, TypeScript).

## Workflow

- [ ] **Principle Check**: Does the implementation follow SOLID, DRY, and KISS? 
- [ ] **Naming Audit**: Are variables, functions, and classes named according to the language-specific standard?
- [ ] **Anti-pattern Scan**: Check for common pitfalls (magic numbers, deep nesting, god functions).
- [ ] **Project Alignment**: Ensure the code fits the Three-Plane Architecture (Data, Intelligence, Action).

## Instructions

### 1. Foundational Principles

| Principle | Guideline |
|-----------|-----------|
| **DRY** | Extract repeated logic into reusable components. If you write it 3 times, refactor. |
| **KISS** | Prefer the simplest implementation. Avoid pre-mature optimization or complexity. |
| **SOLID** | Focus on Single Responsibility (SRP) and Dependency Inversion. |
| **YAGNI** | Do not add features or abstractions "just in case". |

### 2. Naming Conventions

Maintain consistency across the polyglot codebase:

| Language | Variable/Function | Class/Struct | Constant |
|----------|-------------------|--------------|----------|
| **Go** | camelCase | PascalCase | PascalCase/camelCase |
| **Python** | snake_case | PascalCase | SCREAMING_SNAKE |
| **TypeScript** | camelCase | PascalCase | SCREAMING_SNAKE |
| **SQL** | snake_case | snake_case (Table) | - |

> [!IMPORTANT]
> In **Go**, exported names must start with an UpperCase letter. In **Python**, use a leading underscore `_` for internal/private members.

### 3. Code Quality Rules

- **Guard Clauses**: Use early returns to reduce indentation levels.
- **Small Functions**: Keep functions under 25 lines. If longer, they likely do too much.
- **Literals**: Replace magic numbers and strings with named constants.
- **Comments**: Code should be self-documenting. Use comments to explain *why*, not *what*.

### 4. Error Handling & Boundaries

Standardize how failures are captured and displayed:

| Layer | Strategy | Note |
|-------|----------|------|
| **Go** | Explicit returns | `if err != nil { return fmt.Errorf("wrap: %w", err) }` |
| **Python** | Custom Exceptions | Use `internal.exceptions.OmniTradeError` base class. |
| **Frontend** | Error Boundaries | Wrap features in `<FeatureErrorBoundary>` for graceful fallback. |
| **API** | RFC 7807 | Return standardized Error JSON with `title`, `status`, and `detail`. |

> [!TIP]
> **Always Wrap Errors**: In Go, use `%w` to preserve the error chain for upstream debugging.
> **No Silent Swallowing**: Never use empty `catch` blocks or `_ = function()` without a logged reason.

### 5. OmniTrade Specific Standards

- **Action Plane**: All trade proposals must pass through the `ActionPlane` service for safety gates.
- **Data Plane**: Use `sqlx` and `pgvector` patterns for database interactions; avoid raw DB drivers.
- **Intelligence Plane**: Keep ML models decoupled from business logic via service layers.

## Resources
- [Clean Code References](../clean-code/SKILL.md)
- [Go Backend Patterns](../developing-go-backends/SKILL.md)
- [Quant Model Patterns](../developing-quant-models/SKILL.md)
