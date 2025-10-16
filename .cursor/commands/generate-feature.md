---
description: Generate implementation spec with phased approach and validation
argument-hint: [feature-name, context]
---

# Implementation Spec Generator

Generate a well-defined spec file based on the provided context. Read Instructions and then follow Workflow instructions in the exact order.

## Variables

- $feature-name: $1 (optional)
- $context: $2 (optional) - If context is not provided, use existing context from the chat window

## Instructions

- **IMPORTANT**: Use your reasoning model: THINK HARD about the feature requirements, design, and implementation approach.
- Normalize $feature-name (lowercase, hyphenated) for the output path
- Replace ALL <placeholders> with specific details relevant to that section
- Order tasks for dependencies (foundation → core → integration)
- Include specific file paths, not generic names
- Make all commands copy-pasteable with expected outputs
- **Verification Commands**: Include comprehensive verification covering build, tests, linting, and manual feature-specific checks
- Add E2E test tasks if feature has UI
- Keep acceptance criteria measurable
- Include rollback considerations in notes

## Workflow

1.  Read and analyze `./agent/specs/${feature-name}-prd.md` (if the file exists. if it does not exist, igore this step)
2.  Research codebase for existing patterns
3.  IMPORTANT: If you have any questions or unclear about anything within the implementation, do the following:
    a. Ask the user your questions ONE AT A TIME.
    b. Follow this template below (provide two options and specify which you recommend and why)

                ```md
                **Question**: The question you have
                **Suggestions**
                1: Something (recommended)
                2: Something else
                3: Other - user specifies
                ```

4.  Once you are confident that you have all the context needed to successfully implement this feature, generate a focused spec following the exact structure outlined in Template below. Be concise but comprehensive. Skip sections only if truly not applicable.
5.  Create spec in: `./agent/specs/${feature-name}-spec.md`

## Template

```md
# Feature: <feature name>

## What We're Building

<2-3 sentences describing the feature and its value to users>

## User Story

As a <user type>
I want to <action/goal>  
So that <benefit/value>

## Technical Approach

<brief description of implementation strategy and key design decisions>

## Files to Touch

### Existing Files

- `<filepath>` - <reason for modification>
- <list all files that need changes>

### New Files

- `<filepath>` - <purpose of this file>
- <list all new files to create>

## Implementation Plan

### Phase 1: Foundation

<describe foundational work: schemas, configurations, types, base infrastructure>

### Phase 2: Core Implementation

<describe main feature work: business logic, APIs, UI components, core functionality>

### Phase 3: Integration

<describe integration work: connecting to existing systems, navigation, polish>

## Step by Step Tasks

**IMPORTANT: Execute every step in order, top to bottom**

### <Task Group Number>: <Task Group Name>

<!-- prettier-ignore -->
- [ ] <task id> <specific task description> 
        - <implementation detail or note> 
        - File: `<specific filepath>` 
        - <any commands to run>
- [ ] <next task> 
        - <details>

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### <Next Task Group>

<!-- prettier-ignore -->
- [ ] <specific task>
        - <details>

<continue with all tasks needed, grouped logically>

## Acceptance Criteria

**Must Work:**

- [ ] <specific functional requirement>
- [ ] <another requirement>
- [ ] <edge case handling>
- [ ] <performance requirement>

**Should Not:**

- [ ] <what must not break>
- [ ] <performance degradation to avoid>
- [ ] <security issues to prevent>

## Validation

Execute these commands to verify the feature works correctly:

**Automated Verification:**

    # Build verification
    <build command>
    # Expected: <successful build output>

    # Type checking
    <type check command>
    # Expected: <no type errors>

    # Linting
    <lint command>
    # Expected: <no lint errors>

    # Unit tests
    <unit test command>
    # Expected: <all tests pass>

    # Integration tests (if applicable)
    <integration test command>
    # Expected: <all tests pass>

    # E2E tests (if applicable)
    <e2e test command>
    # Expected: <all tests pass>

**Manual Verification:**

1. Start application: `<start command>`
2. Navigate to: `<URL or path>`
3. Verify: <specific feature behavior to check>
4. Test edge cases: <specific scenarios to test>
5. Check console: No errors or warnings

**Feature-Specific Checks:**

- <specific verification step for this feature>
- <another feature-specific check>
- <edge case or integration point to manually verify>

## Definition of Done

- [ ] All tasks completed
- [ ] Tests passing
- [ ] Lint and Type Checks
- [ ] Manual testing confirms working
- [ ] No console errors
- [ ] Code follows existing patterns
- [ ] <any project-specific requirements>

## Notes

<any dependencies, future considerations, or important context>
```

## Report

- IMPORTANT: Return exclusively the path to the plan file created and nothing else.
