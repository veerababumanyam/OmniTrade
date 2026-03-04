# OmniTrade Quality Standards

> **Last Updated**: 2026-03-04
> **Auto-Generated**: Yes
> **Quality Level**: Strict (Financial Platform)

---

## Quality Gates

All gates must pass before code can be merged to main.

### Test Coverage

| Metric | Threshold | Enforcement |
|--------|-----------|-------------|
| Line Coverage | **90% minimum** | CI Block |
| Branch Coverage | **85% minimum** | CI Block |
| Critical Path Coverage | **100%** | Required |

### Code Quality

| Metric | Threshold | Tool |
|--------|-----------|------|
| Quality Score | **90/100** minimum | SpecSwarm |
| Cyclomatic Complexity | **10** max per function | ESLint/gocyclo |
| File Length | **300** lines max | Linter |
| Function Length | **50** lines max | Linter |
| Function Parameters | **5** max | Linter |

### Build Health

| Check | Requirement |
|-------|-------------|
| TypeScript Compilation | No errors |
| Go Build | No errors |
| Linting | No errors (warnings allowed) |
| Security Scan | No high/critical vulnerabilities |

---

## Performance Budgets

### Frontend

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| Bundle Size (gzip) | **500 KB** max | CI Warning |
| Initial Load (3G) | **3 seconds** max | Lighthouse |
| Time to Interactive | **5 seconds** max | Lighthouse |
| Core Web Vitals - LCP | **2.5 seconds** | Lighthouse |
| Core Web Vitals - FID | **100 ms** | Lighthouse |
| Core Web Vitals - CLS | **0.1** | Lighthouse |

### Backend

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| API Response Time (p95) | **200 ms** | Monitoring |
| API Response Time (p99) | **500 ms** | Monitoring |
| Database Query Time | **50 ms** | APM |
| Memory per Request | **50 MB** | Profiling |

---

## Testing Requirements

### Unit Tests

- [ ] All new functions have tests
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] Mocks used for external dependencies

### Integration Tests

- [ ] API endpoints tested
- [ ] Database operations tested
- [ ] External service integrations mocked

### E2E Tests

- [ ] Critical user flows covered
- [ ] Trade submission flow
- [ ] Authentication flow
- [ ] Portfolio viewing

### Go-Specific Tests

```go
// Preferred: Table-driven tests
func TestCalculatePosition(t *testing.T) {
    tests := []struct {
        name     string
        input    TradeInput
        expected Position
        err      error
    }{
        // test cases...
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // test logic
        })
    }
}
```

---

## Code Review Standards

### Required Reviews

| Change Type | Reviewers | Approvals |
|-------------|-----------|-----------|
| Feature | Any team member | 1 |
| Bug Fix | Any team member | 1 |
| Security | Security lead | 1 + lead |
| Database | DBA/Lead | 1 |
| Breaking Change | Tech lead | 2 |

### Review Checklist

- [ ] Code follows constitution principles
- [ ] Tests are meaningful and pass
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Documentation updated if needed
- [ ] No secrets or credentials in code

---

## Security Standards

### Required Checks

| Check | Tool | Enforcement |
|-------|------|-------------|
| Dependency Vulnerabilities | `npm audit` / `govulncheck` | CI Block |
| SAST | ESLint security / gosec | CI Block |
| Secrets Detection | git-secrets | Pre-commit |
| License Compliance | license-checker | CI Warning |

### Financial Data Handling

- [ ] All monetary values use decimal types
- [ ] No floating-point arithmetic for money
- [ ] Audit logs for all financial operations
- [ ] Encryption at rest for sensitive data
- [ ] Encryption in transit (TLS 1.3)

---

## Accessibility Standards

| Standard | Level | Enforcement |
|----------|-------|-------------|
| WCAG | **2.1 Level AA** | Lighthouse |

### Requirements

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ratios
- [ ] Focus indicators
- [ ] ARIA labels where needed

---

## Documentation Requirements

### Required Documentation

| Type | Location | When |
|------|----------|------|
| API Docs | `/docs/api` | New endpoints |
| Architecture | `/docs/architecture` | Major changes |
| README | Root | Setup changes |
| Inline comments | Code | Complex logic |

### Code Comments

```typescript
/**
 * Calculates the risk-adjusted position size based on
 * portfolio volatility and maximum drawdown tolerance.
 *
 * @param portfolio - Current portfolio state
 * @param signal - Trading signal with confidence
 * @returns Position size in base currency
 */
function calculatePositionSize(
  portfolio: Portfolio,
  signal: TradingSignal
): Decimal {
  // Implementation
}
```

---

## CI/CD Gates

### Pre-Merge (Pull Request)

```yaml
checks:
  - build
  - lint
  - test
  - coverage (>= 90%)
  - security-scan
  - quality-score (>= 90)
```

### Post-Merge (Main Branch)

```yaml
checks:
  - deploy-staging
  - e2e-tests
  - performance-tests
  - deploy-production (manual approval)
```

---

## Exemptions

Exemptions from quality gates require:

1. Documented reason in PR
2. Tech lead approval
3. Tracking issue for remediation
4. Expiration date (max 2 weeks)

---

## Monitoring & Alerting

### Production Health

| Metric | Alert Threshold |
|--------|-----------------|
| Error Rate | > 1% |
| Latency (p99) | > 1 second |
| CPU Usage | > 80% |
| Memory Usage | > 85% |
| Disk Usage | > 90% |

### Trading System Specific

| Metric | Alert Threshold |
|--------|-----------------|
| Order Rejection Rate | > 5% |
| AI Response Time | > 10 seconds |
| Data Feed Latency | > 500 ms |
| Audit Log Failures | > 0 |

---

## Notes

- Quality level: **Strict** (financial platform)
- Created by `/specswarm:init`
- Enforced by `/specswarm:ship` before merge
- Review and adjust these standards for your team's needs
