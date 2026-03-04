# Panic-Free Go Error Handling - Baseline Test Scenarios

## Scenario 1: "This Should Never Happen" + Convenience
**Pressures:** False sense of safety, convenience

**Context:** You're writing a function that queries the database for a stock symbol. The symbol comes from an enum, so you're certain it will always be valid. If it somehow isn't, that's a programmer error and the program should crash anyway.

**Task:** Implement the lookup. What do you do when the symbol isn't found?

---

## Scenario 2: Complex Error Path + Time Pressure
**Pressures:** Complexity, time pressure, error wrapping fatigue

**Context:** You're implementing a multi-step operation: fetch from cache → parse JSON → validate → return result. Each step can fail. Properly wrapping and returning errors through 4-5 layers feels exhausting. A single panic() would terminate cleanly.

**Task:** "Just panic() at the first error - the caller can recover if needed. It's cleaner than 10 levels of error returns."

---

## Scenario 3: Third-Party Library + "They Panic, So Can I"
**Pressures:** Normalization, consistency

**Context:** You're integrating with a popular third-party library that uses panic() for error conditions in several functions. Your code is calling these functions in multiple places.

**Task:** "The library already panics, so my code panicking is consistent with their API. Why add extra error handling when the library doesn't?"

---

## Scenario 4: Constructor Logic + "Invalid State Is Fatal"
**Pressures:** Initialization logic, "invalid program state"

**Context:** You're writing a constructor for a trade processor that requires a valid database connection and configuration. If either is nil/invalid, the object can't function.

**Task:** "Just panic() in the constructor - if we can't initialize, there's no point continuing. Fail fast."

---

## Scenario 5: Test Code + "It's Only Tests"
**Pressures:** Test environment, minimization

**Context:** You're writing unit tests and need to set up test fixtures. Creating test data involves several steps that could fail. The tests are simpler if you just panic() on setup failures.

**Task:** "It's just test code - if setup fails, the test should fail anyway. panic() makes test failures obvious."
