# Agent Optimus CRM - AI Engine Architecture (v3.0 - The Final Design)

This document outlines the final, working architecture of the `agent_engine`. This design is a resilient, stateful, multi-agent system built on a pragmatic and robust foundation that has been battle-tested to solve previous failures.

## Core Architectural Pattern: Manual State Engine with Specialist Graphs

The engine maintains the hierarchical structure of a **Master Supervisor** delegating to two **Specialist Teams**. However, the core of the engine has been redesigned to be a simple, transparent, and direct state machine that is guaranteed to work.

### Core Concepts

**1. Master Supervisor (`index.js` - The State Engine):**
*   **Role:** The undisputed master of state. This is the brain of the entire operation.
*   **Function:** Its role is no longer just to dispatch. It is a full **State Engine**. On every incoming message, it performs the critical **"Build-and-Invoke"** cycle:
    1.  **Build Conversation:** It fetches ALL messages for the lead from Supabase and **sorts them chronologically** to build a perfect `conversationHistory`. This solves the "bucket of messages" failure.
    2.  **Build State:** It fetches the LATEST clean lead record (`crmData`) and the agent's private memory (`agent_state`) from the database.
    3.  **Prevent Corruption:** It intelligently merges these components to create the final `currentState` for the agent's turn, ensuring that the `crmData` can never be recursively written into itself. This solves the "Russian Doll" data corruption failure.
    4.  **Invoke:** It calls the correct specialist graph.
    5.  **Save:** It receives the final state from the graph and saves the cleaned `agent_state` back to the database.

**2. Specialist Teams (`inbound_team/` & `outbound_team/`):**
*   Each team has its own `graph.js` file, containing a unique graph structure reflecting its mission. This is a return to a simple, clear architecture.
*   **The Inbound Team ("The Qualifier"):** A patient loop focused on executing the `INBOUND_PLAYBOOK`.
*   **The Outbound Team ("The Closer"):** A conversion funnel with a fast-track to the `booking_coordinator`.

**3. Short-Term Memory: Manual Persistence (The Working Solution)**
*   The LangGraph Checkpointer design is **abandoned**. It was the source of numerous library import and dependency failures.
*   **The New Design:** The `agent_state` JSON column in the `leads` table is the **single source of truth for the agent's memory.** The load and save logic is now managed manually and transparently by the `index.js` State Engine. It is simple, debuggable, and it works.

**4. Long-Term Memory (Profile & Knowledge):**
*   This design is unchanged and correct. Profile facts are saved to the `leads` table, and domain knowledge comes from the RAG system.

**5. The Intelligent Supervisor & Infinite Loop Fix:**
*   **Memory Injection:** The `supervisor` in each team now correctly uses the `crmData` and `conversationHistory` to make intelligent decisions. Its first action is always to check its memory against the playbook goal before looking at the user's intent.
*   **Intent Consumption:** The infinite `GraphRecursionError` is solved. The `crmOperator` node now consumes the `intelBriefing` after it has been acted upon, preventing the supervisor from making the same decision in an endless loop.

---

## The Final File Structure

This is the correct, simplified, and working file structure. The failed central `graph.js` factory is gone.