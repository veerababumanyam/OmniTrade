# OmniTrade Plugin Hooks Configuration

## Overview

Hooks enable automation at key points in Claude Code's execution lifecycle. OmniTrade plugin uses hooks for automatic code formatting, linting, logging, and quality enforcement.

## Hook Types

### PreToolUse

**Fires before** any tool invocation (Read, Write, Edit, Bash, etc.)

**Purpose**: Log and validate tool usage

**Configuration**:
```json
{
  "PreToolUse": [
    {
      "match": "Bash",
      "command": "bash -c \"echo '[PreToolUse] About to run: $CLAUDE_TOOL_INVOCATION' >> .claude/hooks/debug.log\""
    }
  ]
}
```

**Environment Variables Available**:
- `$CLAUDE_TOOL_NAME` - Tool being invoked
- `$CLAUDE_TOOL_INVOCATION` - Full command with arguments

**Use Cases**:
- Debug log tracking
- Permission validation
- Resource allocation checks

### PostToolUse

**Fires after** any tool completes successfully

**Purpose**: Automatic code formatting and linting

**Configuration**:
```json
{
  "PostToolUse": [
    {
      "match": "Write|Edit",
      "command": "bash -c \"cd /path/to/project && if [[ '$CLAUDE_FILE_PATH' == *.go ]]; then gofmt -w '$CLAUDE_FILE_PATH'; fi\""
    }
  ]
}
```

**Operations Performed**:
1. **Go files** (`.go`): `gofmt -w` → `golangci-lint run`
2. **TypeScript files** (`.ts`, `.tsx`): `prettier --write` → `eslint`
3. **CSS files** (`.css`): `prettier --write`

**Error Handling**:
- Formatting errors logged to `.claude/hooks/format-errors.log`
- Linting errors logged to `.claude/hooks/lint-errors.log`
- Errors don't block tool execution (warnings only)

**Environment Variables Available**:
- `$CLAUDE_TOOL_NAME` - Tool that was invoked
- `$CLAUDE_FILE_PATH` - Path to modified file
- `$CLAUDE_EXIT_CODE` - Tool exit status

### UserPromptSubmit

**Fires when** user submits a message/prompt

**Purpose**: Conversation logging for audit trail

**Configuration**:
```json
{
  "UserPromptSubmit": [
    {
      "match": ".*",
      "command": "bash -c \"echo '[UserPromptSubmit] User submitted: $CLAUDE_USER_MESSAGE' >> .claude/hooks/conversation.log\""
    }
  ]
}
```

**Environment Variables Available**:
- `$CLAUDE_USER_MESSAGE` - Full user message text

**Use Cases**:
- Audit logging for compliance
- Conversation analytics
- Debugging prompt issues

### SessionStart

**Fires when** a new Claude Code session begins

**Purpose**: Session initialization and logging

**Configuration**:
```json
{
  "SessionStart": [
    {
      "match": ".*",
      "command": "bash -c \"echo '[SessionStart] New session at $(date)' >> .claude/hooks/session.log\""
    }
  ]
}
```

**Use Cases**:
- Session tracking
- Environment validation
- Cache warming

### AgentTaskStart

**Fires when** an agent begins a task

**Purpose**: Agent workflow tracking

**Configuration**:
```json
{
  "AgentTaskStart": [
    {
      "match": ".*",
      "command": "bash -c \"echo '[AgentTaskStart] Agent: $CLAUDE_AGENT_NAME, Task: $CLAUDE_TASK_DESCRIPTION' >> .claude/hooks/agent-tasks.log\""
    }
  ]
}
```

**Environment Variables Available**:
- `$CLAUDE_AGENT_NAME` - Name of dispatched agent
- `$CLAUDE_TASK_DESCRIPTION` - Task description

**Use Cases**:
- Multi-agent workflow debugging
- Performance measurement
- Agent orchestration analysis

### AgentTaskComplete

**Fires when** an agent completes a task

**Purpose**: Agent performance tracking

**Configuration**:
```json
{
  "AgentTaskComplete": [
    {
      "match": ".*",
      "command": "bash -c \"echo '[AgentTaskComplete] Agent: $CLAUDE_AGENT_NAME, Duration: $CLAUDE_TASK_DURATION' >> .claude/hooks/agent-tasks.log\""
    }
  ]
}
```

**Environment Variables Available**:
- `$CLAUDE_AGENT_NAME` - Name of agent
- `$CLAUDE_TASK_DURATION` - Task execution time

**Use Cases**:
- Agent performance benchmarking
- Timeout optimization
- Cost tracking (for paid LLM agents)

## Hook File Location

All hooks defined in: `.claude-plugin/hooks/hooks.json`

After plugin install, hooks merge with project's `.claude/hooks.json` (if exists).

## Log Files

| Log File | Purpose | Location |
|----------|---------|----------|
| `debug.log` | PreToolUse tracking | `.claude/hooks/` |
| `format-errors.log` | Formatting failures | `.claude/hooks/` |
| `lint-errors.log` | Linting violations | `.claude/hooks/` |
| `conversation.log` | User prompts | `.claude/hooks/` |
| `session.log` | Session tracking | `.claude/hooks/` |
| `agent-tasks.log` | Agent workflow | `.claude/hooks/` |

## Disabling Hooks

**Temporary**: Set environment variable
```bash
export CLAUDE_HOOKS_ENABLED=false
```

**Permanent**: Remove from `hooks.json`
```json
{
  "PostToolUse": []  // Empty array = disabled
}
```

**Per-hook**: Comment out specific hook
```json
{
  "PostToolUse": [
    // {
    //   "match": "Write|Edit",
    //   "command": "..."
    // }
  ]
}
```

## Custom Hook Examples

### Pre-Commit Validation

```json
{
  "UserPromptSubmit": [
    {
      "match": ".*commit.*",
      "command": "bash -c \"cd /path/to/project && go test ./... && exit $?\""
    }
  ]
}
```

### Database Connection Check

```json
{
  "SessionStart": [
    {
      "match": ".*",
      "command": "bash -c \"pg_isready -h localhost -p 5432 || echo '⚠️ PostgreSQL not available'\""
    }
  ]
}
```

### MCP Server Health Check

```json
{
  "SessionStart": [
    {
      "match": ".*",
      "command": "bash -c \"for server in polygon-market-data pgvector-server; do node /path/to/mcp/$server/dist/index.js --health || echo \"⚠️ $server unhealthy\"; done\""
    }
  ]
}
```

## Performance Considerations

**Hook execution time** adds to overall latency:
- PreToolUse: ~10ms (logging only)
- PostToolUse: ~500ms (format + lint)
- SessionStart: ~100ms (health checks)

**Optimization tips**:
1. Use async background jobs for heavy operations
2. Cache results in `/tmp/` for repeated checks
3. Set timeouts on long-running hooks
4. Conditionally disable hooks in hot loops

## Debugging Hooks

### Enable Verbose Logging

```bash
export CLAUDE_HOOKS_DEBUG=true
```

### Test Hook Manually

```bash
# Replace environment variables manually
CLAUDE_FILE_PATH="backend/main.go" CLAUDE_TOOL_NAME="Write" bash -c '
if [[ "$CLAUDE_FILE_PATH" == *.go ]]; then
  gofmt -w "$CLAUDE_FILE_PATH"
fi
'
```

### Check Hook Execution

```bash
# View recent hook executions
tail -f .claude/hooks/debug.log

# Check for errors
cat .claude/hooks/format-errors.log
cat .claude/hooks/lint-errors.log
```

## Security Considerations

**Hook commands run with your user permissions** - validate:

1. **No malicious code** in hook commands
2. **No secret exposure** in environment variables
3. **No file traversal** attacks via `$CLAUDE_FILE_PATH`
4. **Command injection** protection (always quote variables)

**Example vulnerability**:
```bash
# ❌ VULNERABLE - command injection
command: "bash -c \"echo $CLAUDE_USER_MESSAGE >> log\""

# ✅ SAFE - properly quoted
command: "bash -c \"echo '$CLAUDE_USER_MESSAGE' >> log\""
```

## Related Documentation

- [Commands Reference](./commands.md)
- [Agent Definitions](./agents.md)
- [MCP Integration](./mcp-integration.md)
