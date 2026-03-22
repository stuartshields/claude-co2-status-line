<purpose>
Check for CO2 status line updates via GitHub, display changelog for versions between installed and latest, obtain user confirmation, and execute update with cache clearing.
</purpose>

<process>

<step name="get_installed_version">
Detect installed version by reading the VERSION file:

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
VERSION_FILE="${CLAUDE_DIR}/statusline/co2/VERSION"

if [ -f "$VERSION_FILE" ] && grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+' "$VERSION_FILE"; then
  cat "$VERSION_FILE"
else
  echo "UNKNOWN"
fi
```

Parse output:
- If a valid semver: installed version
- If "UNKNOWN": treat as version 0.0.0

**If VERSION file missing:**
```
## CO2 Status Line Update

**Installed version:** Unknown

Your installation doesn't include version tracking.

Running fresh install...
```

Proceed to install step (treat as version 0.0.0 for comparison).
</step>

<step name="check_latest_version">
Check GitHub for latest version (avoids npm registry cache issues):

```bash
curl -sL https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/package.json | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).version))"
```

**If check fails:**
```
Couldn't check for updates (offline or GitHub unavailable).

To update manually: `curl -sL https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/install.sh | bash`
```

Exit.
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

**If installed > latest:**
```
## CO2 Status Line Update

**Installed:** X.Y.Z
**Latest:** A.B.C

You're ahead of the latest release (development version?).
```

Exit.
</step>

<step name="show_changes_and_confirm">
**If update available**, fetch and show what's new BEFORE updating:

1. Fetch changelog from GitHub raw URL:
```bash
curl -sL https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/CHANGELOG.md
```

2. Extract entries between installed and latest versions
3. Display preview and ask for confirmation:

```
## CO2 Status Line Update Available

**Installed:** 1.0.2
**Latest:** 1.1.0

### What's New
────────────────────────────────────────────────────────────

## [1.1.0] - 2026-03-22

### Changed
- Switched from npx to local installation

────────────────────────────────────────────────────────────

⚠️  **Note:** The installer performs a clean install:
- `statusline/co2/` will be wiped and replaced
- `commands/co2/` will be wiped and replaced

Your custom files are preserved:
- Custom commands not in `commands/co2/` ✓
- Custom hooks ✓
- Your CLAUDE.md files ✓
- co2-totals.json (tracking data) ✓
```

Use AskUserQuestion:
- Question: "Proceed with update?"
- Options:
  - "Yes, update now"
  - "No, cancel"

**If user cancels:** Exit.
</step>

<step name="run_update">
Run the installer from GitHub:

```bash
curl -sL https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/install.sh | bash
```

Capture output. If install fails, show error and exit.

Clear the update cache so any statusline indicator disappears:

```bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
rm -f "${CLAUDE_DIR}/cache/co2-update-check.json"
```
</step>

<step name="display_result">
Format completion message (changelog was already shown in confirmation step):

```
╔═══════════════════════════════════════════════════════════╗
║  CO2 Status Line Updated: v1.0.2 → v1.1.0                ║
╚═══════════════════════════════════════════════════════════╝

⚠️  Restart Claude Code to pick up the changes.

[View full changelog](https://github.com/stuartshields/claude-co2-status-line/blob/main/CHANGELOG.md)
```
</step>

</process>

<success_criteria>
- [ ] Installed version read correctly
- [ ] Latest version checked via GitHub
- [ ] Update skipped if already current
- [ ] Changelog fetched and displayed BEFORE update
- [ ] Clean install warning shown
- [ ] User confirmation obtained
- [ ] Update executed successfully
- [ ] Restart reminder shown
</success_criteria>
