---
name: performing-fundamental-analysis
description: Logic for interpreting valuation drivers, growth rates, and forward guidance from financial reports. Use when the user mentions fundamental data, earnings calls, or SEC filings.
---

# Performing Fundamental Analysis

This skill defines the analytical framework for the `Fundamental Analyst` agent, focusing on extracting qualitative and quantitative value drivers from financial text.

## When to use this skill
- When interpreting SEC filings (10-K, 10-Q) for valuation metrics.
- When summarizing earnings call transcripts to identify forward guidance.
- When calculating growth rates, margins, or relative value (P/E, P/S).
- When resolving conflicts in reported financial data.

## Workflow

- [ ] **Context Selection**: Retrieve relevant chunks from the `fundamental_data` vector DB.
- [ ] **Metric Extraction**: Identify Revenue, EBIDTA, Net Income, and Cash Flow trends.
- [ ] **Guidance Parsing**: Look for keywords like "expect", "anticipate", "guidance", "headwinds".
- [ ] **Moat Assessment**: Evaluate competitive positioning and R&D efficiency.

## Instructions

### 1. Valuation Drivers
Focus on the "Why" behind the numbers.
- **Top-line Growth**: Is revenue growth driven by volume or price?
- **Margin Expansion**: Are operational efficiencies improving?
- **Capital Allocation**: How is management using cash (Buybacks, Dividends, R&D)?

### 2. Guidance Interpretation
| Tone | Interpretation | Action |
|------|----------------|--------|
| Positive | Beat/Raise | Weight signal toward BUY. |
| Mixed | Conservative | Look for sector-wide headwinds. |
| Negative | Warning | Weight signal toward SELL/HOLD. |

### 3. Output Requirements
All fundamental reports must include:
- **Core Metrics**: (Revenue Growth, EPS, Debt/Equity).
- **Sentiment Score**: (-1.0 to 1.0).
- **Cited Sources**: Precise references to document IDs.

## Resources
- [Agent Intelligence System](../../docs/02_Agent_Intelligence_System.md)
- [RAG Intelligence Pipeline](../implementing-rag-intelligence/SKILL.md)
