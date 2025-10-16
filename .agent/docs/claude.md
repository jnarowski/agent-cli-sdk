# Claude Code CLI Reference

This document provides reference information for the Claude Code CLI, which is used by the SDK's Claude adapter.

## CLI Usage

```bash
claude [options] [command] [prompt]
```

Claude Code starts an interactive session by default. Use `-p/--print` for non-interactive output suitable for programmatic use.

## Arguments

- `prompt` - Your prompt to Claude

## Options

### Core Options

- `-p, --print` - Print response and exit (useful for pipes and programmatic usage)
  - **Note:** The workspace trust dialog is skipped in print mode. Only use in directories you trust.

- `-v, --version` - Output the version number

- `-h, --help` - Display help for command

### Output & Format Options

- `--output-format <format>` - Output format (only works with `--print`)
  - Choices: `"text"` (default), `"json"` (single result), `"stream-json"` (realtime streaming)

- `--include-partial-messages` - Include partial message chunks as they arrive
  - Only works with `--print` and `--output-format=stream-json`

- `--input-format <format>` - Input format (only works with `--print`)
  - Choices: `"text"` (default), `"stream-json"` (realtime streaming input)

- `--replay-user-messages` - Re-emit user messages from stdin back on stdout for acknowledgment
  - Only works with `--input-format=stream-json` and `--output-format=stream-json`

### Model & Prompting Options

- `--model <model>` - Model for the current session
  - Provide an alias for the latest model (e.g. `'sonnet'` or `'opus'`)
  - Or a model's full name (e.g. `'claude-sonnet-4-5-20250929'`)

- `--fallback-model <model>` - Enable automatic fallback to specified model when default model is overloaded
  - Only works with `--print`

- `--system-prompt <prompt>` - System prompt to use for the session

- `--append-system-prompt <prompt>` - Append a system prompt to the default system prompt

### Session Management Options

- `-c, --continue` - Continue the most recent conversation

- `-r, --resume [sessionId]` - Resume a conversation
  - Provide a session ID or interactively select a conversation to resume

- `--fork-session` - When resuming, create a new session ID instead of reusing the original
  - Use with `--resume` or `--continue`

- `--session-id <uuid>` - Use a specific session ID for the conversation (must be a valid UUID)

### Permission & Security Options

- `--permission-mode <mode>` - Permission mode to use for the session
  - Choices: `"acceptEdits"`, `"bypassPermissions"`, `"default"`, `"plan"`

- `--dangerously-skip-permissions` - Bypass all permission checks
  - **Warning:** Recommended only for sandboxes with no internet access

- `--allowedTools, --allowed-tools <tools...>` - Comma or space-separated list of tool names to allow
  - Example: `"Bash(git:*) Edit"`

- `--disallowedTools, --disallowed-tools <tools...>` - Comma or space-separated list of tool names to deny
  - Example: `"Bash(git:*) Edit"`

### Configuration Options

- `--settings <file-or-json>` - Path to a settings JSON file or a JSON string to load additional settings from

- `--setting-sources <sources>` - Comma-separated list of setting sources to load
  - Options: `user`, `project`, `local`

- `--add-dir <directories...>` - Additional directories to allow tool access to

### MCP (Model Context Protocol) Options

- `--mcp-config <configs...>` - Load MCP servers from JSON files or strings (space-separated)

- `--strict-mcp-config` - Only use MCP servers from `--mcp-config`, ignoring all other MCP configurations

- `--mcp-debug` - **[DEPRECATED. Use `--debug` instead]** Enable MCP debug mode (shows MCP server errors)

### Agent Options

- `--agents <json>` - JSON object defining custom agents
  - Example: `'{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}'`

### IDE Integration Options

- `--ide` - Automatically connect to IDE on startup if exactly one valid IDE is available

### Debug Options

- `-d, --debug [filter]` - Enable debug mode with optional category filtering
  - Example: `"api,hooks"` or `"!statsig,!file"`

- `--verbose` - Override verbose mode setting from config

## Commands

- `mcp` - Configure and manage MCP servers
- `plugin` - Manage Claude Code plugins
- `migrate-installer` - Migrate from global npm installation to local installation
- `setup-token` - Set up a long-lived authentication token (requires Claude subscription)
- `doctor` - Check the health of your Claude Code auto-updater
- `update` - Check for updates and install if available
- `install [options] [target]` - Install Claude Code native build
  - Use `[target]` to specify version (stable, latest, or specific version)

## SDK Usage Notes

The SDK's Claude adapter primarily uses:

- `--print` mode for non-interactive execution
- `--output-format json` or `--output-format stream-json` for structured responses
- `--permission-mode` to control tool execution permissions
- `--model` to specify which Claude model to use
- `--system-prompt` or `--append-system-prompt` for custom instructions

### Example Programmatic Usage

```bash
# Simple text generation
claude --print "Write a hello world function"

# JSON output for parsing
claude --print --output-format json "Write a hello world function"

# Streaming JSON for real-time processing
claude --print --output-format stream-json "Write a hello world function"

# With custom system prompt
claude --print --system-prompt "You are a Python expert" "Write a hello world function"

# With specific model
claude --print --model sonnet "Write a hello world function"
```
