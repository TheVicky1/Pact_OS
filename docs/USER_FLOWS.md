# PACT — Core User Flows & Lifecycle Specification

## 1. Fundamental Conceptual Model [CONFIRMED]

The core domain architecture follows a strict hierarchical and relational flow:

```
User
  ↓
Goals (Intentional targets)
  ↓
Projects (Grouped initiatives)
  ↓
Commitments / Tasks (Actionable execution items)
  ↓
Completion / Progress (Authoritative timestamped state)
  ↓
Analytics / Accountability (Metrics & conditional consequence activation)
```

---

## 2. Core User Journey Flows [CONFIRMED]

### Flow 1: Goal & Project Creation
1. User defines a high-level **Goal** (e.g., "Master System Design & Algorithms").
2. User attaches one or more **Projects** to the Goal (e.g., "LeetCode 75 Study Plan").
3. User breaks down the Project into individual **Tasks / Commitments** with deadlines and priority.

### Flow 2: Daily Planning & Execution
1. User accesses the **Planner** at the beginning of the day (in their configured local timezone).
2. User schedules commitment items into specific time-blocks.
3. User executes tasks throughout the day, marking them complete upon finish.
4. Trusted server logic records the completion timestamp (`completed_at`) and verifies against deadline conditions.

### Flow 3: Personal Expense Logging
1. User logs an expense: enters `amount`, `description`, and selects/confirms a `category`.
2. Expense date defaults to current date in the user's local timezone.
3. System suggests a category based on description (e.g., "Uber" → *Transportation*).
4. User confirms or overrides the suggested category.
5. Strict data boundary ensures financial data is accessible only by the owning user.

---

## 3. Accountability & Consequence Lifecycle [CONFIRMED]

PACT introduces a dedicated accountability system with strict visual and data privacy boundaries:

### Visual Principle: Hidden During Normal Success
Under normal successful operation, consequence and punishment UI elements **remain entirely hidden**. A user maintaining their commitments experiences a calm, productive, non-threatening dashboard.

### Lifecycle State Machine

```
[Normal State]
Task Created → Scheduled → Executed Before Deadline → Completed (Done)

[Missed State Flow]
Task Created → Scheduled → Deadline Passes without Valid Completion
                                  ↓
                  Server Evaluates Deadline Breach (Atomic)
                                  ↓
                  Commitment Status Marked as "MISSED"
                                  ↓
           Consequence Activated & Eligible for Display
                                  ↓
                   Accountability UI Revealed to User
```

---

## 4. Consequence Confidentiality (Data Security Boundary) [CONFIRMED]

> [!CAUTION]
> **CRITICAL SECURITY REQUIREMENT**: Consequence confidentiality is a **DATA SECURITY** problem, NOT a frontend UI rendering choice.

### Insecure Anti-Pattern (PROHIBITED)
❌ Server returns task objects containing sensitive consequence data, and the client-side JavaScript simply uses an `if (isMissed)` check to choose whether or not to render the consequence panel. A malicious client could open Browser DevTools or query the API directly to inspect hidden consequences.

### Secure Architectural Pattern (REQUIRED)
✅ Sensitive consequence payload data must **NEVER** be returned over the network API until the server has authoritatively evaluated that the deadline has passed and the commitment is officially in a `MISSED` state.
- Database Row Level Security (RLS) or dedicated security-definer RPC functions filter out consequence payload fields while in normal state.
- Lifecycle state transitions are strictly governed on the server side.
