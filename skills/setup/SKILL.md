---
name: setup
description: Configure the CO2 status line in your Claude Code settings. Run this after installing the plugin.
allowed-tools:
  - Bash
  - Read
  - Edit
  - AskUserQuestion
---

<objective>
Configure the user's statusLine setting to use the CO2 status line plugin.
Detect any existing statusline and offer to wrap it.
</objective>

<process>

**Step 1 — Read current settings:**

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
cat "${CLAUDE_DIR}/settings.json" 2>/dev/null || echo "{}"
```

Check if `statusLine` is already configured.

**Step 2 — Determine setup mode:**

If NO existing statusLine (or it already points to co2-status-line):
- Set the statusLine command directly, no wrapping needed.

If an existing statusLine IS configured (and it's not co2-status-line):
- Show the user what's currently configured.
- Ask via AskUserQuestion:
  - "Wrap existing statusline" — keeps their current statusline on line 1, adds CO2 on line 2
  - "Replace existing statusline" — CO2 only
  - "Cancel" — exit without changes

**Step 3 — Build the command:**

Base command (no wrapping):
```
node "${CLAUDE_PLUGIN_ROOT}/src/statusline.js"
```

With wrapping (use their existing command):
```
node "${CLAUDE_PLUGIN_ROOT}/src/statusline.js" --wrap '<their existing command>'
```

**Step 4 — Update settings.json:**

Use Edit to update the `statusLine` key in `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "<built command from step 3>"
  }
}
```

**Step 5 — Confirm:**

```
CO2 Status Line configured.

Restart Claude Code to activate.
```

</process>
