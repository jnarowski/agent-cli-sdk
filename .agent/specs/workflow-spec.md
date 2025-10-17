# Feature: Workflow State Utilities

## What We're Building

Simple utility functions for managing workflow state, progress tracking, and recovery in ad-hoc multi-step agent workflows. Developers compose their own workflows using these lightweight helpers for state persistence, progress logging, and LLM integration.

## User Story

As a developer building multi-agent systems
I want simple utilities to track workflow state and progress
So that I can build custom workflows without framework overhead while maintaining observability and resumability

## Technical Approach

Provide minimal utility functions that:
1. Generate workflow IDs (UUIDs)
2. Read/write workflow state objects to disk as JSON
3. Provide console logging helpers for progress reporting
4. Integrate Vercel AI SDK as a simple helper function
5. Work seamlessly with existing adapter logging (workflow-{id}/step-{n} pattern)

Developers write their own workflow logic (like the example script provided) and call these utilities as needed. No orchestration engine, no step definitions - just helpful functions.

## Files to Touch

### Existing Files

- `src/index.ts` - Export workflow utilities (`generateWorkflowId`, `saveWorkflowState`, `loadWorkflowState`, workflow logging helpers)
- `src/types/index.ts` - Export basic workflow types
- `package.json` - Add `ai` (Vercel AI SDK) dependency

### New Files

- `src/types/workflow.ts` - Minimal type definitions (WorkflowState interface only)
- `src/utils/workflow-state.ts` - State persistence utilities (save/load JSON)
- `src/utils/workflow-logger.ts` - Console logging helpers (progress, errors, completion)
- `src/utils/ai-helper.ts` - Vercel AI SDK wrapper function
- `examples/workflow-custom.ts` - Example of custom workflow using utilities

## Implementation Plan

### Phase 1: Foundation

Create minimal type definitions for workflow state and add Vercel AI SDK dependency.

### Phase 2: Utility Functions

Implement simple utility functions for state persistence, workflow ID generation, and Vercel AI SDK integration.

### Phase 3: Logging Helpers

Add console logging helper functions for progress reporting (similar to the example script provided).

## Step by Step Tasks

### 1: Basic Types and Dependencies

- [ ] Add Vercel AI SDK dependency
  - File: `package.json`
  - Add to dependencies: `"ai": "^3.4.0"`
  - Run: `pnpm install`
- [ ] Create minimal workflow type definitions
  - Create new file: `src/types/workflow.ts`
  - Define `WorkflowState` interface as a flexible object: `{ workflowId: string; [key: string]: any }`
  - Users can extend this with their own properties as needed
  - Add JSDoc explaining it's a flexible container for workflow state
- [ ] Export workflow types
  - File: `src/types/index.ts`
  - Add: `export type { WorkflowState } from './workflow.js'`

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 2: Vercel AI SDK Integration

- [ ] Add Vercel AI SDK dependencies
  - File: `package.json`
  - Add to dependencies: `"ai": "^3.4.0"`
  - Add to dependencies: `"zod": "^3.22.0"`
  - Add to devDependencies: `"@ai-sdk/openai": "^0.0.66"` (for examples)
  - Run: `pnpm install`
- [ ] Create Vercel AI SDK helper utility
  - Create new file: `src/utils/vercel-ai.ts`
  - Import: `generateText` from `ai`, `openai` from `@ai-sdk/openai`
  - Implement `async executeWithVercelAI(model: string, prompt: string): Promise<{ output: string; usage?: any }>`
  - Support models: `openai('gpt-4')`, `openai('gpt-4-turbo')`, `openai('gpt-3.5-turbo')`
  - Handle API key from `process.env.OPENAI_API_KEY`
  - Return normalized response with output text and usage stats
  - Add error handling with helpful messages

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 3: Step Execution Logic

- [ ] Create step executor
  - Create new file: `src/workflow/steps.ts`
  - Import: workflow types, `executeWithVercelAI`, adapters, `retry` utility
  - Implement `async executeLLMStep(step: LLMStep, state: WorkflowState): Promise<StepResult>`
  - Implement `async executeCustomStep(step: CustomStep, state: WorkflowState): Promise<StepResult>`
  - Implement `async executeAdapterStep(step: AdapterStep, state: WorkflowState): Promise<StepResult>`
  - Each executor should:
    - Create `StepResult` with status tracking
    - Apply retry policy if configured (use existing `retry` utility)
    - Capture errors without throwing
    - Record start/end timestamps
    - Track attempt count
  - LLM step uses Vercel AI SDK via `executeWithVercelAI`
  - Adapter step uses existing Claude/Codex adapters
  - Custom step calls provided handler function with current state

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 4: Workflow Engine

- [ ] Create workflow engine core
  - Create new file: `src/workflow/engine.ts`
  - Import: workflow types, state management, step executors, reporter
  - Implement `async createWorkflow(config: Partial<WorkflowConfig>): Promise<WorkflowState>`
  - Implement `async executeWorkflow(config: WorkflowConfig, state?: WorkflowState): Promise<WorkflowState>`
  - Implement `async resumeWorkflow(stateDir: string, workflowId: string): Promise<WorkflowState>`
  - `createWorkflow`:
    - Generate UUID for workflow ID
    - Set default `stateDir` to `./workflows` if not provided
    - Create initial state
    - Save state to disk
    - Return initial state
  - `executeWorkflow`:
    - Use provided state or create new initial state
    - Update status to 'running'
    - Loop through steps starting from `currentStepIndex`
    - Execute each step sequentially
    - Save state after each step completion
    - Update `currentStepIndex` after each step
    - If step fails and no retry, set status to 'paused'
    - If all steps complete, set status to 'completed'
    - Return final state
  - `resumeWorkflow`:
    - Load state from disk
    - Validate state exists
    - Call `executeWorkflow` with loaded state
    - Return final state

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 5: Progress Reporting

- [ ] Create console reporter
  - Create new file: `src/workflow/reporter.ts`
  - Import: `chalk` for colors, workflow types
  - Implement `logWorkflowStart(config: WorkflowConfig): void`
  - Implement `logStepStart(step: WorkflowStep, stepIndex: number, totalSteps: number): void`
  - Implement `logStepComplete(step: WorkflowStep, result: StepResult): void`
  - Implement `logStepFailure(step: WorkflowStep, result: StepResult): void`
  - Implement `logWorkflowComplete(state: WorkflowState): void`
  - Implement `logWorkflowPaused(state: WorkflowState, resumeCommand: string): void`
  - Use existing `renderConsoleBox` utility for workflow summaries
  - Format:
    - Workflow start: Show workflow ID, name, total steps
    - Step start: `🔄 Step X/Y: {stepName}...`
    - Step complete: `✅ Step X/Y: {stepName} (duration: Xms)`
    - Step failure: `❌ Step X/Y: {stepName} failed (attempt X/Y)`
    - Workflow complete: Summary box with total duration, steps completed
    - Workflow paused: Resume command and state location
- [ ] Integrate reporter into workflow engine
  - File: `src/workflow/engine.ts`
  - Call reporter functions at appropriate points in execution flow
  - Log workflow start before execution loop
  - Log step start/complete/failure for each step
  - Log workflow complete/paused at end

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 6: Public API and Examples

- [ ] Export workflow APIs from main index
  - File: `src/index.ts`
  - Add exports: `createWorkflow`, `executeWorkflow`, `resumeWorkflow`
  - Add type exports: `WorkflowConfig`, `WorkflowStep`, `WorkflowState`, `LLMStep`, `CustomStep`, `AdapterStep`
- [ ] Create simple workflow example
  - Create: `examples/workflow-simple.ts`
  - Demonstrate:
    - Creating a workflow with 3 steps
    - LLM step using Vercel AI SDK
    - Custom step with inline handler
    - Adapter step using Claude
    - Execution with console output
  - Include comments explaining each part
- [ ] Create error recovery example
  - Create: `examples/workflow-with-recovery.ts`
  - Demonstrate:
    - Workflow with step that might fail
    - Retry policy configuration
    - Manual resume after failure
    - State persistence and loading
  - Show how to read state file and resume workflow
- [ ] Update TypeScript build
  - Run: `pnpm build`
  - Verify no type errors
  - Verify exports are in dist/

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 7: Integration with Logging System

- [ ] Add logging integration to workflow engine
  - File: `src/workflow/engine.ts`
  - Import: `setLoggingConfig`, `getLoggingConfig` from logger
  - For each step execution:
    - If adapter step, pass `logPath: {stateDir}/workflow-{id}/step-{index}-{stepName}`
    - This automatically integrates with existing logging system
    - Logs will include input.json, output.json, stream.jsonl per step
- [ ] Update workflow state to include log paths
  - File: `src/types/workflow.ts`
  - Add `logPath?: string` to `StepResult` interface
  - Store log path in step result after execution
- [ ] Create example showing log integration
  - Update: `examples/workflow-simple.ts`
  - Add section reading step logs after workflow completes
  - Demonstrate accessing input/output/stream files per step

#### Completion Notes

(This will be filled in by the agent implementing this phase)

## Acceptance Criteria

**Must Work:**

- [ ] Create workflow with auto-generated UUID
- [ ] Execute steps sequentially with state updates after each step
- [ ] LLM steps execute via Vercel AI SDK with specified model
- [ ] Custom steps execute inline handler functions with access to state
- [ ] Adapter steps execute via existing Claude/Codex adapters
- [ ] State persists to disk after each step completion
- [ ] Resume workflow from saved state after failure
- [ ] Retry failed steps based on retry policy
- [ ] Console progress reporting shows step-by-step execution
- [ ] Integration with existing logging system (workflow-{id}/step-{n} pattern)
- [ ] All TypeScript types exported and usable

**Should Not:**

- [ ] Break existing adapter functionality
- [ ] Lose state data on crashes
- [ ] Execute steps out of order
- [ ] Block indefinitely on errors
- [ ] Create performance overhead >10% vs direct adapter usage

## Validation

Execute these commands to verify the feature works correctly:

**Automated Verification:**

```bash
# Build verification
pnpm build
# Expected: Clean build with no errors, workflow files compiled to dist/

# Type checking
npx tsc --noEmit
# Expected: No type errors

# Linting
pnpm lint
# Expected: No lint errors

# Unit tests
pnpm test
# Expected: All existing tests pass (new workflow tests to be added in future)
```

**Manual Verification:**

1. Start simple workflow: `npx tsx examples/workflow-simple.ts`
2. Verify: Console shows step-by-step progress
3. Verify: Workflow state file created in `./workflows/workflow-{id}/state.json`
4. Verify: Step logs created in `./workflows/workflow-{id}/step-{n}-{name}/`
5. Test error recovery: `npx tsx examples/workflow-with-recovery.ts`
6. Verify: Workflow pauses on error and saves state
7. Verify: Resume command works and continues from last successful step
8. Check: All JSON files are well-formed (use `jq` or JSON validator)

**Feature-Specific Checks:**

- Verify `state.json` contains complete workflow state with step results
- Verify LLM steps execute via Vercel AI SDK (check API calls)
- Verify adapter steps create standard log structure (input/output/stream)
- Verify custom steps receive correct state object
- Test workflow with 5+ steps to ensure sequential execution
- Simulate failure and verify retry policy works (attempts, backoff)
- Verify resumed workflow skips completed steps
- Check console output formatting is clear and informative

## Definition of Done

- [ ] All tasks completed
- [ ] Build passes with no TypeScript errors
- [ ] Lint passes
- [ ] Manual testing confirms all workflow scenarios work
- [ ] State persistence verified (create, save, load, resume)
- [ ] Progress reporting displays correctly in console
- [ ] Error recovery tested (retry + resume)
- [ ] Integration with logging system verified
- [ ] Examples run successfully and demonstrate key features
- [ ] Code follows existing patterns (types/, workflow/ structure)
- [ ] No breaking changes to existing adapter APIs

## Notes

**Dependencies:**

- Vercel AI SDK (`ai` package) for LLM integration
- Zod for schema validation (Vercel AI SDK dependency)
- Requires Node.js `fs/promises` API (Node 14+)
- Works with existing Claude/Codex adapters

**Design Decisions:**

- **Simplicity First**: Start with basic retry and resume, avoid over-engineering
- **Sequential Only**: No parallel step execution in v1 (can add later)
- **Disk-Based State**: JSON files for now, database integration in future
- **Workflow ID Pattern**: Use existing UUID generation from logging examples
- **State Directory Structure**: `{stateDir}/workflow-{id}/state.json` and `{stateDir}/workflow-{id}/step-{n}-{name}/` for logs

**Future Considerations:**

- Parallel step execution (use existing `parallel` utility)
- Conditional step execution based on previous results
- Sub-workflows and workflow composition
- Database persistence instead of JSON files
- Web UI for workflow visualization and monitoring
- Workflow templates and presets
- Step dependency graphs
- Webhook notifications on workflow events
- Workflow scheduling and cron-like execution
- Advanced retry strategies (circuit breaker, fallback steps)

**Integration Notes:**

- Workflows automatically integrate with existing logging system
- Each step gets dedicated log directory following `workflow-{id}/step-{n}` pattern
- Adapter steps use existing `logPath` option for seamless integration
- State files use same directory structure for consistency
- Resume functionality works because state includes `currentStepIndex`

**Error Handling Strategy:**

- LLM API errors: Retry with backoff (configurable)
- Custom step errors: Capture and pause workflow
- Adapter errors: Use existing error types, retry if configured
- State persistence errors: Log to stderr, continue execution
- Invalid resume: Throw error with helpful message
