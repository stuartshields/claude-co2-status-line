# CO2 Status Line Plugin

Claude Code status line plugin that displays cumulative token usage,
energy estimate, and CO2 equivalent for the current session.

## Stack

- Node.js (ES Modules)
- No build step — plain JS
- `node:test` for testing

## Commands

- Test: `node --test 'tests/*.test.js'`
- Run manually: `echo '{"context_window":{"total_input_tokens":100000,"total_output_tokens":5000},"model":{"display_name":"Opus"}}' | node src/statusline.js`

## Installation

### Via npx (zero-install, recommended for other users)

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y claude-co2-status-line@latest"
  }
}
```

### Composing with an existing statusline

Use `--wrap` to run any existing statusline command first, then append the
CO2 line below it. Works with GSD, claude-hud, or any other statusline script:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y claude-co2-status-line@latest --wrap 'your-existing-statusline-command'"
  }
}
```

The wrapped command receives the same stdin JSON. Its output appears on
line 1, CO2 metrics on line 2. If the wrapped command fails, only the
CO2 line is shown.

### Local development

Point directly to the source for development:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"/path/to/claude-co2-status-line/src/statusline.js\""
  }
}
```

## Structure

- `src/calculate.js` — Pure calculation functions + constants
- `src/statusline.js` — Status line script (reads stdin JSON, outputs formatted line)
- `tests/calculate.test.js` — Tests for calculation functions
- `FORMULAS.md` — All formulas, constants, and source citations

## Conventions

- All energy/CO2 constants must reference FORMULAS.md
- Constants are named exports for auditability
- Indentation: tabs
