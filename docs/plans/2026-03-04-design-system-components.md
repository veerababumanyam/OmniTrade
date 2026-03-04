# OmniTrade Design System & Component Library Design

**Date:** 2026-03-04
**Status:** Approved
**Authors:** Claude + User

## Executive Summary

This document defines the architecture for OmniTrade's reusable component system, following the 2026 UI/UX Design Standards with Generative UI (GenUI), Liquid Glass design, Photon Physics, and Neuro-Adaptive patterns.

## Architecture Decisions

### 1. Monorepo Structure

```
OmniTrade/
├── frontend/
│   ├── packages/
│   │   ├── ui/                    # Component library (@omnitrade/ui)
│   │   │   ├── src/
│   │   │   │   ├── tokens/        # Design tokens (CSS + TS)
│   │   │   │   ├── atoms/         # Primitive components
│   │   │   │   ├── molecules/     # Composite components
│   │   │   │   ├── organisms/     # Complex UI sections
│   │   │   │   ├── templates/     # Page layouts
│   │   │   │   ├── primitives/    # Layout primitives
│   │   │   │   ├── registry/      # GenUI component registry
│   │   │   │   ├── signal-bus/    # Inter-module communication
│   │   │   │   ├── hooks/         # Shared React hooks
│   │   │   │   ├── utils/         # Utility functions
│   │   │   │   └── index.ts       # Main exports
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   └── themes/                # Brand themes (@omnitrade/themes)
│   ├── apps/
│   │   └── web/                   # Main web application (future)
│   ├── package.json               # Workspace root
│   ├── pnpm-workspace.yaml        # pnpm workspaces config
│   └── tsconfig.json              # Base TypeScript config
```

### 2. Atomic Design Pattern

| Layer | Description | Polymorphism |
|-------|-------------|--------------|
| **Atoms** | Primitive UI elements | Variant-based |
| **Molecules** | Composite components | Variant-based |
| **Organisms** | Complex UI sections | Hybrid |
| **Templates** | Page layouts | Generative |
| **Primitives** | Layout utilities | Static |

### 3. Styling Approach

**CSS Modules + CSS Custom Properties**

- Zero runtime overhead (compiled CSS)
- Runtime token manipulation via CSS custom properties
- Type-safe with TypeScript exports
- Supports GenUI dynamic assembly

### 4. Theming Strategy

**Multi-Brand + Light/Dark Modes**

Token hierarchy:
1. Primitive tokens (immutable values)
2. Brand tokens (brand-specific overrides)
3. Mode tokens (light/dark variations)
4. Semantic tokens (purpose-based)
5. Component tokens (component-specific)

### 5. GenUI Component Registry

TypeScript-based registry for AI-driven component assembly:

```typescript
interface ComponentMeta {
  name: string;
  category: 'atom' | 'molecule' | 'organism' | 'template';
  variants: string[];
  slots: string[];
  signals: string[];
  aiReadable: boolean;
  defaultVariant: string;
  dependencies: string[];
}
```

### 6. Signal Bus (IMC)

EventTarget-based high-frequency signal bus for inter-module communication:

```typescript
type SignalTopic =
  | `ui:${string}:${'focus' | 'blur' | 'click' | 'hover'}`
  | `chat:${string}:${'send' | 'receive' | 'typing'}`
  | `trade:${string}:${'propose' | 'approve' | 'reject' | 'execute'}`
  | `theme:${'change' | 'mode:toggle' | 'brand:switch'}`
  | `nav:${'navigate' | 'back' | 'forward'}`
  | `ai:${'intent:detected' | 'component:assemble' | 'action:suggest'}`;
```

## Component Specifications

### Atoms (12 components)

| Component | Variants | Key Props | Signals |
|-----------|----------|-----------|---------|
| `Button` | primary, secondary, ghost, danger, link | size, loading, disabled, icon | click, focus |
| `Input` | text, number, password, search, textarea | placeholder, error, prefix, suffix | change, focus, blur |
| `Select` | single, multi | options, searchable, clearable | change, open, close |
| `Checkbox` | default, indeterminate | checked, label | change |
| `Toggle` | default, labeled | checked, size | change |
| `Badge` | default, success, warning, error, dot | count, max | - |
| `Avatar` | image, initials, icon | size, status, fallback | - |
| `Icon` | 200+ SVG icons | size, color, animated | - |
| `Tooltip` | default, rich | content, placement, trigger | show, hide |
| `Spinner` | default, dots, pulse | size, color | - |
| `Divider` | horizontal, vertical | spacing, dashed | - |
| `Skeleton` | text, circle, rect | width, height, animated | - |

### Molecules (13 components)

| Component | Composition | Key Features |
|-----------|-------------|--------------|
| `SearchBar` | Input + Icon + Button | Debounce, suggestions, keyboard nav |
| `Dropdown` | Button + Menu + Portal | Virtual scroll, search, groups |
| `DatePicker` | Input + Calendar + Popover | Range, time, presets |
| `TimePicker` | Input + Clock + Popover | 12/24h, seconds, steps |
| `TabGroup` | TabList + Tab + TabPanel | Keyboard nav, animated indicator |
| `Breadcrumb` | Link + Divider + Truncate | Collapsible, icon support |
| `Alert` | Icon + Content + Actions | Dismissible, auto-close, queue |
| `Card` | Header + Body + Footer | Hover effects, selectable |
| `Tag` | Label + Icon + Remove | Editable, color variants |
| `ProgressBar` | Track + Fill + Label | Animated, striped, indeterminate |
| `ChatBubble` | Avatar + Content + Timestamp | User/AI variants, markdown |
| `ChatInput` | TextArea + Buttons | Multi-line, attachments, voice |
| `ChatMessageList` | List + Separators | Auto-scroll, lazy loading |

### Organisms (12 components)

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Header` | App navigation bar | Logo, nav links, search, user menu |
| `Sidebar` | Side navigation | Collapsible, nested menus, shortcuts |
| `Footer` | Page footer | Links, social, legal, version |
| `TradePanel` | Trading interface | Buy/sell, price input, order types |
| `PortfolioCard` | Portfolio summary | Holdings, allocation, P&L |
| `ChartContainer` | Chart wrapper | Toolbar, timeframe, indicators |
| `DataTable` | Data grid | Sorting, filtering, pagination |
| `Modal` | Dialog overlay | Portal, focus trap, animated |
| `Toast` | Notification queue | Stack, auto-dismiss, actions |
| `CommandPalette` | Keyboard command center | Search, actions, shortcuts |
| `ChatPanel` | Main chat interface | Message list, input, AI status |
| `IntentBar` | Zero-state input | Shimmer, AI badge, hesitation |

### Templates (5 layouts)

| Template | Structure | Use Case |
|----------|-----------|----------|
| `DashboardLayout` | Header + Sidebar + Main + Footer | Main trading dashboard |
| `TradeLayout` | Split panel (chart + order) | Focused trading view |
| `SettingsLayout` | Sidebar nav + Content | Settings pages |
| `AuthLayout` | Centered card | Login, register |
| `EmptyState` | Illustration + Message + Action | No data states |

### Layout Primitives (5 components)

| Primitive | Purpose |
|-----------|---------|
| `Box` | Generic container with spacing props |
| `Stack` | Vertical/horizontal flex stack |
| `Grid` | CSS Grid wrapper |
| `Flex` | Flexbox wrapper |
| `Container` | Max-width centered container |

## Design Token Categories

| Category | Tokens | Examples |
|----------|--------|----------|
| **Color** | 60+ | Brand, semantic, surface, text |
| **Space** | 32 | 0-128 scale (4px base) |
| **Typography** | 24 | Font families, sizes, weights |
| **Radius** | 12 | Sharp to pill scale |
| **Shadow** | 16 | Photon physics (layered) |
| **Motion** | 8 | Spring easings, durations |
| **Spatial** | 6 | Z-axis volumes (translateZ) |
| **Blur** | 8 | Backdrop filter intensities |

## Performance Targets

| Metric | Target | Enforcement |
|--------|--------|-------------|
| **INP** | < 40ms | CI fails if exceeded |
| **LCP** | < 2.5s | CI warning |
| **CLS** | < 0.1 | CI fails if exceeded |
| **Bundle (gzip)** | < 50KB atoms | Size limit |
| **CSS (gzip)** | < 30KB tokens | Size limit |

## Accessibility Standards

- **APCA Contrast**: Lc 75 for body text, Lc 60 for interactive
- **WCAG 3.0**: Full compliance
- **Neuro-Adaptive**: Calm mode, dyslexic mode, motion damping
- **Multi-Modal**: Spatial audio cues, haptic signatures

## Implementation Roadmap

### Phase 1: Foundation
- Monorepo structure
- Build tooling (TypeScript, pnpm)
- Design tokens
- Signal Bus
- Testing infrastructure

### Phase 2: Atoms
- Button, Input, Select, Checkbox, Toggle
- Badge, Avatar, Icon, Tooltip, Spinner
- Divider, Skeleton
- Unit tests, APCA validation

### Phase 3: Molecules
- SearchBar, Dropdown, DatePicker, TimePicker
- TabGroup, Breadcrumb, Alert, Card
- Tag, ProgressBar
- ChatBubble, ChatInput, ChatMessageList

### Phase 4: Organisms
- Header, Sidebar, Footer
- TradePanel, PortfolioCard, ChartContainer
- DataTable, Modal, Toast, CommandPalette
- ChatPanel, IntentBar

### Phase 5: Templates & Registry
- DashboardLayout, TradeLayout, SettingsLayout
- AuthLayout, EmptyState
- Layout primitives
- Component Registry for GenUI

### Phase 6: Documentation
- Storybook setup
- Component documentation
- Accessibility audit
- Update skills and docs

## Files to Create

### Structure
- `frontend/package.json` - Workspace root
- `frontend/pnpm-workspace.yaml` - pnpm config
- `frontend/tsconfig.json` - Base TypeScript config
- `frontend/packages/ui/package.json` - UI package
- `frontend/packages/ui/tsconfig.json` - UI TypeScript config

### Tokens
- `frontend/packages/ui/src/tokens/colors.css` - Color tokens
- `frontend/packages/ui/src/tokens/typography.css` - Typography tokens
- `frontend/packages/ui/src/tokens/spacing.css` - Spacing tokens
- `frontend/packages/ui/src/tokens/shadows.css` - Shadow tokens
- `frontend/packages/ui/src/tokens/motion.css` - Motion tokens
- `frontend/packages/ui/src/tokens/spatial.css` - Z-axis tokens
- `frontend/packages/ui/src/tokens/themes.css` - Theme tokens
- `frontend/packages/ui/src/tokens/index.css` - Token exports
- `frontend/packages/ui/src/tokens/index.ts` - TypeScript exports

### Signal Bus
- `frontend/packages/ui/src/signal-bus/index.ts` - Signal Bus implementation

### Registry
- `frontend/packages/ui/src/registry/types.ts` - Registry types
- `frontend/packages/ui/src/registry/index.ts` - Component registry

### Atoms
- `frontend/packages/ui/src/atoms/Button/` - Button component
- `frontend/packages/ui/src/atoms/Input/` - Input component
- `frontend/packages/ui/src/atoms/Select/` - Select component
- `frontend/packages/ui/src/atoms/Checkbox/` - Checkbox component
- `frontend/packages/ui/src/atoms/Toggle/` - Toggle component
- `frontend/packages/ui/src/atoms/Badge/` - Badge component
- `frontend/packages/ui/src/atoms/Avatar/` - Avatar component
- `frontend/packages/ui/src/atoms/Icon/` - Icon component
- `frontend/packages/ui/src/atoms/Tooltip/` - Tooltip component
- `frontend/packages/ui/src/atoms/Spinner/` - Spinner component
- `frontend/packages/ui/src/atoms/Divider/` - Divider component
- `frontend/packages/ui/src/atoms/Skeleton/` - Skeleton component

### Molecules
- `frontend/packages/ui/src/molecules/SearchBar/`
- `frontend/packages/ui/src/molecules/Dropdown/`
- `frontend/packages/ui/src/molecules/DatePicker/`
- `frontend/packages/ui/src/molecules/TimePicker/`
- `frontend/packages/ui/src/molecules/TabGroup/`
- `frontend/packages/ui/src/molecules/Breadcrumb/`
- `frontend/packages/ui/src/molecules/Alert/`
- `frontend/packages/ui/src/molecules/Card/`
- `frontend/packages/ui/src/molecules/Tag/`
- `frontend/packages/ui/src/molecules/ProgressBar/`
- `frontend/packages/ui/src/molecules/ChatBubble/`
- `frontend/packages/ui/src/molecules/ChatInput/`
- `frontend/packages/ui/src/molecules/ChatMessageList/`

### Organisms
- `frontend/packages/ui/src/organisms/Header/`
- `frontend/packages/ui/src/organisms/Sidebar/`
- `frontend/packages/ui/src/organisms/Footer/`
- `frontend/packages/ui/src/organisms/TradePanel/`
- `frontend/packages/ui/src/organisms/PortfolioCard/`
- `frontend/packages/ui/src/organisms/ChartContainer/`
- `frontend/packages/ui/src/organisms/DataTable/`
- `frontend/packages/ui/src/organisms/Modal/`
- `frontend/packages/ui/src/organisms/Toast/`
- `frontend/packages/ui/src/organisms/CommandPalette/`
- `frontend/packages/ui/src/organisms/ChatPanel/`
- `frontend/packages/ui/src/organisms/IntentBar/`

### Templates
- `frontend/packages/ui/src/templates/DashboardLayout/`
- `frontend/packages/ui/src/templates/TradeLayout/`
- `frontend/packages/ui/src/templates/SettingsLayout/`
- `frontend/packages/ui/src/templates/AuthLayout/`
- `frontend/packages/ui/src/templates/EmptyState/`

### Primitives
- `frontend/packages/ui/src/primitives/Box/`
- `frontend/packages/ui/src/primitives/Stack/`
- `frontend/packages/ui/src/primitives/Grid/`
- `frontend/packages/ui/src/primitives/Flex/`
- `frontend/packages/ui/src/primitives/Container/`

### Hooks
- `frontend/packages/ui/src/hooks/useSignal.ts`
- `frontend/packages/ui/src/hooks/useTheme.ts`
- `frontend/packages/ui/src/hooks/useDebounce.ts`
- `frontend/packages/ui/src/hooks/useKeyboardShortcut.ts`

### Utils
- `frontend/packages/ui/src/utils/apca.ts`
- `frontend/packages/ui/src/utils/cn.ts` (classnames)
- `frontend/packages/ui/src/utils/focus.ts`

## Related Documents

- `docs/08_UI_UX_Design_Standards_2026.md` - Design standards reference
- `.agent/skills/designing-frontend-interfaces/SKILL.md` - Component skill
- `.agent/skills/designing-frontend-interfaces/resources/DESIGN_TOKENS.md` - Token reference
