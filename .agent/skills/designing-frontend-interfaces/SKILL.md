---
name: designing-frontend-interfaces
description: Designs and implements highly aesthetic, modern, and functional web interfaces following the OmniTrade 2026 UI/UX standards. Use when the user requests UI/UX design, component creation, or frontend styling for the OmniTrade platform.
---

# Designing Frontend Interfaces

This skill enables the agent to create cutting-edge interfaces based on the **2026 UI/UX Design Standards**, focusing on Generative UI (GenUI), Spatial Volumes, Photon Physics, and Neuro-Adaptive systems.

## When to use this skill
- When creating new UI components or pages.
- When the user mentions "GenUI", "Spatial Volumes", "Photon Physics", or "Liquid Glass".
- When refactoring existing UI to meet 2026 standards.
- When optimizing for accessibility using APCA standards.
- When implementing neuro-adaptive or cognitive load features.
- When building agentic UX patterns for AI interactions.
- When implementing **Atomic Generative Modules (AGM)** or **Micro-Modules**.
- When configuring **Adaptive Responsiveness** for focal or device-aware UI.
- When setting up the **Event-Driven Signal Bus** for inter-module communication.

## Workflow

The agent should follow this checklist when designing or implementing UI:

- [ ] **Define Intent**: Identify the core user intent for the interface.
- [ ] **Scaffold Volume**: Create the initial "Intent Bar" or "Functional Volume" container.
- [ ] **Architect Modules**: Decompose UI into **Micro-Modules** and **Macro-Volumes** (AGM).
- [ ] **Implement Signal Bus**: Configure the high-frequency event bus for decoupled module communication.
- [ ] **Apply Photon Physics**: Implement ray-traced shadows, blurs, and refractive indices via CSS/WebGL.
- [ ] **Set Spatial Hierarchy**: Position elements on the Z-axis (measured in virtual millimeters).
- [ ] **Configure Focal Scaling**: Implement foveated focus adaptation for gaze-aware fidelity.
- [ ] **Validate Contrast**: Ensure all text and functional elements meet APCA standards (Lc 75/60).
- [ ] **Implement Object Permanence**: Define "Home Coordinates" and transition paths for all volumes.
- [ ] **Apply Neuro-Adaptive Patterns**: Implement hesitation logic and cognitive load balancing.
- [ ] **Enable Spatial Handoff**: Configure "Spatial Continuity" for persistent volumes across devices.
- [ ] **Audit Sustainability**: Ensure "Sub-Pixel Culling" or energy-efficient rendering for non-critical elements.
- [ ] **Add Trust Indicators**: Badge AI-generated components with provenance markers.
- [ ] **Verify Performance**: Target INP < 40ms for "corporeal" feel.

## Instructions

### 1. Visual System (Photon Physics)
- **Refractive Indexing**: Use high `backdrop-filter: blur()` and `scale()` to simulate magnification.
- **Sub-Surface Scattering (SSS)**: Use `box-shadow` or `drop-shadow` with vibrant, translucent colors to simulate light bleeding through edges.
- **Ray-Traced Shadows**: Use multiple layered `box-shadow` values to create realistic, soft shadows that respond to virtual light sources.
- **Ambient Photon Alignment**: Adjust `backdrop-filter` and `specular` reflections based on ambient light sensor data.

### 2. Spatial Logic
- **Volume-Based Hierarchy**:
  - Level 0 (Base): `translateZ(0px)`
  - Level 1 (Interactive): `translateZ(10px)`
  - Level 2 (Modal/Alert): `translateZ(25px)`
  - Level 3 (Extreme/Focus): `translateZ(48px)`
- **Spring Physics**: Use `cubic-bezier(0.34, 1.56, 0.64, 1)` or custom spring functions for all motion (damping ratio ~0.7).
- **Object Permanence**: Every element has a "Home Coordinate" - dismissed volumes visually travel back to their origin.
- **Dimensional Fluidity**: UI volumes must support seamless "handoff" between mobile, spatial, and desktop surfaces while maintaining internal state.

### 3. Accessibility (APCA & WCAG 3.0)
- Never use the old 4.5:1 ratio.
- Use `apca-w3` or equivalent logic to verify contrast.
- **Primary Text**: Minimum Lightness Contrast (Lc) of 75.
- **Functional Elements**: Minimum Lc of 60.
- **Chromostereopsis Prevention**: Avoid high-saturation red and blue in close proximity.
- **Multi-Modal Parity**: Every visual transition needs spatial audio and haptic equivalents.

### 4. Neuro-Adaptive Interfaces
- **Foveated UI**: Simplify peripheral content while maintaining full fidelity at focal point.
- **Focal Scaling**: Expand interaction fidelity and detail density for foveated volumes.
- **Hesitation Logic**: If user idle > 5s during a flow, decompose task into simpler prompts.
- **Calm Mode**: Global toggle that strips all Physical Digitalism for neuro-diverse users.
- **Dyslexic-Adaptive Typography**: Variable-font system that adjusts letter-spacing and weight dynamically.
- **Motion Damping**: "Fixed Orthographic" view that eliminates perspective shifts and parallax.

### 5. Agentic UX (Agent-to-System Interfacing)
- **Machine-Readable Surfaces**: UI components must expose semantic metadata for autonomous agents.
- **Bidding Volumes**: Allow agents to negotiate transaction parameters on behalf of users.
- **Conflict Resolution Volumes**: Visual sandboxes where users adjudicate agent disagreements.
- **Macro-Volumes**: Orchestrate clusters of Micro-Modules (AGM) based on "Blueprint-First" AI assembly.
- **Signal Bus Integration**: Modules communicate via a global `EventTarget` or specialized high-frequency bus (IMC).

### 6. Performance Standards
- **INP Target**: < 40ms for "corporeal" feel (faster than biological reaction time).
- **Predictive Hydration**: Use Local-First CRDTs for optimistic UI updates.
- **Edge-Assembly**: Compute GenUI layout at network edge for device-specific optimization.

### 7. Sustainability & Trust
- **Sub-Pixel Culling**: Disable non-critical pixels in low-power states.
- **Eco-Fidelity Badge**: Display energy cost metadata for GenUI assemblies.
- **AI Provenance**: Mark AI-generated components with C2PA metadata and visual indicator (◆).

## Code Implementation

### Liquid Glass Refractive Volume
```css
.refractive-volume {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    inset 0 0 20px rgba(255, 255, 255, 0.05);
  transform: translateZ(10px);
  transition: transform var(--ot-spring-standard);
}
```

### Neuro-Adaptive Calm Mode
```css
.calm-mode .refractive-volume {
  backdrop-filter: none;
  background: var(--ot-calm-bg, #1a1a1a);
  border: 2px solid #ffffff;
  transform: none;
  transition: none;
}

.calm-mode * {
  animation: none !important;
  transition: none !important;
}
```

### AI Provenance Badge
```css
.ai-generated::after {
  content: '◆';
  font-size: 0.7em;
  margin-left: 0.25em;
  opacity: 0.6;
  filter: drop-shadow(0 0 4px currentColor);
}
```

### Hesitation Detection Hook
```typescript
// Detect user hesitation and decompose UI
const HESITATION_THRESHOLD_MS = 5000;

function setupHesitationDetection(element: HTMLElement, onHesitate: () => void) {
  let idleTimer: number;

  const resetTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(onHesitate, HESITATION_THRESHOLD_MS);
  };

  element.addEventListener('input', resetTimer);
  element.addEventListener('focus', resetTimer);
  element.addEventListener('blur', () => clearTimeout(idleTimer));

  resetTimer(); // Start timer on init
}
```

### Object Permanence Animation
```css
.volume-dismiss {
  animation: return-to-origin 0.4s var(--ot-spring-standard) forwards;
}

@keyframes return-to-origin {
  0% {
    transform: translateZ(25px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateZ(0px) scale(0.8);
    opacity: 0;
  }
}
```

### Event Signal Bus (IMC)
```typescript
// Shared high-frequency signal bus for AGM communication
const OtSignalBus = new EventTarget();

export const publishSignal = (topic: string, detail: any) => {
  OtSignalBus.dispatchEvent(new CustomEvent(topic, { detail }));
};

export const subscribeSignal = (topic: string, handler: (e: any) => void) => {
  OtSignalBus.addEventListener(topic, handler);
  return () => OtSignalBus.removeEventListener(topic, handler);
};
```

### Focal Scaling Implementation
```css
.focal-volume {
  --ot-focal-fidelity: 0.8; /* Base peripheral fidelity */
  filter: blur(calc(5px * (1 - var(--ot-focal-fidelity))));
  transition: filter 0.2s var(--ot-spring-standard);
}

.focal-volume:focus-within,
.focal-volume.is-foveated {
  --ot-focal-fidelity: 1;
}
```

## Resources
- [Design Tokens](resources/DESIGN_TOKENS.md) - Complete token reference
- [Intent Bar Example](examples/intent-bar.html) - Zero-state input component
- [Trading Card Volume](examples/trading-card.html) - Polymorphic component example
- [Conflict Resolution Volume](examples/conflict-resolution.html) - Agent diplomacy UI

## Quality Gates
Before completing any UI implementation:
- [ ] All text meets APCA Lc 75 minimum
- [ ] Interactive elements meet APCA Lc 60 minimum
- [ ] Spring physics applied to all motion (damping ~0.7)
- [ ] AI-generated content has provenance marker (◆)
- [ ] INP measured and < 40ms
- [ ] Calm mode tested for neuro-diverse accessibility
- [ ] Signal Bus connectivity verified (no direct module coupling)
- [ ] Focal Scaling responsiveness tested
- [ ] Spatial Continuity (handoff) metadata present
