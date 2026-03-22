---
name: update
description: Update CO2 status line to latest version with changelog display
allowed-tools:
  - Bash
  - AskUserQuestion
---

<objective>
Check for CO2 status line updates via GitHub, display changelog, obtain user
confirmation, and execute update.
</objective>

<process>

<step name="get_installed_version">
Read the plugin's package.json for the installed version:

```bash
node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('${CLAUDE_PLUGIN_ROOT}/package.json','utf8')).version)"
```

If that fails, fall back to VERSION file or treat as 0.0.0.
</step>

<step name="check_latest_version">
Check GitHub for latest version:

```bash
curl -sL https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/package.json | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).version))"
```

If check fails, show offline message and exit.
</step>

<step name="compare_versions">
Compare installed vs latest:

**If installed == latest:**
```
## CO2 Status Line Update

**Installed:** X.Y.Z
**Latest:** X.Y.Z

You're already on the latest version.
```
Exit.

**If installed > latest:** Show "ahead of latest" message and exit.
</step>

<step name="show_changes_and_confirm">
If update available, fetch and show changelog BEFORE updating:

```bash
curl -sL https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/CHANGELOG.md
```

Extract entries between installed and latest versions. Display preview and ask:

Use AskUserQuestion:
- Question: "Proceed with update?"
- Options:
  - "Yes, update now"
  - "No, cancel"

If user cancels, exit.
</step>

<step name="run_update">
Update the plugin:

```bash
claude plugin update co2-status-line
```

Clear the update cache:

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
rm -f "${CLAUDE_DIR}/cache/co2-update-check.json"
```
</step>

<step name="display_result">
```
CO2 Status Line updated to vX.Y.Z

Restart Claude Code to pick up the changes.
```
</step>

</process>
