# OmniTrade 2026 Design Tokens

These tokens are used to implement the **Photon Physics**, **Spatial Volumes**, **Neuro-Adaptive**, and **Sustainability** features of the OmniTrade 2026 UI.

## Color Tokens (High Saturation, APCA Optimized)

| Token | Value | Usage |
|-------|-------|-------|
| `--ot-bg-gradient` | `linear-gradient(135deg, hsl(230, 20%, 5%), hsl(230, 15%, 8%))` | App background |
| `--ot-intent-bar-bg` | `rgba(255, 255, 255, 0.04)` | Intent bar container |
| `--ot-primary-text` | `hsl(0, 0%, 98%)` | Body text (Lc 75+) |
| `--ot-secondary-text` | `hsl(230, 10%, 75%)` | Muted text (Lc 60+) |
| `--ot-brand-blue` | `hsl(210, 100%, 55%)` | Primary accent |
| `--ot-brand-green` | `hsl(140, 70%, 50%)` | Success / buy |
| `--ot-brand-red` | `hsl(350, 75%, 55%)` | Error / sell |
| `--ot-brand-purple` | `hsl(270, 60%, 60%)` | AI/agent indicator |

## Spatial Tokens (Z-Axis in Virtual Millimeters)

| Token | Value | Usage |
|-------|-------|-------|
| `--z-flat` | `0px` | Base layer |
| `--z-step-1` | `4px` | Slight elevation |
| `--z-step-2` | `12px` | Interactive elements |
| `--z-step-3` | `24px` | Modals / alerts |
| `--z-step-extreme` | `48px` | Critical focus |

## Photon Physics (Refractive Index & Blur)

| Token | Value | Usage |
|-------|-------|-------|
| `--ot-refractive-index-high` | `1.458` | Magnification scale `1.05` |
| `--ot-refractive-index-low` | `1.333` | Magnification scale `1.02` |
| `--ot-blur-subtle` | `8px` | Soft blur |
| `--ot-blur-standard` | `24px` | Standard glass effect |
| `--ot-blur-extreme` | `60px` | Heavy frosted glass |
| `--ot-saturate-standard` | `180%` | Standard saturation boost |

## Transition Physics (Spring-Damped)

| Token | Value | Damping |
|-------|-------|---------|
| `--ot-spring-standard` | `0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` | 0.7 |
| `--ot-spring-snappy` | `0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)` | 0.8 |
| `--ot-spring-gentle` | `0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)` | 0.5 |

## Neuro-Adaptive Tokens

### Calm Mode (Neuro-Diverse Accommodation)
| Token | Value | Usage |
|-------|-------|-------|
| `--ot-calm-bg` | `#1a1a1a` | High contrast dark |
| `--ot-calm-text` | `#ffffff` | Pure white text |
| `--ot-calm-border` | `2px solid #ffffff` | Clear borders |
| `--ot-calm-transition` | `none` | No motion |

### Dyslexic-Adaptive Typography
| Token | Value | Usage |
|-------|-------|-------|
| `--ot-dyslexic-spacing` | `0.12em` | Enhanced letter-spacing |
| `--ot-dyslexic-weight` | `450` | Medium weight for clarity |
| `--ot-dyslexic-line-height` | `1.8` | Generous line spacing |

### Cognitive Load Indicators
| Token | Value | Usage |
|-------|-------|-------|
| `--ot-hesitation-threshold` | `5000ms` | Idle time before UI simplification |
| `--ot-foveated-blur` | `2px` | Peripheral content blur |
| `--ot-foveated-opacity` | `0.7` | Peripheral content opacity |

## Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| `--ot-inp-target` | `40ms` | Interaction to Next Paint |
| `--ot-fcp-target` | `1.8s` | First Contentful Paint |
| `--ot-lcp-target` | `2.5s` | Largest Contentful Paint |
| `--ot-cls-target` | `0.1` | Cumulative Layout Shift |

## Sustainability Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ot-eco-fidelity-badge` | `data-energy-cost` | Attribute for energy metadata |
| `--ot-subpixel-cull-opacity` | `0.0` | Hide non-critical sub-pixels |
| `--ot-low-power-blur` | `none` | Disable blur in low power |
| `--ot-low-power-animation` | `none` | Disable animation in low power |

## Trust & Transparency Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ot-ai-marker` | `'◆'` | AI provenance indicator |
| `--ot-ai-marker-size` | `0.7em` | Indicator size |
| `--ot-ai-marker-glow` | `0 0 4px currentColor` | Glow effect |
| `--ot-transparency-shield-opacity` | `0.9` | Privacy overlay |

## Semantic Metadata Attributes

These data attributes enable machine-readable surfaces for agentic UX:

```html
data-agent-readable="true"
data-transaction-type="bid|ask|negotiate"
data-confidence="0.0-1.0"
data-energy-cost="joules"
data-ai-generated="true"
```

## APCA Verification

Always verify using `apca-w3` or equivalent logic before shipping:
- **Primary Text**: Minimum Lc 75
- **Functional Elements**: Minimum Lc 60
- **Large Text (>24px)**: Minimum Lc 45

## Usage Example

```css
.trading-card {
  /* Colors */
  background: var(--ot-intent-bar-bg);
  color: var(--ot-primary-text);

  /* Photon Physics */
  backdrop-filter: blur(var(--ot-blur-standard)) saturate(var(--ot-saturate-standard));

  /* Spatial */
  transform: translateZ(var(--z-step-2));

  /* Motion */
  transition: transform var(--ot-spring-standard);
}

/* Low power mode */
@media (prefers-reduced-motion: reduce) {
  .trading-card {
    backdrop-filter: var(--ot-low-power-blur);
    transition: var(--ot-low-power-animation);
  }
}
```
