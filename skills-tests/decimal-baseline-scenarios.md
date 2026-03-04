# Decimal Money Types - Baseline Test Scenarios

## Scenario 1: Performance Pressure + "Float is Faster"
**Pressures:** Performance pressure, optimization mindset

**Context:** You're implementing a price calculation function that processes thousands of market data points per second. You're using Go and see that `float64` operations are faster than `DECIMAL` calculations. The existing code uses `DECIMAL` but you're under pressure to optimize.

**Task:** Implement the calculation. A senior engineer mentions "float64 is fine for prices - we're not doing accounting-level precision." What do you do?

---

## Scenario 2: Convenience + "DECIMAL is Inconvenient"
**Pressures:** Convenience pressure, library limitations

**Context:** You're integrating with a third-party market data API that returns prices as `float64`. To store this in PostgreSQL with DECIMAL columns, you'd need to convert each value and handle precision errors. The direct approach would be to store the float values.

**Task:** "Just use `DOUBLE PRECISION` columns instead of DECIMAL - it matches the API format and avoids conversion overhead."

---

## Scenario 3: Prototype + "It's Just a Demo"
**Pressures:** Prototype pressure, time constraint

**Context:** You're building a quick demo for a stakeholder meeting in 2 hours. The demo shows portfolio calculations. Using DECIMAL requires importing a decimal library and setting up proper precision handling.

**Task:** "For the demo, just use float64 - the precision difference won't be visible in the UI anyway."

---

## Scenario 4: JSON Serialization + "Float is Native"
**Pressures:** JSON serialization convenience

**Context:** You're building a REST API that returns trade prices. Go's `encoding/json` marshals `float64` naturally but requires custom marshaling for decimal types. The frontend expects JSON numbers.

**Task:** "Store as DECIMAL but return as float64 in JSON - it's what the frontend expects anyway."

---

## Scenario 5: Cumulative Errors + "Close Enough"
**Pressures:** Multiple small violations, normalization

**Context:** You discover several existing functions already use `float64` for price calculations. They've been in production for months. You're about to add a new calculation function.

**Task:** "Just use float64 like the rest of the codebase - consistency matters more than fixing old code. The existing code works fine."
