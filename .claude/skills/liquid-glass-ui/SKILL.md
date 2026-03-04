---
name: liquid-glass-ui
description: Use when building OmniTrade's React frontend — Liquid Glass design system, glassmorphism panels, CSS variables, dashboard components, or HITL approval UI.
---

# Liquid Glass UI Design System

## Overview

OmniTrade's frontend uses React 19 + TypeScript 5 + Vanilla CSS with a "Liquid Glass" aesthetic — glassmorphism panels, smooth gradients, and premium typography. No CSS frameworks (Tailwind, Bootstrap) — pure CSS variables and component-scoped styles.

## Stack

- React 19 (functional components + hooks only — no class components)
- TypeScript 5 (strict mode, no `any`)
- Vite 7
- Vanilla CSS with CSS custom properties
- State: React Context + `useReducer` (Zustand if complex)
- Testing: Vitest + React Testing Library

## CSS Variable System

```css
/* globals.css */
:root {
  /* Glass panels */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  --glass-blur: blur(12px);

  /* Brand colors */
  --color-primary: #00d4ff;
  --color-accent: #7c4dff;
  --color-success: #00e676;
  --color-danger: #ff1744;
  --color-warning: #ffab40;

  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Spacing scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 48px;

  /* Animation */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Glass Panel Component

```tsx
// components/GlassPanel/GlassPanel.tsx
interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'primary' | 'success' | 'danger';
}

export function GlassPanel({ children, className, glow }: GlassPanelProps) {
  return (
    <div className={`glass-panel ${glow ? `glass-panel--${glow}` : ''} ${className ?? ''}`}>
      {children}
    </div>
  );
}
```

```css
.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: var(--glass-blur);
  border-radius: 16px;
  padding: var(--space-lg);
}

.glass-panel--success { border-color: rgba(0, 230, 118, 0.3); }
.glass-panel--danger  { border-color: rgba(255, 23, 68, 0.3); }
.glass-panel--primary { border-color: rgba(0, 212, 255, 0.3); }
```

## HITL Approval Card

```tsx
// The core human-in-the-loop review component
interface TradeProposal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidenceScore: number; // 0–1
  reasoning: string;
  chainOfThought: string;
}

export function ApprovalCard({ proposal, onApprove, onReject }: {
  proposal: TradeProposal;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <GlassPanel glow={proposal.action === 'BUY' ? 'success' : 'danger'}>
      <div className="proposal-header">
        <span className="proposal-symbol">{proposal.symbol}</span>
        <ActionBadge action={proposal.action} />
        <ConfidenceBar score={proposal.confidenceScore} />
      </div>
      <p className="proposal-reasoning">{proposal.reasoning}</p>
      <div className="proposal-actions">
        <button onClick={() => onApprove(proposal.id)} className="btn btn--approve">
          Approve
        </button>
        <button onClick={() => onReject(proposal.id)} className="btn btn--reject">
          Reject
        </button>
      </div>
    </GlassPanel>
  );
}
```

## Dashboard Layout

```tsx
// Command center — resizable widget grid
export function Dashboard() {
  return (
    <div className="dashboard-grid">
      <GlassPanel className="widget widget--chart">
        <PriceChart />
      </GlassPanel>
      <GlassPanel className="widget widget--proposals">
        <ProposalQueue />
      </GlassPanel>
      <GlassPanel className="widget widget--portfolio">
        <PortfolioSummary />
      </GlassPanel>
    </div>
  );
}
```

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  grid-template-rows: auto 1fr;
  gap: var(--space-md);
  height: 100vh;
  padding: var(--space-md);
}
```

## TypeScript Rules

```typescript
// Always use interfaces for component props
interface ProposalQueueProps {
  proposals: TradeProposal[];
  onApprove: (id: string) => void;
}

// Never use `any` — use `unknown` + type guard if needed
function isTradeProposal(v: unknown): v is TradeProposal {
  return typeof v === 'object' && v !== null && 'symbol' in v;
}
```

## State Pattern

```tsx
// context/TradeContext.tsx
type Action =
  | { type: 'APPROVE'; id: string }
  | { type: 'REJECT'; id: string }
  | { type: 'SET_PROPOSALS'; proposals: TradeProposal[] };

function reducer(state: TradeState, action: Action): TradeState {
  switch (action.type) {
    case 'APPROVE':
      return { ...state, proposals: state.proposals.filter(p => p.id !== action.id) };
    // ...
  }
}
```

## Prohibited Patterns

| Never Use | Instead |
|-----------|---------|
| Class components | Functional + hooks |
| `any` type | Concrete types or `unknown` |
| Moment.js | date-fns |
| Tailwind / Bootstrap | Vanilla CSS + variables |
| PropTypes | TypeScript interfaces |
| Redux | Context + useReducer (or Zustand) |
