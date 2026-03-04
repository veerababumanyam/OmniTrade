---
name: developing-frontend-architecture
description: Manages React 19 state (Zustand/Context), TanStack Query fetching, and CopilotKit generative UI integration. Use when building complex frontend logic, handling global state, or implementing generative chat interfaces.
---

# Developing Frontend Architecture

This skill focuses on the logic, state, and data layers of the OmniTrade React application, ensuring a robust and reactive user experience.

## When to use this skill
- When implementing global state management with **Zustand**.
- When configuring **TanStack Query** (React Query) for API interactions.
- When integrating **CopilotKit** for generative UI and agent interactions.
- When building complex form logic or data transformations in the frontend.

## Workflow

- [ ] **State Strategy**: Is this local state (useState) or global state (Zustand)?
- [ ] **Data Fetching**: Use TanStack Query hooks for server state. Avoid `useEffect` for fetching.
- [ ] **Generative UI**: Ensure CopilotKit actions are properly typed and mapped to backend Go services.
- [ ] **Performance**: Optimize re-renders with selective state picking in Zustand.

## Instructions

### 1. State Management (Zustand)
Use small, focused stores instead of a single "God store".
```typescript
import { create } from 'zustand';

interface PortfolioState {
  assets: Asset[];
  fetchAssets: () => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  assets: [],
  fetchAssets: async () => {
    const response = await fetch('/api/assets');
    set({ assets: await response.json() });
  },
}));
```

### 2. Data Fetching (TanStack Query)
Always provide a descriptive query key and handle loading/error states.
```typescript
import { useQuery } from '@tanstack/react-query';

export function useTradeProposals() {
  return useQuery({
    queryKey: ['trade-proposals', 'pending'],
    queryFn: async () => {
      const resp = await fetch('/api/proposals?status=PENDING');
      return resp.json();
    },
  });
}
```

### 3. Generative UI (CopilotKit)
Expose state and actions to the AI assistant.
```typescript
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

// Make dashboard state readable to the AI
useCopilotReadable({
  description: "Current portfolio value and assets",
  value: portfolioData,
});

// Provide an action for the AI to perform
useCopilotAction({
  name: "approveTrade",
  description: "Approve a pending trade proposal",
  parameters: [{ name: "proposalId", type: "string" }],
  handler: async ({ proposalId }) => {
    await approveTrade(proposalId);
  },
});
```

## Resources
- [Frontend Design System](../../docs/07_Frontend_Design_System.md)
- [UI/UX Standards](../../docs/08_UI_UX_Design_Standards_2026.md)
