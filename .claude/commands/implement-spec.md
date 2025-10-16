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

## Workflow

1. Read $spec_path file, think hard about the plan
2. Implement the plan, one phase at a time, running validation after each step
3. **IMPORTANT** Update the markdown tasks in $spec_path as you complete them
4. When you complete an entire phase, fill in completion notes with context and notes for the reviewer in $spec_path

## Report

- Summarize the work you've just done in a concise bullet point list.
- Report the files and total lines changed with `git diff --stat`
