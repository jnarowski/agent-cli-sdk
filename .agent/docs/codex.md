# Codex CLI Reference

This document provides reference information for the Codex CLI, which is used by the SDK's Codex adapter.

## CLI Usage

```bash
codex [OPTIONS] [PROMPT]
codex [OPTIONS] [PROMPT] <COMMAND>
```

If no subcommand is specified, options will be forwarded to the interactive CLI.

## Commands

- `exec` (alias: `e`) - Run Codex non-interactively
- `login` - Manage login
- `logout` - Remove stored authentication credentials
- `mcp` - **[experimental]** Run Codex as an MCP server and manage MCP servers
- `mcp-server` - **[experimental]** Run the Codex MCP server (stdio transport)
- `app-server` - **[experimental]** Run the app server
- `completion` - Generate shell completion scripts
- `sandbox` (alias: `debug`) - Run commands within a Codex-provided sandbox
- `apply` (alias: `a`) - Apply the latest diff produced by Codex agent as a `git apply` to your local working tree
- `resume` - Resume a previous interactive session (picker by default; use `--last` to continue the most recent)
- `cloud` - **[EXPERIMENTAL]** Browse tasks from Codex Cloud and apply changes locally
- `help` - Print help message or help for a given subcommand

## Arguments

- `[PROMPT]` - Optional user prompt to start the session

## Options

### Core Options

- `-h, --help` - Print help (see a summary with `-h`)
- `-V, --version` - Print version

### Configuration Options

- `-c, --config <key=value>` - Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`
  - Use a dotted path (`foo.bar.baz`) to override nested values
  - The `value` portion is parsed as JSON. If it fails to parse as JSON, the raw string is used as a literal
  - Examples:
    - `-c model="o3"`
    - `-c 'sandbox_permissions=["disk-full-read-access"]'`
    - `-c shell_environment_policy.inherit=all`

- `-p, --profile <CONFIG_PROFILE>` - Configuration profile from config.toml to specify default options

### Model Options

- `-m, --model <MODEL>` - Model the agent should use

- `--oss` - Convenience flag to select the local open source model provider
  - Equivalent to `-c model_provider=oss`
  - Verifies a local Ollama server is running

### Input Options

- `-i, --image <FILE>...` - Optional image(s) to attach to the initial prompt

### Workspace Options

- `-C, --cd <DIR>` - Tell the agent to use the specified directory as its working root

### Sandbox & Permission Options

- `-s, --sandbox <SANDBOX_MODE>` - Select the sandbox policy to use when executing model-generated shell commands
  - Possible values:
    - `read-only` - Read-only access to the workspace
    - `workspace-write` - Write access limited to the workspace
    - `danger-full-access` - Full system access (dangerous)

- `-a, --ask-for-approval <APPROVAL_POLICY>` - Configure when the model requires human approval before executing a command
  - Possible values:
    - `untrusted` - Only run "trusted" commands (e.g. ls, cat, sed) without asking for user approval. Will escalate if the model proposes a command not in the "trusted" set
    - `on-failure` - Run all commands without asking for user approval. Only asks for approval if a command fails to execute, in which case it will escalate to the user to ask for un-sandboxed execution
    - `on-request` - The model decides when to ask the user for approval
    - `never` - Never ask for user approval. Execution failures are immediately returned to the model

- `--full-auto` - Convenience alias for low-friction sandboxed automatic execution
  - Equivalent to: `-a on-failure --sandbox workspace-write`

- `--dangerously-bypass-approvals-and-sandbox` - Skip all confirmation prompts and execute commands without sandboxing
  - **EXTREMELY DANGEROUS**
  - Intended solely for running in environments that are externally sandboxed

### Feature Options

- `--search` - Enable web search (off by default)
  - When enabled, the native Responses `web_search` tool is available to the model (no per-call approval)

## SDK Usage Notes

The SDK's Codex adapter primarily uses:

- `exec` command for non-interactive execution
- `-m, --model` to specify which model to use
- `-C, --cd` to set the working directory
- `-s, --sandbox` and `-a, --ask-for-approval` to control execution permissions
- `-c, --config` for advanced configuration overrides
- `--full-auto` for automated workflows with safety guardrails

### Example Programmatic Usage

```bash
# Non-interactive execution
codex exec "Write a hello world function"

# With specific model
codex exec -m o3 "Write a hello world function"

# With working directory
codex exec -C /path/to/project "Write a hello world function"

# Full auto mode (sandboxed, low friction)
codex exec --full-auto "Write a hello world function"

# With custom sandbox and approval policy
codex exec -s workspace-write -a on-failure "Write a hello world function"

# With web search enabled
codex exec --search "Research and implement a REST API"

# With image input
codex exec -i screenshot.png "Describe this UI and suggest improvements"

# With config overrides
codex exec -c model="o3" -c 'sandbox_permissions=["disk-full-read-access"]' "Write a hello world function"
```

## Authentication

Codex requires authentication before use:

```bash
# Login (opens browser for OAuth)
codex login

# Logout (removes stored credentials)
codex logout
```

## Configuration

Configuration is stored in `~/.codex/config.toml`. You can:

- Edit the config file directly
- Use `-c, --config` to override values at runtime
- Use `-p, --profile` to switch between different configuration profiles
