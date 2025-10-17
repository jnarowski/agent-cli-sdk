---
description: Implements a feature based on provided context or spec file
argument-hint: [spec-name-or-path]
---

# Implement

Follow the `Workflow` steps in the exact order to implement the spec then `Report` the completed work.

## Variables

$spec-name-or-path = $1 (provide a spec name like "config-sync-cli" or a full file path `.agent/specs/config-sync-cli-spec.md`)

## Instructions

- If $spec-name-or-path is a file path set $spec_path to $spec-name-or-path
- If $spec-name-or-path is not a file path $spec_path to `.agent/specs/${feature-name}-spec.md`
- If $spec_path file is not present, stop IMMEDIATELY and let the user know that the file wasn't found and you cannot continue

## Task Tracking Requirements

**CRITICAL: You MUST track your progress in the spec file as you work. This is NOT optional.**

### What to Update

1. **Individual Tasks** - Check off IMMEDIATELY after completing each task:
   - Change `- [ ] 1.1 Task description` to `- [x] 1.1 Task description`
   - Do this AFTER finishing each task, NOT in batches
   - Never move to the next task without checking off the current one

2. **Completion Notes** - Fill in after finishing each task group/phase:
   - Each task group has a `#### Completion Notes` section
   - Write 2-4 bullet points with:
     - What was implemented
     - Any deviations from the plan
     - Important context for reviewers
     - Known issues or follow-ups

### Example of Good Progress Tracking

**Before starting task 1.1:**

```markdown
### 1: Project Initialization
- [ ] 1.1 Initialize Bun project
- [ ] 1.2 Configure package.json
```

**After completing task 1.1:**

```markdown
### 1: Project Initialization
- [x] 1.1 Initialize Bun project
- [ ] 1.2 Configure package.json
```

**After completing all tasks in group 1:**

```markdown
### 1: Project Initialization
- [x] 1.1 Initialize Bun project
- [x] 1.2 Configure package.json

#### Completion Notes
- Project initialized with Bun and TypeScript
- Used stricter tsconfig settings than spec suggested for better type safety
- All dependencies installed successfully
```

## Workflow

1. Read $spec_path file, think hard about the plan
2. Implement the plan, one phase at a time:
   - Work through tasks in order, top to bottom
   - **IMMEDIATELY check off each task** in $spec_path after completing it
   - Run validation after each logical step
3. After completing each task group/phase:
   - **Fill in the "Completion Notes" section** with implementation context
   - Include any deviations, decisions, or important notes for reviewers
4. Continue until all tasks are checked off and all completion notes are filled

## Report

- Summarize the work you've just done in a concise bullet point list.
- Report the files and total lines changed with `git diff --stat`
