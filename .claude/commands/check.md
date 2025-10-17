---
description: Run validation command from README and report all issues
argument-hint: []
---

# Check

Reads the `## Validation` section from README.md, runs the validation command, and reports all issues including errors and warnings. Does not make any fixes.

## Workflow

1. **Read README.md**

   - Locate the `## Validation` section (search for exact header text)
   - Extract the command shown in the code block under this section
   - If no command is found, report error and stop

2. **Run Validation**

   - Execute the validation command using the Bash tool
   - Capture the full output including errors, warnings, and info messages
   - Do not attempt to fix any issues

3. **Parse and Categorize Issues**

   - Analyze the output to identify all issues
   - Group issues by type:
     - **Errors**: Critical issues that prevent builds/tests from passing
     - **Warnings**: Non-critical issues that should be addressed
     - **Info**: Informational messages
   - Count issues in each category

4. **Report Results**

   - Display the validation command that was executed
   - Show total counts by category (e.g., "5 errors, 3 warnings")
   - Display the full validation output
   - Summarize the validation status (pass/fail)
   - If there are issues, suggest running `/fix` to automatically resolve them

## Report

After completion, report:

1. The validation command that was executed
2. Summary of issues found:
   - Number of errors
   - Number of warnings
   - Number of info messages (if any)
3. Full output of the validation command
4. Overall status (✓ PASSED or ✗ FAILED)
5. If issues found, suggest: "Run `/fix` to automatically resolve these issues"
