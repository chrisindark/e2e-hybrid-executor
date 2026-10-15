Document Status: Approved for Engineering Implementation
Target Milestone: Pre-Migration Phase 0
Primary Reference: Plans.md (Section 8: "Fix these before migrating")
Impact Areas: apps/gateway-api (Execution Engine, Recovery Service, Entity Persistence, Auth Guards)

1. Overview & Objective
   Before splitting the repository into distributed workers, introducing a Redis/BullMQ task queue, and migrating to PostgreSQL with Row-Level Security (RLS), seven foundational defects in the existing codebase must be resolved. Left unaddressed, these issues will carry over into the new architecture, producing race conditions, memory leaks, silent test falsifications, and tenant leakage.
   This document defines the technical root causes, code-level remediation plans, and verification test suites for each audit item.

2. Technical Debt & Defect Matrix
   Item Component Severity Defect Description Target Fix
   AUDIT-01 ExecutionEngine Critical assertText interpolates step.value, which is empty in specs; searches for "undefined". Normalize step schema to evaluate step.expectedOutcome || step.value.
   AUDIT-02 GeminiRecoveryService Critical Assertions in recovery only call waitForSelector without verifying element text or state (silent passes). Enforce two-stage verification: selector presence followed by explicit text/visibility assertion.
   AUDIT-03 PromotionService High Approval mutates test_steps in-place, erasing execution history and breaking replayability. Introduce immutable versions (test_versions) with append-only promotion.
   AUDIT-04 DomSnapshotService Medium Captures the first 80 [id] / [class] elements, flooding LLM prompts with noisy DOM elements. Replace with an Accessibility-Tree (a11y) walker filtering for interactive visible nodes.
   AUDIT-05 ExecutionController High runTest blocks the HTTP request for the entire browser lifecycle, risking HTTP gateway timeouts. Decouple run initiation from execution lifecycle using an asynchronous polling stub.
   AUDIT-06 AppModule / Controllers Critical JWT/Auth guards are declared in code but never applied via @UseGuards(), leaving routes public. Apply global JwtAuthGuard via APP_GUARD and establish tenant-scoped request context.
   AUDIT-07 DatabaseModule High SQLite runs with synchronize: true, causing non-deterministic schema mutations on launch. Disable synchronize, enable strict schema migrations, and prepare isolation for PostgreSQL.

3. Detailed Technical Specifications
   AUDIT-01: Fix assertText Specification Alignment
   File Location: apps/gateway-api/src/execution/execution.engine.ts
   Root Cause: In the test generator prompt and mock fixture definitions, the expected text string is mapped to step.expectedOutcome, while step.value remains undefined. The execution step evaluator executes:

// Defective implementation
await page.locator(step.locator).locator(`has-text("${step.value}")`).waitFor();

This creates a selector searching for the string "undefined", causing false positive failures or unexpected locator syntax exceptions.
Implementation Plan:
Update locator synthesis to fall back to step.expectedOutcome or step.targetValue.
Use Playwright's native expect(locator).toHaveText() with configurable substring matching rather than selector-level pseudo-class chaining.

// Fixed implementation
const targetText = step.expectedOutcome ?? step.value;
if (!targetText) {
throw new ValidationError(`Assertion step ${step.id} has no expected text defined.`);
}
const locator = page.locator(step.locator.primary);
await expect(locator).toContainText(targetText, { timeout: step.timeoutMs ?? 5000 });

// Fixed implementation
const targetText = step.expectedOutcome ?? step.value;
if (!targetText) {
throw new ValidationError(`Assertion step ${step.id} has no expected text defined.`);
}
const locator = page.locator(step.locator.primary);
await expect(locator).toContainText(targetText, { timeout: step.timeoutMs ?? 5000 });

AUDIT-02: Eliminate Silent Passes in Recovery Engine
File Location: apps/gateway-api/src/recovery/gemini-recovery.service.ts
Root Cause: When an assertion step fails and enters agentic recovery, Gemini returns an updated locator proposal. The recovery handler checks viability using page.waitForSelector(proposal.locator), but never executes the underlying assertion verification. A button or banner existing on the screen is treated as "recovered" even if its content fails the business assertion.
Implementation Plan:
Define a strict post-condition validation step for any candidate locator produced by RecoveryPort.
Verify that if the failed step was ui.assertText, the candidate element both exists and satisfies toContainText(expectedOutcome).
Verify that if the failed step was ui.assertVisible, isVisible() evaluates strictly to true.
If verification fails, mark the recovery attempt as RECOVERY_VALIDATION_FAILED and fall through to standard failure.

AUDIT-03: Immutable Test Versioning & Append-Only Promotions
File Location: apps/gateway-api/src/generation/generation.service.ts, apps/gateway-api/src/promotion/
Root Cause: Approving a self-healing promotion executes an UPDATE test_steps SET locator = :newLocator WHERE id = :id. This destroys previous run context, makes historical test runs non-reproducible, and causes race conditions if a concurrent run is executing the same test.
Implementation Plan:
Split tests into tests (metadata, name, current_version_id) and test_versions (immutable snapshot of ordered steps).
Modifying a test or approving a promotion candidate creates a new test_versions record with version_number = N + 1.
Every TestRun entity stores an explicit foreign key pointing to the immutable version_id it executed against.

erDiagram
TEST ||--o{ TEST_VERSION : has
TEST_VERSION ||--|{ TEST_STEP : contains
TEST_VERSION ||--o{ TEST_RUN : pinned_by
PROMOTION_CANDIDATE }|--|| TEST_VERSION : based_on
PROMOTION_CANDIDATE ||--|| TEST_VERSION : creates_version

AUDIT-04: Clean DOM Snapshot Extraction
File Location: apps/gateway-api/src/execution/dom-snapshot.util.ts
Root Cause: getInteractiveElementsSnapshot() runs document.querySelectorAll('[id], [class]') and takes .slice(0, 80). On modern UI frameworks (e.g., Tailwind, CSS modules), the top 80 elements are typically container wrappers (<div class="min-h-screen flex flex-col">), completely starving Gemini of actual interactive buttons, inputs, and links.
Implementation Plan:
Restrict selector to interactive primitives: button, a[href], input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [tabindex]:not([tabindex="-1"]).
Check visibility: Filter out elements where offsetParent === null, getComputedStyle().display === 'none', or visibility === 'hidden'.

Extract an accessibility node representation:

interface PrunedElementSnapshot {
tagName: string;
role: string | null;
name: string | null; // text content or aria-label
testId: string | null; // data-testid, data-cy
attributes: Record<string, string>;
selectorHint: string;
}

Cap payload size by ranking elements within the current viewport first.

AUDIT-05: Non-Blocking Execution Lifecycles
File Location: apps/gateway-api/src/execution/execution.controller.ts
Root Cause: POST /v1/execution/:testId/run awaits this.engine.runTest(), keeping the raw HTTP connection open for 30–120+ seconds. Any reverse proxy (Cloudflare, Nginx, ALB) drops connections at 60 seconds.
Implementation Plan (Pre-BullMQ Shim):
Alter POST /v1/execution/:testId/run to create a TestRun entity in state QUEUED, fire the run execution in an unawaited background promise, and return 202 Accepted with { runId: string, status: 'QUEUED' } within 50ms.
Ensure run failures within the background task properly transition status to FAILED or ERRORED in SQLite with recorded stack traces.
Ensure client polls GET /v1/execution/:runId for current state until Phase 1 implements Redis Streams / SSE.

AUDIT-06: Global Auth Guard & Tenant Context Injection
File Location: apps/gateway-api/src/auth/, apps/gateway-api/src/app.module.ts
Root Cause: JwtAuthGuard exists in apps/gateway-api/src/auth/guards/jwt.guard.ts but is neither registered as a global NestJS guard nor declared on controllers. All REST endpoints under /v1/* can be invoked anonymously without authentication.
Implementation Plan:

Bind JwtAuthGuard globally in apps/gateway-api/src/app.module.ts:

{
provide: APP_GUARD,
useClass: JwtAuthGuard,
}
Implement an @Public() decorator using Reflector to exempt health checks and login endpoints.
Add tenantId to JWT payload decoding. Inject tenantId into RequestContext (backed by AsyncLocalStorage) so future services can access tenancy implicitly.

AUDIT-07: Disable SQLite Auto-Synchronization & Establish Migrations
File Location: apps/gateway-api/src/database/database.module.ts
Root Cause: TypeORM is configured with synchronize: true. In production or multi-instance scenarios, this causes startup race conditions, unexpected schema mutations, and drops column constraints.
Implementation Plan:
Set synchronize: false in TypeORM configuration.
Generate baseline migration scripts in apps/gateway-api/src/database/migrations/ using TypeORM CLI.

Add a migration-runner command to package.json:

"db:migrate": "typeorm migration:run -d dist/database/data-source.js"

Ensure all foreign key constraints and indexes on test_id, version_id, and created_at are explicitly declared.

4. Verification & Regression Testing Matrix
   Defect ID Test Type Verification Strategy Pass Criteria
   AUDIT-01 Unit / Integration Run assertion against a fixture where text is in expectedOutcome and value is omitted. Test step passes without evaluating "undefined".
   AUDIT-02 Unit / Mock Inject a mock locator that resolves in the DOM but has mismatched text during recovery. Recovery engine detects mismatch, rejects candidate, and reports step as failed.
   AUDIT-03 Integration Execute recovery, approve candidate via /decide, and inspect DB records. test_versions count increments; initial version remains unchanged; run points to original version.
   AUDIT-04 Unit Run DOM snapshot extractor on an interactive page with 200+ container nodes. Output contains 0 empty wrappers; captures all buttons/inputs with roles and labels.
   AUDIT-05 E2E / API Fire POST /v1/execution/:testId/run via HTTP client. Returns status 202 in under 50ms with a valid runId. Subsequent poll yields RUNNING \to COMPLETED.
   AUDIT-06 Security Integration Make unauthenticated GET /v1/generation and POST /v1/execution requests. All non-public routes return 401 Unauthorized.
   AUDIT-07 DevOps Re-run application bootstrap with synchronize: false and migrations enabled. Application boots without DDL changes; migration runner applies all schemas cleanly.
