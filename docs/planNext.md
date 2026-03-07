🔹 Priority 1: Implement the Core Agent Debate & Proposal Flow
Bring the swarm to life.

Finalize the ADK Trading Workflow: Implement the Go code that orchestrates the GenerateTradeProposal flow. Route data from the FMP/Polygon MCPs to the Analysis Agents, synthesize via the Portfolio Manager, and output a structured JSON proposal.
Persist Proposals: Ensure the Go backend correctly writes these AI-generated proposals to the trade_proposals table with the PENDING status, recording the full Chain-of-Thought (CoT) and confidence score.
🔹 Priority 2: Develop the Action Plane (HITL) Dashboard
Empower the user.

Frontend Proposal Inbox: Build the React UI component that polls or subscribes (via WebSocket/SSE) to PENDING proposals.
Approval/Rejection Logic: Implement the backend REST/GraphQL endpoints to handle human approval.
Execution: Wire the approved proposal trigger to the alpaca-broker MCP for actual trade execution.
🔹 Priority 3: RAG & Semantic Intelligence Polish
Deepen the agents' context.

SEC Filings Pipeline: Ensure the pipeline that ingests 10-K/10-Q reports, chunks them, and stores them in fundamental_data via pgvector-server is fully operational.
RAG Agent Integration: Guarantee that the RAG Agent correctly queries the pgvector-server MCP before fundamental analysis begins.
🔹 Priority 4: Generative UI (GenUI) Integration
Deliver the 2026 UX standard.

CopilotKit Integration: Connect the React frontend's natural language input directly to the Genkit flows.
Dynamic Rendering: Allow the LLM to stream React components (e.g., custom charts, risk visualizations) back to the user based on the context of the conversation.