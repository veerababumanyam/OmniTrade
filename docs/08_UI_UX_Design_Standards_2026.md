# 2026 UI/UX Design Standards for LLM Implementation

This document establishes the authoritative UI/UX standards for OmniTrade, specifically structured for 2026 LLM implementations, iOS 26 Design Language, and WCAG 3.0 "Gold" compliance.

---

## 1. Visual Design System: "Liquid Glass" (iOS 26 HIG Compliant)

The "Liquid Glass" system moves beyond static transparency to a dynamic, physics-based material model.

### 1.1 Material Definition
- **Refraction & Reflection**: Implement a material that reflects and refracts underlying content in real-time.
- **Lensing Effect**: UI containers must simulate light bending (optical refraction) through the glass layer.
- **Dynamic Specularity**: Surfaces must exhibit specular highlights that shift based on device movement (parallax interaction).

### 1.2 Layering & Depth
- **Z-Axis Hierarchy**: Establish depth using multiple layers of liquid glass. 
- **Refraction Indices**: Foreground elements (modals, floating buttons) must have higher refraction indices than background layers.
- **Bento Grid Layouts**: Content must be organized into distinct, rounded modular containers ("Bento Box" style) that float independently on the glass layer.

### 1.3 Adaptive Appearance
- **Contextual Tinting**: Material must automatically switch between "Clear" (high transparency), "Tinted" (color-infused), and "Opaque" based on background complexity.
- **Variable Blur**: Apply dynamic Gaussian blur. Increase blur intensity automatically when text contrast drops below **4.5:1**.

---

## 2. Responsive & Adaptive Architecture

### 2.1 Container Queries
- **Constraint**: Replace all viewport-based media queries with CSS Container Queries (`@container`).
- **Behavior**: Components (e.g., Trade Cards) must adapt internal layouts based strictly on their parent container's dimensions.

### 2.2 Spatial & Foldable Support
- **Spatial Detachment**: Grid containers must be capable of "detaching" into 3D space for spatial computing environments (visionOS bridge).
- **Hinge Awareness**: On foldable devices, interactive elements must never be placed across the physical hinge area.
- **Input Modality**: Automatically detect input type (touch, mouse, gaze) and adjust hit targets instantly (minimum **44x44pt** for touch).

---

## 3. Accessibility (WCAG 3.0 "Gold" Standards)

### 3.1 Outcome-Based Compliance
- Move focus from checklists to user task completion rates.
- Assign "Functional Scores" to critical flows (e.g., Signal Approval, Portfolio Sync).

### 3.2 Theme & Contrast Logic
- **Advanced Dark Mode**: Use `#121212` mixed with primary brand colors instead of pure `#000000` to prevent OLED smearing.
- **APCA Algorithm**: Use the **Advanced Perceptual Contrast Algorithm (APCA)** to ensure perceived lightness matches human visual perception.

### 3.3 Neurodiversity Controls
- **"Calm Mode" Toggle**: A global control to disable all refraction and parallax effects to prevent cognitive overload or motion sickness.
- **Text Simplification**: AI-driven option to dynamically simplify complex financial text on-device for improved cognitive accessibility.

---

## 4. Engineering & Delivery

### 4.1 Feature Management
- **Edge-Based Flagging**: Resolve feature toggles at the CDN edge to eliminate Layout Shift (CLS) during page load.
- **Canary UI**: Progressive rollout of visual shaders (1% -> 5% -> 100%) monitored by hardware performance metrics.

### 4.2 Performance Mandates
- **INP (Interaction to Next Paint)**: Must remain under **200ms**. Visual effects must yield to the main thread upon user input.
- **GPU Acceleration**: Offload `backdrop-filter` and blur effects to the GPU. Use `will-change` only on active animating elements.
- **Streaming Hydration**: Use HTML streaming (e.g., React Server Components) to render the "Glass Shell" immediately while data hydrates asynchronously.

---

## 5. Progressive Enhancement

### 5.1 Graceful Degradation
- **Fallback Mode**: If hardware cannot support real-time refraction (or is in Low Power Mode), degrade to a solid "Frosted Opaque" state.
- **No-JS Path**: Core navigation and data readability must remain functional even if the JavaScript bundle for advanced effects fails to load.
