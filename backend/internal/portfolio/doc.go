// Package portfolio provides portfolio management services for OmniTrade.
//
// This package handles all portfolio-related operations including:
//   - Portfolio retrieval and management
//   - Position tracking and updates
//   - Performance calculations and snapshots
//   - Trade execution and position reconciliation
//
// The service uses separate database connections:
//   - Read DB: Uses omnitrade_readonly role for querying portfolio data
//   - Write DB: Uses omnitrade_write role for updating positions after trades
//
// All monetary values use DECIMAL types for precision in financial calculations.
// This is critical for accurate P&L calculations and position tracking.
//
// Key Methods:
//   - GetPortfolio: Retrieve portfolio summary by ID
//   - GetPositions: Get all positions for a portfolio
//   - GetPerformance: Calculate performance metrics over time
//   - UpdatePositionAfterTrade: Reconcile positions after trade execution
//
// Security Note:
// AI agents should use the read-only connection for analysis.
// Only the Action Plane (HITL) should trigger position updates via the write connection.
package portfolio
