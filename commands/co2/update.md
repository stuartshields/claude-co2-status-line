---
name: co2:update
description: Update CO2 status line to latest version with changelog display
allowed-tools:
  - Bash
  - AskUserQuestion
---

<objective>
Check for CO2 status line updates, install if available, and display what changed.

Routes to the update workflow which handles:
- Version detection
- GitHub version checking
- Changelog fetching and display
- User confirmation
- Update execution and cache clearing
- Restart reminder
</objective>

<execution_context>
@workflows/update.md (relative to the co2 install directory)
</execution_context>

<process>
**Follow the update workflow** from the co2 install directory's `workflows/update.md`.

The workflow handles all logic including:
1. Installed version detection
2. Latest version checking via GitHub
3. Version comparison
4. Changelog fetching and extraction
5. User confirmation
6. Update execution (re-runs install.sh)
7. Cache clearing
</process>
