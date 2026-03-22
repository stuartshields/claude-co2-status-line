# CO2 Status Line Plugin

Claude Code plugin that displays cumulative token usage,
energy estimate, CO2 equivalent, and water usage for the current session.

## Stack

- Node.js (ES Modules)
- No build step — plain JS
- `node:test` for testing
- Claude Code plugin system (`.claude-plugin/plugin.json`)

## Commands

- Test: `node --test 'tests/*.test.js'`
- Run manually: `echo '{"context_window":{"total_input_tokens":100000,"total_output_tokens":5000},"model":{"display_name":"Opus"}}' | node src/statusline.js`

## Installation

### Plugin install (recommended)

```
/plugin install co2-status-line
```

Then run `/co2-status-line:setup` to configure your statusline setting.

### Composing with an existing statusline

`/co2-status-line:setup` detects existing statuslines and offers to wrap them.
The `--wrap` flag runs your existing statusline first, then appends CO2 metrics
on line 2. Works with GSD, claude-hud, or any other statusline script.

### Uninstall

```
/plugin uninstall co2-status-line
```

### Updating

Run `/co2-status-line:update` inside Claude Code.

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

- `.claude-plugin/plugin.json` — Plugin manifest
- `src/calculate.js` — Pure calculation functions + constants
- `src/statusline.js` — Status line script (reads stdin JSON, outputs formatted line)
- `src/update-check.js` — SessionStart hook for background update checking
- `skills/setup/SKILL.md` — `/co2-status-line:setup` skill (configures statusline setting)
- `skills/update/SKILL.md` — `/co2-status-line:update` skill (check + apply updates)
- `hooks/hooks.json` — Plugin hooks (SessionStart for update checking)
- `tests/calculate.test.js` — Tests for calculation functions
- `CHANGELOG.md` — Version history
- `FORMULAS.md` — All formulas, constants, and source citations

## Conventions

- All energy/CO2 constants must reference FORMULAS.md
- Constants are named exports for auditability
- Indentation: tabs
