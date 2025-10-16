---
allowed-tools: Bash(gh pr:*), Bash(git:*)
description: Create a pull request with proper commit and PR setup
argument-hint: [title]
---

# Pull Request

Follow the steps in Workflow to Create a pull request for the current branch.

## Variables

- $title: $1

## Instructions

- Use conventional commit format for the commit message.

## Workflow

1. Check current git status with `git status`
2. Review changes with `git diff`
3. Stage all changes with `git add -A`
4. Create a semantic commit with a descriptive message based on the changes
5. Push the current branch to origin
6. Create a pull request using `gh pr create` with:
   - Title: $ARGUMENTS (if provided) or generate from commit
   - Fill out the PR body with:
     - Summary of changes
     - Type of change (feature/fix/docs/refactor)
     - Testing performed
   - Set appropriate labels if possible

## Report

Output the PR URL
