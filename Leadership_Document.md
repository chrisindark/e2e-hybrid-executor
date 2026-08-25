# Engineering Manager, AI — Leadership Document

To: Founding Team
From: Engineering Manager Candidate
Date: [Current Date]

## 1. What's Actually Broken in the Inherited v0

The v0 hybrid execution system exhibits three primary escalations: occasional slowness (5–10x longer) in fallback mode, silent test passes that should have failed, and difficulty debugging agent decisions. Based on my experience building the prototype, these are symptoms of systemic architectural and observability gaps rather than isolated bugs.

**Diagnosis & Week One Signals:**
*   **Occasional Slowness:** This is likely an **architectural** issue rooted in how context is passed to the LLM. If the system passes full, unfiltered DOM snapshots to Gemini (or another LLM) upon failure, context limits and processing times will spike. I would look at telemetry for LLM token usage, request latency, and the number of recovery attempts per fallback loop. If token counts are massive, we have a DOM pruning problem.
*   **Silent Test Passes:** This is a **quality and evaluation** problem. The agent is likely hallucinating success criteria or the prompt lacks strict negative constraints. In week one, I would look at the success validation prompts and the promotion rejection rate. A signal of this diagnosis is if the agent relies on visual cues without validating underlying application state changes (e.g., clicking a disabled button but the UI doesn't visually reflect the error). I would refuse to conclude the model itself is "too dumb" without evidence that we are giving it unambiguous success heuristics.
*   **Hard to Debug:** This is an **observability** problem. The trace UI likely lacks structured output from the agent's Chain-of-Thought (CoT). In the prototype, capturing the exact reasoning ("why") alongside the action ("what") was critical. I would look at the database schema for execution traces—if we are only storing the resulting selector and not the intermediate reasoning steps, we cannot explain the "why."

## 2. Your 90-Day Plan

Our goal is to transform the v0 from a fragile proof-of-concept into a trusted, enterprise-grade hybrid execution engine.

**Days 1–30: Observability & Trust (The "No More Black Boxes" Phase)**
*   **Goal 1:** Implement structured decision tracing. Every agentic action must log its context, reasoning, and chosen action into the `trace` database tables.
*   **Goal 2:** Establish baseline metrics dashboards for fallback latency, promotion acceptance rates, and agent crash rates. 
*   **Goal 3:** Ship a customer-facing "Decision Trace" UI that exposes the agent's reasoning in plain English.

**Days 30–60: Quality & Accuracy (The "Stop Silent Passes" Phase)**
*   **Goal 1:** Implement strict semantic state validation. Agentic fallbacks must now satisfy a secondary deterministic check (e.g., "URL changed to /checkout" or "Element X is present") before declaring a step "passed."
*   **Goal 2:** Build a golden dataset of 50 common UI drift scenarios across diverse DOMs to use for automated shadow evaluation of our prompts.
*   **Goal 3:** Reduce the silent pass rate by 50% by enforcing negative constraints in the agent's system prompt.

**Days 60–90: Latency & Performance (The "Speed" Phase)**
*   **Goal 1:** Optimize DOM context pruning. Implement an algorithm to strip non-interactive elements, SVGs, and massive stylesheets before sending context to the LLM, aiming for a 40% reduction in token usage.
*   **Goal 2:** Introduce localized LLM caching or semantic similarity matching for known fallback patterns to bypass full LLM inference when possible.
*   **Goal 3:** Reduce the P90 latency of fallback mode to under 15 seconds.

**What we explicitly won't fix:** 
We will not rewrite the core Playwright execution loop or migrate away from our current primary LLM provider (Gemini/Groq) during this window. Re-platforming the deterministic engine would distract from the immediate existential threat: lack of trust in the agentic layer. We must stabilize the hybrid logic first.

## 3. SLOs for Execution Modes

**Deterministic Mode**
*   **Latency:** P99 < 1.5 seconds per step.
*   **Reliability:** 99.9% (Browser and network stability).
*   **Accuracy:** 100%. (By definition, it either strictly matches the selector and assertion, or it fails. There is no ambiguity).

**Deterministic-with-AI-Fallback**
*   **Latency:** P90 < 15 seconds per step. (Fallback requires DOM extraction, LLM inference, and action execution. It must be bounded so pipelines don't stall).
*   **Reliability:** 99% of fallback attempts complete without an unhandled system exception.
*   **Accuracy:** 95%. 
    *   *How we measure accuracy:* Accuracy in a non-deterministic executor is defined as "Intent Satisfied." We measure this via two signals: (1) **Promotion Acceptance Rate**—if a human approves the agent's proposed deterministic update, the agent's decision was accurate. (2) **Shadow Evaluation**—we run historical traces through an evaluator LLM to verify if the agent's final state matches the expected state.

**Agentic-Primary Mode**
*   **Latency:** P90 < 10 seconds per step. (Slightly faster than fallback, as there is no initial deterministic failure timeout).
*   **Reliability:** 99%.
*   **Accuracy:** 90%. Measured primarily by final test outcome equivalence to the deterministic test suite on known-good branches.

## 4. The Customer-Facing Story

Trust evaporates when a system acts like a black box. When our agent makes a non-obvious decision mid-run, the customer must immediately see the "why." 

In the product, a test run report visually differentiates deterministic steps (green, solid icon) from agent-recovered steps (orange, magic wand icon). When a customer clicks on a recovered step, they see the **Decision Trace UI**. 
*   **The Context:** "Original selector `.checkout-button` was not found on the page."
*   **The Agent's Reasoning:** "I scanned the interactive elements. The original intent was to proceed to checkout. I found a new button with the text 'Checkout Now' matching the ID `#btn-primary-checkout`."
*   **The Action:** "Clicked `#btn-primary-checkout`."
*   **The Proof:** A side-by-side DOM snippet or highlighted screenshot showing the before/after state.

A CTO would defend this to their team by saying: *"Testsigma isn't guessing. It shows us exactly why a test broke, how it fixed it, and asks for our permission to make it permanent. It turns flaky pipeline blockers into actionable code reviews."*

## 5. Team Structure

The deterministic engine team and the agentic execution team should work as **one unified team**. 

**The Trade-off Reasoning:**
If we split them, we optimize for depth of specialization (Playwright experts vs. Prompt Engineers). However, this introduces a massive organizational boundary exactly where our product needs to be the most seamless: the fallback boundary. 

Shared session infrastructure, the exact moment of hand-off from a failed deterministic step to an agent, and the promotion lifecycle that feeds agentic discoveries back into deterministic scripts—these span both domains. If the teams are separated, ownership of the "hybrid loop" falls through the cracks. By unifying them, we optimize for speed of integration and ensure the team is solving for the entire customer outcome (a reliable hybrid test) rather than local maxima (a fast deterministic runner or a smart agent).

## 6. The Hardest Conversation

**Subject: Pausing feature development to fix "Silent Passes"**

"Hi team, I want to address the 'silent passes' we've seen escalating in the v0 hybrid executor. I've spent my first couple of weeks digging into the architecture and trace data, and the reality is that the agent is sometimes hallucinating success criteria because our prompts lack rigorous semantic state validation. 

I know we have a lot of pressure to ship the new multi-agent test authoring features this quarter, but silent passes are an existential threat to our platform. If a customer's pipeline passes a broken build because our agent confidently clicked the wrong element and called it a success, we lose their trust permanently. 

Therefore, for the next 30 days, I am halting new feature development on the agent side to focus the entire team on implementing strict negative constraints and a shadow evaluation framework. This means the authoring feature will be delayed by a month, but it ensures that the surface customers are staking their releases on is actually trustworthy."

## Conclusion: How the 90-Day Plan Fails

The most likely way this 90-day plan fails is that the variability of DOM structures across different customer web applications is too massive for generalized prompt engineering and DOM pruning to handle reliably, leading to an endless game of whack-a-mole with edge cases that consume all of our engineering capacity. The earliest warning signal that this is happening will be in Days 30–60: if our shadow evaluation dataset shows that the false positive rate (silent passes) isn't dropping despite our new guardrails, or if customer rejection of promotion candidates remains above 30%, it indicates that our foundational LLM context strategy is flawed and needs a deeper re-architecture.
