# OmniTrade: Frontend & Generative UI Spec

This document details the "Liquid Glass" design system, component specifications, and the integration of Generative UI elements for the OmniTrade Dashboard.

> **Related Documents**: [Technical_Specification.md](./Technical_Specification.md) | [PRD_OmniTrade.md](./PRD_OmniTrade.md) | [08_UI_UX_Design_Standards_2026.md](./08_UI_UX_Design_Standards_2026.md)

---

## 1. Visual Identity: "Liquid Glass"

The aesthetic focuses on premium, high-contrast, and translucent elements to convey a sense of modern "Intelligence."

### 1.1 Design Philosophy

- **Premium & Trustworthy**: Dark, sophisticated palette for financial applications
- **Data-Forward**: Information density without clutter
- **Fluid Interactions**: Smooth transitions that feel "liquid"
- **Accessibility First**: WCAG 2.1 AA compliance

### 1.2 Core Planes & Colors

| Plane | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| **Background Base** | `--color-bg-base` | `#050505` | Root background |
| **Background Elevated** | `--color-bg-elevated` | `#0A0A0A` | Card backgrounds |
| **Background Surface** | `--color-bg-surface` | `#101010` | Panel surfaces |
| **Glass Panel** | `--glass-bg` | `rgba(255, 255, 255, 0.03)` | Translucent panels |
| **Glass Border** | `--glass-border` | `rgba(255, 255, 255, 0.1)` | Subtle borders |

### 1.3 Accent Colors

| Color Name | CSS Variable | Value | Usage |
|------------|--------------|-------|-------|
| **Primary (Emerald)** | `--color-primary` | `#00F5A0` | BUY actions, positive growth |
| **Primary Hover** | `--color-primary-hover` | `#00D88A` | Primary button hover |
| **Secondary (Crimson)** | `--color-secondary` | `#FF4D4D` | SELL actions, risk alerts |
| **Secondary Hover** | `--color-secondary-hover` | `#E64444` | Secondary button hover |
| **Neutral (Blue)** | `--color-neutral` | `#00D2FF` | System logs, info stats |
| **Warning** | `--color-warning` | `#FFB800` | Caution indicators |
| **Success** | `--color-success` | `#00F5A0` | Confirmations |
| **Error** | `--color-error` | `#FF4D4D` | Errors, rejections |

### 1.4 Text Colors

| Color Name | CSS Variable | Value | Usage |
|------------|--------------|-------|-------|
| **Text Primary** | `--text-primary` | `#FFFFFF` | Headlines, primary text |
| **Text Secondary** | `--text-secondary` | `rgba(255, 255, 255, 0.7)` | Body text, descriptions |
| **Text Muted** | `--text-muted` | `rgba(255, 255, 255, 0.5)` | Labels, hints |
| **Text Disabled** | `--text-disabled` | `rgba(255, 255, 255, 0.3)` | Disabled states |

### 1.5 CSS Custom Properties (Design Tokens)

```css
:root {
  /* Colors */
  --color-bg-base: #050505;
  --color-bg-elevated: #0A0A0A;
  --color-bg-surface: #101010;
  --color-primary: #00F5A0;
  --color-primary-hover: #00D88A;
  --color-secondary: #FF4D4D;
  --color-secondary-hover: #E64444;
  --color-neutral: #00D2FF;
  --color-warning: #FFB800;
  --color-success: #00F5A0;
  --color-error: #FF4D4D;

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --text-disabled: rgba(255, 255, 255, 0.3);

  /* Glass Effect */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 20px;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow-primary: 0 0 20px rgba(0, 245, 160, 0.3);
  --shadow-glow-secondary: 0 0 20px rgba(255, 77, 77, 0.3);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;

  /* Z-Index Scale */
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
  --z-tooltip: 400;

  /* Breakpoints (for reference, use in media queries) */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

---

## 2. Typography

### 2.1 Font Stack

| Purpose | Font Family | Fallbacks |
|---------|-------------|-----------|
| **Headings** | `Outfit` | `Inter, system-ui, sans-serif` |
| **Body** | `Inter` | `system-ui, sans-serif` |
| **Data/Monospace** | `JetBrains Mono` | `Fira Code, monospace` |

### 2.2 Type Scale

```css
/* Headings */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
--font-size-5xl: 3rem;      /* 48px */

/* Line Heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 2.3 Font Loading

```html
<!-- Preload critical fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 3. Component Hierarchy (React 19)

### 3.1 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI Framework |
| TypeScript | 5.7.x | Type Safety |
| Vite | 7.3 | Build Tool |
| Vanilla CSS | - | Styling (no Tailwind) |
| Zustand | 5.x | State Management |
| CopilotKit | Latest | Generative UI |
| TradingView Lightweight Charts | 5.x | Financial Charts |
| D3.js | 7.x | Custom Visualizations |

### 3.2 React 19 Features Used

- **Transitions**: Use `useTransition` for non-urgent updates (filtering, sorting)
- **Actions**: Form actions with `useActionState` for trade approvals
- **useOptimistic**: Optimistic UI updates for approval actions
- **Suspense**: Streaming components with loading skeletons
- **use()**: Reading resources in render

### 3.3 Component Architecture

```
src/
├── components/
│   ├── primitives/          # Atomic components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── Skeleton/
│   │   └── Tooltip/
│   │
│   ├── composite/           # Combined components
│   │   ├── GlassPanel/
│   │   ├── TradeCard/
│   │   ├── ChartContainer/
│   │   ├── MetricDisplay/
│   │   └── AgentStatusBadge/
│   │
│   ├── layouts/             # Layout components
│   │   ├── DashboardShell/
│   │   ├── ResizablePanel/
│   │   ├── Sidebar/
│   │   └── Header/
│   │
│   ├── views/               # Page-level components
│   │   ├── Dashboard/
│   │   ├── SignalReview/
│   │   ├── LLMConfig/
│   │   └── Portfolio/
│   │
│   └── generative/          # CopilotKit components
│       ├── ChatMessage/
│       ├── VolatilityChart/
│       └── TradePreviewCard/
│
├── styles/
│   ├── tokens.css           # Design tokens
│   ├── globals.css          # Global styles
│   └── utilities.css        # Utility classes
│
└── hooks/
    ├── useStreamingData.ts
    ├── useTradeApproval.ts
    └── useLLMConfig.ts
```

---

## 4. Core Components

### 4.1 GlassPanel

The foundational container component with glassmorphism effect.

```tsx
// components/composite/GlassPanel/GlassPanel.tsx

interface GlassPanelProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function GlassPanel({
  children,
  variant = 'default',
  padding = 'md',
  className
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'glass-panel',
        `glass-panel--${variant}`,
        `glass-panel--padding-${padding}`,
        className
      )}
    >
      {children}
    </div>
  );
}
```

```css
/* components/composite/GlassPanel/GlassPanel.css */

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}

.glass-panel--elevated {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: var(--shadow-md);
}

.glass-panel--interactive {
  cursor: pointer;
}

.glass-panel--interactive:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.glass-panel--padding-none { padding: 0; }
.glass-panel--padding-sm { padding: var(--space-sm); }
.glass-panel--padding-md { padding: var(--space-md); }
.glass-panel--padding-lg { padding: var(--space-lg); }
```

### 4.2 Button Component

```tsx
// components/primitives/Button/Button.tsx

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        loading && 'btn--loading',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      <span className="btn__content">{children}</span>
      {rightIcon}
    </button>
  );
}
```

```css
/* components/primitives/Button/Button.css */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-family: var(--font-body);
  font-weight: var(--font-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.btn--primary {
  background: var(--color-primary);
  color: #000;
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-glow-primary);
}

.btn--secondary {
  background: var(--color-secondary);
  color: #fff;
}
.btn--secondary:hover:not(:disabled) {
  background: var(--color-secondary-hover);
  box-shadow: var(--shadow-glow-secondary);
}

.btn--ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--glass-bg);
  border-color: var(--text-muted);
}

.btn--danger {
  background: var(--color-error);
  color: #fff;
}

/* Sizes */
.btn--sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
}
.btn--md {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-size-base);
}
.btn--lg {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--font-size-lg);
}

.btn--loading {
  pointer-events: none;
}
```

### 4.3 TradeCard Component

```tsx
// components/composite/TradeCard/TradeCard.tsx

interface TradeCardProps {
  proposal: TradeProposal;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
}

export function TradeCard({ proposal, onApprove, onReject, onViewDetails }: TradeCardProps) {
  const [isApproving, startApproveTransition] = useTransition();
  const [isRejecting, startRejectTransition] = useTransition();

  return (
    <GlassPanel variant="elevated" className="trade-card">
      <header className="trade-card__header">
        <div className="trade-card__symbol">
          <span className="trade-card__ticker">{proposal.symbol}</span>
          <Badge variant={proposal.action === 'BUY' ? 'success' : 'danger'}>
            {proposal.action}
          </Badge>
        </div>
        <span className="trade-card__time">
          {formatDistanceToNow(proposal.createdAt)}
        </span>
      </header>

      <div className="trade-card__metrics">
        <MetricDisplay
          label="Confidence"
          value={proposal.confidenceScore}
          format="percentage"
        />
        <MetricDisplay
          label="Position Size"
          value={proposal.recommendedPositionSize}
          format="currency"
        />
      </div>

      <div className="trade-card__reasoning">
        <p>{truncate(proposal.chainOfThought, 150)}</p>
        <button className="trade-card__more" onClick={onViewDetails}>
          View Full Analysis →
        </button>
      </div>

      <div className="trade-card__actions">
        <Button
          variant="secondary"
          onClick={() => startRejectTransition(onReject)}
          loading={isRejecting}
        >
          Reject
        </Button>
        <Button
          variant="primary"
          onClick={() => startApproveTransition(onApprove)}
          loading={isApproving}
        >
          Approve
        </Button>
      </div>
    </GlassPanel>
  );
}
```

### 4.4 Skeleton Loaders

```tsx
// components/primitives/Skeleton/Skeleton.tsx

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animation = 'wave'
}: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', `skeleton--${variant}`, `skeleton--${animation}`)}
      style={{ width, height }}
    />
  );
}

// Pre-built skeleton compositions
export function TradeCardSkeleton() {
  return (
    <GlassPanel className="trade-card-skeleton">
      <div className="trade-card-skeleton__header">
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={50} height={20} />
      </div>
      <Skeleton variant="text" count={3} />
      <div className="trade-card-skeleton__actions">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </GlassPanel>
  );
}
```

```css
/* components/primitives/Skeleton/Skeleton.css */

.skeleton {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
}

.skeleton--text {
  height: 1em;
  margin-bottom: 0.5em;
}

.skeleton--circular {
  border-radius: 50%;
}

.skeleton--pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton--wave {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-wave 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes skeleton-wave {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 5. Dashboard Shell & Layouts

### 5.1 The Dashboard Shell

- **Resizable Panels**: User can drag/resize the Market Watch, Chart, and Portfolio summary widgets.
- **Persistence**: Layout state is saved to `localStorage` and synchronized with the database on change.

```tsx
// components/layouts/DashboardShell/DashboardShell.tsx

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [layout, setLayout] = useLocalStorage('dashboard-layout', defaultLayout);

  return (
    <div className="dashboard-shell">
      <Header />
      <ResizablePanelGroup
        direction="horizontal"
        onLayoutChange={setLayout}
        className="dashboard-shell__main"
      >
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={80}>
          <main className="dashboard-shell__content">
            {children}
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

### 5.2 The HITL Review Deck

- **Card Stack UX**: Pending trade proposals appear as a stack of "Live Cards."
- **Deep Zoom**: Clicking a "Chain of Thought" paragraph reveals a side-by-side view: the AI's reasoning on the left, and the *rendered source document* (from MinIO) on the right.

```tsx
// components/views/SignalReview/SignalReview.tsx

export function SignalReview() {
  const { proposals, approve, reject } = useTradeProposals();
  const [selectedProposal, setSelectedProposal] = useState<TradeProposal | null>(null);

  return (
    <div className="signal-review">
      <div className="signal-review__list">
        <h2>Pending Trade Proposals</h2>
        <div className="signal-review__stack">
          {proposals.map((proposal) => (
            <TradeCard
              key={proposal.id}
              proposal={proposal}
              onApprove={() => approve(proposal.id)}
              onReject={() => reject(proposal.id)}
              onViewDetails={() => setSelectedProposal(proposal)}
            />
          ))}
        </div>
      </div>

      {selectedProposal && (
        <DetailDrawer onClose={() => setSelectedProposal(null)}>
          <ChainOfThoughtViewer proposal={selectedProposal} />
        </DetailDrawer>
      )}
    </div>
  );
}
```

---

## 6. Generative UI Integration (CopilotKit)

We use **CopilotKit** to turn the static dashboard into a conversational interface.

### 6.1 CopilotKit Setup

```tsx
// App.tsx

import { CopilotKit, CopilotSidebar } from "@copilotkit/react-core";

function App() {
  return (
    <CopilotKit
      agent="omnitrade-assistant"
      instructions="You are the OmniTrade AI assistant..."
    >
      <DashboardShell>
        <Routes>...</Routes>
      </DashboardShell>
      <CopilotSidebar
        defaultOpen={false}
        labels={{ title: "OmniTrade Assistant", placeholder: "Ask about trades..." }}
      />
    </CopilotKit>
  );
}
```

### 6.2 Custom Renderers

If the user asks "Show me Apple's volatility," the chat doesn't just return text; it triggers a **Generative UI Component** (a d3.js-based volatility chart) directly in the chat bubble.

```tsx
// components/generative/VolatilityChart.tsx

import { CopilotKitCSSProperties } from "@copilotkit/react-core";

export function VolatilityChart({ symbol, data }: VolatilityChartProps) {
  return (
    <div
      className="generative-chart volatility-chart"
      style={{"--copilot-kit-primary-color": "var(--color-primary)"} as CopilotKitCSSProperties}
    >
      <h4>{symbol} Volatility (30-day)</h4>
      <svg ref={svgRef} width="100%" height={200}>
        {/* D3.js volatility visualization */}
      </svg>
      <div className="volatility-chart__legend">
        <span>Current: {data.currentVol}%</span>
        <span>Avg: {data.avgVol}%</span>
      </div>
    </div>
  );
}

// Register with CopilotKit
copilotKit.registerRenderer("volatility_chart", VolatilityChart);
```

### 6.3 Action Readiness

If the user says "Prepare a buy order for 10 TSLA," the assistant populates the trade review queue locally so the user only has to click "Confirm."

```tsx
// hooks/useCopilotActions.ts

import { useCopilotAction } from "@copilotkit/react-core";

export function useCopilotTradeActions() {
  const { addProposal } = useTradeProposals();

  useCopilotAction({
    name: "prepareTradeOrder",
    description: "Prepare a trade order for user review",
    parameters: [
      { name: "symbol", type: "string", required: true },
      { name: "action", type: "string", enum: ["BUY", "SELL"] },
      { name: "quantity", type: "number" },
    ],
    handler: async ({ symbol, action, quantity }) => {
      const proposal = await addProposal({
        symbol,
        action,
        recommendedPositionSize: quantity,
        status: "DRAFT",
      });

      return {
        message: `I've prepared a ${action} order for ${quantity} shares of ${symbol}. Review it in your queue.`,
        component: <TradePreviewCard proposal={proposal} />,
      };
    },
  });
}
```

---

## 7. Performance Optimization

### 7.1 Streaming Indicators

Technical indicators (RSI/MACD) are calculated in the backend and streamed via **WebSockets**. The frontend uses `requestAnimationFrame` to ensure 60fps chart updates even with high tick volume.

```tsx
// hooks/useStreamingData.ts

export function useStreamingData<T>(
  endpoint: string,
  options?: { throttle?: number }
) {
  const [data, setData] = useState<T[]>([]);
  const rafRef = useRef<number>();
  const pendingData = useRef<T[]>([]);

  useEffect(() => {
    const ws = new WebSocket(endpoint);

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      pendingData.current.push(newData);

      // Throttle updates to animation frames
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setData((prev) => [...prev, ...pendingData.current].slice(-1000));
          pendingData.current = [];
          rafRef.current = undefined;
        });
      }
    };

    return () => {
      ws.close();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [endpoint]);

  return data;
}
```

### 7.2 Skeleton States

All glass panels use animated skeleton loaders to maintain the "liquid" feel while RAG results are being synthesized by the Intelligence Plane.

```tsx
// Example usage with Suspense

import { Suspense } from 'react';

function TradeProposalList() {
  return (
    <Suspense fallback={<TradeCardSkeleton count={3} />}>
      <TradeProposalListContent />
    </Suspense>
  );
}
```

### 7.3 Virtualization

For long lists of trade history or audit logs, use virtualization:

```tsx
import { VirtualList } from '@tanstack/react-virtual';

function AuditLogList({ logs }: { logs: AuditLog[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="audit-log-list">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <AuditLogItem
            key={logs[virtualRow.index].id}
            log={logs[virtualRow.index]}
            style={{
              position: 'absolute',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Accessibility

### 8.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | Minimum 4.5:1 for text (validated with custom tokens) |
| Focus Indicators | Visible focus rings on all interactive elements |
| Keyboard Navigation | Full keyboard support for all actions |
| Screen Reader | ARIA labels, live regions for updates |
| Reduced Motion | Respect `prefers-reduced-motion` |

### 8.2 Focus Management

```css
/* Focus visible styles */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default outline when using mouse */
:focus:not(:focus-visible) {
  outline: none;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.3 ARIA Patterns

```tsx
// Example: Trade card with proper ARIA

<div
  role="article"
  aria-labelledby={`trade-${proposal.id}-title`}
  className="trade-card"
>
  <h3 id={`trade-${proposal.id}-title`}>
    {proposal.action} {proposal.symbol}
  </h3>

  <div role="group" aria-label="Trade metrics">
    <span aria-label={`Confidence: ${proposal.confidenceScore}%`}>
      {proposal.confidenceScore}% confidence
    </span>
  </div>

  <div role="group" aria-label="Actions">
    <button aria-label={`Approve ${proposal.action} order for ${proposal.symbol}`}>
      Approve
    </button>
    <button aria-label={`Reject ${proposal.action} order for ${proposal.symbol}`}>
      Reject
    </button>
  </div>
</div>
```

---

## 9. Internationalization (i18n)

### 9.1 Supported Locales

| Locale | Code | Direction |
|--------|------|-----------|
| English (US) | `en-US` | LTR |
| Arabic | `ar-SA` | RTL |

### 9.2 RTL Support

```css
/* RTL-aware utilities */
[dir="rtl"] .trade-card__actions {
  flex-direction: row-reverse;
}

/* Logical properties for spacing */
.trade-card {
  padding-inline: var(--space-md);
  margin-block: var(--space-sm);
}

/* Flip icons that indicate direction */
[dir="rtl"] .icon-arrow-right {
  transform: scaleX(-1);
}
```

### 9.3 Number & Date Formatting

```tsx
// utils/formatters.ts

const formatters = {
  'en-US': {
    currency: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    percent: new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }),
    date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }),
  },
  'ar-SA': {
    currency: new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'USD' }),
    percent: new Intl.NumberFormat('ar-SA', { style: 'percent', maximumFractionDigits: 2 }),
    date: new Intl.DateTimeFormat('ar-SA', { calendar: 'gregory', dateStyle: 'medium' }),
  },
};

export function formatCurrency(value: number, locale: Locale = 'en-US'): string {
  return formatters[locale].currency.format(value);
}
```

---

## 10. Responsive Design

### 10.1 Breakpoints

```css
/* Mobile first approach */
/* Base: Mobile (< 640px) */

/* Small devices (640px+) */
@media (min-width: 640px) { ... }

/* Medium devices (768px+) */
@media (min-width: 768px) { ... }

/* Large devices (1024px+) */
@media (min-width: 1024px) { ... }

/* Extra large (1280px+) */
@media (min-width: 1280px) { ... }

/* 2XL (1536px+) */
@media (min-width: 1536px) { ... }
```

### 10.2 Layout Adaptations

| Viewport | Layout |
|----------|--------|
| Mobile (< 768px) | Single column, bottom navigation, stacked cards |
| Tablet (768px - 1024px) | Two column, sidebar collapses to icons |
| Desktop (1024px+) | Three column, resizable panels, sidebar expanded |
| Ultrawide (1536px+) | Max-width container, centered content |

---

## 11. Animation & Micro-interactions

### 11.1 Transition Tokens

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 11.2 Common Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse (for live indicators) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Glow effect */
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px var(--color-primary); }
  50% { box-shadow: 0 0 20px var(--color-primary); }
}

/* Apply animations */
.trade-card {
  animation: slideUp var(--transition-normal);
}

.trade-card--pending {
  animation: glow 2s ease-in-out infinite;
}
```

---

## 12. Testing Strategy

### 12.1 Component Testing

- **Framework**: Vitest + React Testing Library
- **Coverage Target**: 80% for critical paths

```tsx
// __tests__/TradeCard.test.tsx

describe('TradeCard', () => {
  it('renders proposal information correctly', () => {
    render(<TradeCard proposal={mockProposal} {...handlers} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();
  });

  it('calls onApprove when approve button clicked', async () => {
    const onApprove = vi.fn();
    render(<TradeCard proposal={mockProposal} onApprove={onApprove} {...other} />);
    await userEvent.click(screen.getByRole('button', { name: /approve/i }));
    expect(onApprove).toHaveBeenCalled();
  });

  it('shows loading state during approval', async () => {
    render(<TradeCard proposal={mockProposal} {...handlers} />);
    const button = screen.getByRole('button', { name: /approve/i });
    await userEvent.click(button);
    expect(button).toBeDisabled();
  });
});
```

### 12.2 Accessibility Testing

- **Tool**: axe-core via vitest-axe
- **Coverage**: All interactive components

### 12.3 Visual Regression

- **Tool**: Playwright + Percy/Chromatic
- **Scope**: Critical user flows

---

## 13. File Structure Summary

```
frontend/
├── src/
│   ├── components/
│   │   ├── primitives/       # Button, Input, Badge, Skeleton, Tooltip
│   │   ├── composite/        # GlassPanel, TradeCard, ChartContainer
│   │   ├── layouts/          # DashboardShell, ResizablePanel, Sidebar
│   │   ├── views/            # Dashboard, SignalReview, LLMConfig
│   │   └── generative/       # CopilotKit custom components
│   │
│   ├── styles/
│   │   ├── tokens.css        # Design tokens (colors, spacing, etc.)
│   │   ├── globals.css       # Reset, base styles
│   │   └── utilities.css     # Utility classes
│   │
│   ├── hooks/
│   │   ├── useStreamingData.ts
│   │   ├── useTradeApproval.ts
│   │   ├── useLLMConfig.ts
│   │   └── useCopilotActions.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts     # Number, date, currency formatting
│   │   └── cn.ts             # Class name utility
│   │
│   ├── types/
│   │   └── index.ts          # Shared TypeScript types
│   │
│   └── i18n/
│       ├── en-US.json
│       └── ar-SA.json
│
├── public/
│   └── fonts/                # Self-hosted fonts for performance
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```


 # StockPulse UI Implementation Specification

## Introduction

This document outlines the complete user interface requirements for the StockPulse AI-powered stock analysis platform. It provides a comprehensive breakdown of all pages, components, and UI elements needed to implement the full feature set described in the StockPulse design document. This specification serves as a guide for frontend developers, designers, and product managers during implementation.

## Table of Contents

1.  [Authentication Pages](#1-authentication-pages)
2.  [Dashboard Pages](#2-dashboard-pages)
3.  [Stock Analysis Pages](#3-stock-analysis-pages)
4.  [Analyst Intelligence Pages](#4-analyst-intelligence-pages)
5.  [Agent Management Pages](#5-agent-management-pages)
6.  [Trading Modules Pages](#6-trading-modules-pages)
7.  [Stock Screener Pages](#7-stock-screener-pages)
8.  [Risk Management Pages](#8-risk-management-pages)
9.  [Settings and Administration Pages](#9-settings-and-administration-pages)
10. [Mobile-Specific Pages](#10-mobile-specific-pages)
11. [Analytics and Reporting Pages](#11-analytics-and-reporting-pages)
12. [Learning and Documentation Pages](#12-learning-and-documentation-pages)

## 1. Authentication Pages

### 1.1 Login Page

-   Username/email and password fields
-   "Remember me" option
-   Password reset link
-   Social/OAuth login options
-   Error messaging for failed attempts

### 1.2 Registration Page

-   Email, username, password fields
-   User agreement checkbox
-   Email verification workflow
-   Multi-step registration process
-   Strong password requirements indicator

### 1.3 Password Reset Page

-   Email input for reset link
-   Security verification steps
-   New password and confirmation fields
-   Success confirmation screen

## 2. Dashboard Pages

### 2.1 Main Dashboard

-   Summary overview cards of portfolios/watchlists
-   Quick access to recent analyses
-   Real-time market indices ticker
-   Performance summary of tracked positions
-   Notifications center
-   Today's signals and alerts
-   News headline ticker
-   Agent activity summary
-   User-customizable widgets
-   Quick navigation to main sections

### 2.2 Portfolio Dashboard

-   Current holdings summary with P&L visualization
-   Asset allocation pie chart
-   Performance metrics (daily, weekly, monthly, yearly)
-   Risk metrics display
-   Positions table with key metrics
-   Unrealized gains/losses indicators
-   Portfolio health score
-   Diversification analysis
-   Correlation matrix visualization
-   Cost basis reporting
-   Dividend income tracking

### 2.3 Watchlist Dashboard

-   Multiple customizable watchlists
-   Real-time price/change updates
-   Technical indicators summary
-   Latest signal indicators
-   One-click analysis button
-   Quick-add ticker search
-   Drag-and-drop organization
-   Custom column configuration
-   Color-coded performance indicators
-   Export/import functionality

## 3. Stock Analysis Pages

### 3.1 Single Stock Analysis Page

-   Advanced interactive chart with multiple timeframes
-   Technical analysis indicator overlay controls
-   Price and volume data visualization
-   Company profile summary
-   Key fundamental metrics display
-   Latest news and events panel
-   Analyst ratings summary
-   Institutional ownership information
-   Technical analysis summary section
-   Fundamental analysis summary section
-   Sentiment analysis summary section
-   Alternative data analysis summary
-   Options chain integration
-   Trading signals and recommendations
-   AI-generated analysis narratives
-   Support/resistance level indicators
-   Price target visualization
-   Historical events overlay
-   Peer comparison metrics
-   Related stocks suggestions

### 3.2 Multi-Stock Comparison Page

-   Side-by-side chart comparison
-   Correlation visualization
-   Relative strength chart
-   Comparative fundamental metrics table
-   Performance comparison over custom timeframes
-   Ratio charts (stock vs stock)
-   Sector/industry relative performance
-   Volatility comparison
-   Synchronized chart controls
-   Comparative valuation metrics
-   Growth metrics comparison
-   Export comparison data functionality
-   Custom metrics comparison builder

### 3.3 Technical Analysis Page

-   Detailed multi-timeframe chart system
-   Comprehensive technical indicator library
-   Drawing tools (Fibonacci, trendlines, etc.)
-   Pattern recognition visualization
-   Support/resistance levels detection
-   Volume profile analysis
-   Chart type selection (candlestick, bar, line, etc.)
-   Custom indicator creation interface
-   Saved chart layouts and presets
-   Indicator alert creation
-   Advanced chart studies
-   Historical pattern matching
-   Chart annotation tools
-   Multi-pane chart views
-   Real-time chart updates
-   Timeframe synchronization
-   Chart templates management

### 3.4 Fundamental Analysis Page

-   Financial statements (income, balance sheet, cash flow)
-   Quarterly/annual comparison tools
-   Financial ratio dashboards
-   Growth metrics visualization
-   Valuation metrics calculation
-   Earnings history and surprises
-   Dividend history and projections
-   Corporate events timeline
-   SEC filing integration and analysis
-   Fundamental trend visualization
-   Peer comparison framework
-   Industry average benchmarking
-   Financial health scoring
-   Red flag indicators
-   Future growth projections
-   Cash flow analysis tools
-   Capital allocation visualization
-   Segment performance breakdown
-   Custom valuation model builder

### 3.5 Sentiment Analysis Page

-   Social media sentiment tracking
-   News sentiment visualization
-   Analyst sentiment tracking
-   Insider sentiment based on transactions
-   Sentiment trend charts
-   Sentiment word clouds
-   Sentiment by source breakdown
-   Sentiment vs. price correlation
-   Sentiment anomaly detection
-   Sentiment-based signals
-   Real-time sentiment updates
-   Sentiment history charts
-   Sentiment distribution visualization
-   Source credibility ratings
-   Customizable sentiment thresholds
-   Sentiment export functionality
-   Sentiment alert creation

### 3.6 Alternative Data Analysis Page

-   Satellite imagery analysis results
-   Web traffic trends visualization
-   App download/usage metrics
-   Credit card spending patterns
-   Weather impact analysis
-   Supply chain visualization
-   Patent filing analysis
-   Hiring trend analysis
-   Executive travel patterns
-   Conference attendance data
-   Search trend correlation
-   Alternative data source selection
-   Custom alternative data visualization
-   Alternative data vs. price correlation
-   Anomaly highlighting
-   Data source credibility ratings
-   Custom timeframe selection

## 4. Analyst Intelligence Pages

### 4.1 Analyst Intelligence Page

-   Analyst recommendation feed with real-time updates
-   Analyst credibility scoring and historical accuracy metrics
-   Rating change visualization with historical context
-   Investment thesis summary with key points extraction
-   Recommendation validation assessment
-   Growth opportunity highlighting for analyst-covered stocks
-   Consensus view visualization with outlier identification
-   Custom alerts for specific analysts or rating changes
-   Analyst coverage gap identification for emerging opportunities
-   Firm-level performance metrics and specialization details
-   Recommendation history with performance tracking
-   Sector and industry consensus heatmaps
-   Stock-specific analyst coverage dashboard
-   Personalized daily recommendation cards
-   Original research report access (where available)
-   Bull/bear case comparison across analyst viewpoints
-   Target price distribution visualization
-   Earnings estimate comparison charts
-   AI-generated second opinion versus analyst consensus
-   Recommendation filtering and search tools

### 4.2 Stock Profile Enhancement: Analyst Coverage Panel

-   Comprehensive view of all analyst ratings and price targets
-   Analyst credibility indicators beside each rating
-   Historical timeline of rating changes with price overlay
-   Consensus visualization with distribution chart
-   Recently changed ratings highlighting
-   Price target range visualization
-   Earnings estimate comparison versus actuals
-   Rating change alerts configuration
-   Top analyst opinions with performance metrics
-   Bull/bear case extremes with supporting theses
-   AI validation score for each recommendation
-   Sector-relative consensus comparison
-   Correlation between rating changes and price movement
-   Custom watchlist for analyst-covered stocks
-   Rating aggregation by firm and individual analyst
-   Historical recommendation accuracy metrics

## 5. Agent Management Pages

### 5.1 Agent Overview Page

-   Agent catalog with status indicators
-   Performance metrics for each agent
-   Agent configuration controls
-   Activation/deactivation toggles
-   Agent resource usage monitoring
-   Agent version management
-   Agent dependency visualization
-   Health status monitoring
-   Activity logs for each agent
-   Agent performance history charts
-   Resource allocation controls
-   Custom agent configuration interface
-   Agent marketplace integration
-   Agent learning progress tracking
-   Agent-specific documentation
-   Service level indicators

### 5.2 Agent Configuration Page

-   LLM provider selection
-   Model selection controls
-   Temperature and parameter controls
-   System prompt configuration
-   Context window optimization tools
-   Custom prompt template editor
-   Response format controls
-   Input/output examples management
-   Performance optimization settings
-   Fallback configuration
-   Timeout settings
-   Error handling configuration
-   API key management
-   Usage quota monitoring
-   Cost optimization controls
-   Testing interface
-   Version history tracking
-   Import/export configuration

### 5.3 Agent Collaboration Page

-   Agent interaction flow diagram
-   Collaboration rule configuration
-   Signal aggregation settings
-   Consensus mechanism configuration
-   Agent hierarchy visualization
-   Communication flow monitoring
-   Signal weighting adjustment
-   Conflict resolution settings
-   Agent conversation logs
-   Performance feedback configuration
-   Collaboration templates
-   Custom collaboration workflow builder
-   Collaboration testing interface
-   Meta-agent configuration

## 6. Trading Modules Pages

### 6.1 Day Trading Module Page

-   Real-time streaming charts
-   Order book visualization
-   Level 2 market data display
-   Quick-action trading panel
-   Position tracker with P&L visualization
-   Scalping signal indicators
-   Momentum breakout detection
-   Volume spike alerts
-   Price reversal pattern indicators
-   Gap trading opportunities
-   Market open/close specialized views
-   Tick-by-tick analysis display
-   Pattern recognition visualization
-   Divergence detection indicators
-   Support/resistance level indicators
-   Volume profile visualization
-   Day trading options strategy interface
-   Real-time signal alerts
-   Multi-timeframe analysis tools
-   Trading journal integration
-   Performance analytics dashboard
-   Feature toggle control panel
-   Custom layout configuration

### 6.2 Positional Trading Module Page

-   Multi-day charts with indicators
-   Trend identification visualization
-   Swing trading opportunity signals
-   Cycle analysis tools
-   Sector rotation visualization
-   Relative strength comparison
-   Pattern completion indicators
-   Seasonality analysis tools
-   Multi-timeframe correlation display
-   Trend alignment visualization
-   Confirmation logic indicators
-   Nested pattern identification
-   Timeframe transition tracking
-   Fractal analysis visualization
-   Options strategy interface for positional trading
-   Position management panel
-   Scenario analysis tools
-   Risk visualization dashboard
-   Entry/exit level planning tools
-   Feature toggle control panel
-   Custom layout configuration

### 6.3 Short-Term Investment Module Page

-   Catalyst identification calendar
-   Earnings play opportunity finder
-   Momentum screener interface
-   Sector trend visualization
-   News impact analysis tools
-   Technical setup scanner
-   Volatility edge opportunity finder
-   Risk-reward visualization tools
-   Probability calculation display
-   Expected value analysis
-   Risk-adjusted return metrics
-   Position sizing calculator
-   Correlation analysis matrix
-   Scenario analysis tools
-   Options strategy interface for short-term plays
-   Opportunity scanner dashboard
-   Catalyst calendar integration
-   Momentum tracking dashboard
-   Sector rotation mapping
-   Feature toggle control panel
-   Custom layout configuration

### 6.4 Long-Term Investment Module Page

-   Fundamental dashboard with key metrics
-   Valuation model visualization
-   Growth projection tools
-   Competitive advantage analysis
-   Industry trend visualization
-   Macroeconomic impact analysis
-   Dividend analysis dashboard
-   Technological disruption assessment
-   Financial statement analysis tools
-   Management quality assessment
-   Business model analysis framework
-   Competitive positioning visualization
-   Growth runway estimation
-   Capital allocation analysis
-   LEAPS and long-term options strategies
-   Portfolio builder interface
-   Long-term chart analysis tools
-   Peer comparison framework
-   Industry average benchmarking
-   Feature toggle control panel
-   Custom layout configuration

## 7. Stock Screener Pages

### 7.1 Main Screener Page

-   Natural language query input
-   Visual filter builder interface
-   Dual-mode interface (NL and traditional)
-   Query interpretation display
-   Real-time results preview
-   Customizable results columns
-   Conditional formatting controls
-   Screening results management
-   Saved screens library
-   Screening history tracking
-   Export functionality
-   Screening templates
-   Filter explanation display
-   Confidence indicators for NL interpretation
-   Alternate interpretation suggestions
-   Technical term definitions
-   Source reference citations
-   Industry benchmark integration
-   Filter validation indicators
-   Advanced mode for power users

### 7.2 Screener Results Page

-   Dynamic results grid with custom columns
-   Sorting and secondary sorting controls
-   Conditional formatting visualization
-   Inline charts and sparklines
-   Expandable detail views
-   Comparison selection tools
-   Quick action buttons (research, watchlist, trading)
-   Results export options
-   Visualization dashboard with scatter plots
-   Heat map visualization
-   Sector distribution breakdown
-   Performance comparison vs benchmarks
-   Metric distribution histograms
-   Correlation analysis tools
-   Factor exposure visualization
-   Technical pattern visualization
-   Results filtering and refining tools
-   One-click analysis transitions
-   Batch action capabilities
-   Custom column configuration

### 7.3 Screener Management Page

-   Saved screens organization
-   Categorization tools
-   Scheduled execution configuration
-   Sharing controls
-   Version history tracking
-   Results comparison tools
-   Alert configuration interface
-   Screen combining tools
-   Performance tracking visualization
-   Template management
-   Import/export functionality
-   Permission management
-   Notification settings

## 8. Risk Management Pages

### 8.1 Risk Dashboard

-   Portfolio risk overview
-   VaR (Value at Risk) calculation
-   Expected shortfall metrics
-   Stress test scenarios
-   Correlation matrix visualization
-   Risk factor exposure
-   Drawdown analysis
-   Volatility metrics
-   Beta analysis
-   Sector concentration visualization
-   Market risk indicators
-   Liquidity risk assessment
-   Risk-adjusted return metrics
-   Monte Carlo simulation results
-   Custom risk metrics configuration
-   Risk alert thresholds
-   Hedging recommendation engine

### 8.2 Position Sizing Calculator

-   Risk per trade configuration
-   Account size management
-   Maximum drawdown settings
-   Optimal position size calculation
-   Risk-reward visualization
-   Multi-position correlation analysis
-   Portfolio impact simulation
-   Stop-loss placement optimization
-   Take-profit optimization
-   Expected value calculation
-   Win rate integration
-   Probability-based sizing
-   Kelly criterion calculator
-   Fixed fractional position sizing
-   Volatility-adjusted position sizing
-   Custom sizing formula builder

## 9. Settings and Administration Pages

### 9.1 User Profile & Settings

-   Personal information management
-   Security settings (password, MFA)
-   API key management
-   Notification preferences
-   UI customization options
-   Theme selection
-   Default view configuration
-   Language settings
-   Data display preferences
-   Time zone configuration
-   Currency preferences
-   Session management
-   Activity logs
-   Subscription management
-   Privacy settings
-   Data export options
-   Third-party integrations management

### 9.2 Broker Integration Settings

-   Broker connection management
-   API credential configuration
-   Trading permission settings
-   Account selection interface
-   Connection status monitoring
-   Order routing preferences
-   Default order type settings
-   Position synchronization options
-   Paper trading toggle
-   Trading hours configuration
-   Risk limit settings
-   Order confirmation preferences
-   Smart order routing settings
-   Commission calculation settings
-   Margin settings visualization
-   Connection testing interface
-   Troubleshooting tools

### 9.3 Data Source Management

-   Market data source configuration
-   Fundamental data source settings
-   Alternative data source management
-   News and sentiment source selection
-   Data quality monitoring
-   Refresh frequency settings
-   Custom data source integration
-   API usage monitoring
-   Data synchronization controls
-   Offline data management
-   Data conflict resolution settings
-   Historical data range configuration
-   Real-time data settings
-   Data recovery tools
-   Cache management
-   Custom data import tools

### 9.4 Notification Management

-   Notification type configuration
-   Delivery method settings (email, push, SMS)
-   Custom notification rules builder
-   Alert priority settings
-   Trading signal notifications
-   System status notifications
-   Security alert settings
-   Price alert management
-   Volume alert configuration
-   Pattern alert settings
-   News alert configuration
-   Scheduled digest settings
-   Do-not-disturb configuration
-   Mobile device management
-   Notification history and logs
-   Test notification tools

## 10. Mobile-Specific Pages

### 10.1 Mobile Dashboard

-   Compact portfolio overview
-   Simplified watchlist view
-   Latest signals summary
-   Critical alerts display
-   Quick trading interface
-   Streamlined chart view
-   Touch-optimized controls
-   Gesture navigation support
-   Mobile-optimized layouts
-   Quick search functionality
-   Simplified screener access
-   Offline mode indicator
-   Sync status display
-   Battery usage optimization
-   Data usage controls

### 10.2 Mobile Stock Analysis

-   Touch-optimized charts
-   Essential indicators only
-   Simplified technical analysis
-   Key fundamental metrics
-   Streamlined sentiment view
-   Quick analysis summary
-   Gesture-based chart control
-   One-tap trading actions
-   Simplified comparison view
-   Critical news integration
-   Quick position adjustment tools
-   Mobile-optimized layouts
-   Progressive loading indicators
-   Offline analysis capabilities
-   Battery-efficient refresh modes

### 10.3 Mobile Analyst Intelligence

-   Daily recommendation cards with swipeable interface
-   Critical rating change notifications
-   Simplified analyst consensus visualization
-   Growth opportunity highlights with one-tap actions
-   Streamlined analyst credibility metrics
-   Quick-view target price distribution
-   Personalized recommendation feed
-   Recently upgraded/downgraded stock list
-   Top-performing analyst leaderboard
-   Simplified sector sentiment heatmap
-   Battery-efficient scheduled updates
-   Offline access to recent recommendations
-   Voice-narrated daily opportunity summary
-   Notification priority controls for analyst actions
-   Quick filters for rating types and analyst credibility

## 11. Analytics and Reporting Pages

### 11.1 Performance Analytics Dashboard

-   Trading performance metrics
-   Strategy performance tracking
-   Agent performance analytics
-   Risk-adjusted return metrics
-   Benchmark comparison
-   Performance attribution analysis
-   Trading journal integration
-   Profit/loss visualization
-   Win/loss ratio tracking
-   Trade duration analysis
-   Time-of-day performance
-   Asset class performance
-   Custom performance metrics
-   Performance goal tracking
-   Historical performance comparison
-   Custom reporting timeframes
-   Report export functionality

### 11.2 Trading Journal

-   Trade entry recording
-   Trade outcome tracking
-   Entry/exit rationale documentation
-   Strategy tagging
-   Screenshot/chart attachment
-   Emotion tracking
-   Market condition notes
-   Pattern recognition tagging
-   Success/failure analysis
-   Lesson learned recording
-   Trade review scheduling
-   Custom tag management
-   Journal search and filtering
-   Performance correlation analysis
-   Entry/exit visualization
-   Trade clustering analysis
-   Trading behavior insights

### 11.3 Strategy Backtesting

-   Strategy definition interface
-   Parameter configuration
-   Historical data selection
-   Execution visualization
-   Performance metrics calculation
-   Drawdown analysis
-   Optimization tools
-   Parameter sensitivity analysis
-   Monte Carlo simulation
-   Market regime testing
-   Statistical significance testing
-   Strategy comparison tools
-   Equity curve visualization
-   Trade list generation
-   Benchmark comparison
-   Risk-adjusted metrics
-   Report generation
-   Optimization visualization

## 12. Learning and Documentation Pages

### 12.1 Knowledge Base

-   Searchable documentation
-   Feature tutorials
-   Video walkthroughs
-   Interactive guides
-   FAQ section
-   Glossary of terms
-   Best practices documentation
-   Getting started guides
-   Advanced usage techniques
-   Troubleshooting guides
-   API documentation
-   Agent documentation
-   Trading strategy explanations
-   Technical indicator library
-   Fundamental analysis guides
-   Community-contributed content
-   Document version history

### 12.2 Strategy Library

-   Strategy browsing interface
-   Strategy category organization
-   Strategy detail views
-   Performance metrics display
-   Implementation guidelines
-   Parameter explanation
-   Risk profile documentation
-   Example trade visualization
-   Backtesting results display
-   User reviews and ratings
-   Popularity metrics
-   Author information
-   Version history
-   Related strategies
-   Customization guidelines
-   Implementation checklist
-   Strategy subscription management

## Implementation Notes

- LIQUID Glass Morphosimsn with grids, containers etc., to meet top nothc Apple ios 26 IHG quality   
- All pages should implement responsive design principles to ensure optimal display across desktop, tablet, and mobile devices.
-   The UI should support  WCAG 3.0 standards with light and dark themes with consistent styling throughout the application.
-   Feature toggles should be implemented for all features to allow progressive deployment and user customization.
-   Accessibility standards should be maintained throughout the application, ensuring compliance with WCAG 3.0 standards.
-   Performance optimization should be a priority, especially for data-intensive pages and real-time features.
-   The UI should incorporate progressive enhancement principles to maintain functionality across different browser capabilities.