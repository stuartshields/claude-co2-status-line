#!/usr/bin/env bash
# CO2 Status Line — installer
# Usage: curl -sL https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/install.sh | bash
#
# Flags:
#   --uninstall   Remove CO2 status line files and settings
#   --wrap 'cmd'  Set a wrapped statusline command (e.g. GSD statusline)

set -euo pipefail

REPO="stuartshields/claude-co2-status-line"
BRANCH="main"
RAW_BASE="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
INSTALL_DIR="${CLAUDE_DIR}/statusline/co2"
VERSION_FILE="${INSTALL_DIR}/VERSION"
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
COMMANDS_DIR="${CLAUDE_DIR}/commands/co2"
WORKFLOW_DIR="${INSTALL_DIR}/workflows"

# Parse flags
UNINSTALL=false
WRAP_CMD=""
while [ $# -gt 0 ]; do
	case "$1" in
		--uninstall) UNINSTALL=true; shift ;;
		--wrap) WRAP_CMD="${2:-}"; shift 2 ;;
		*) shift ;;
	esac
done

# --- Uninstall ---
if [ "$UNINSTALL" = true ]; then
	echo "Removing CO2 status line..."
	rm -rf "$INSTALL_DIR"
	rm -rf "$COMMANDS_DIR"
	rm -f "${CLAUDE_DIR}/cache/co2-update-check.json"
	# Remove SessionStart hook from settings.json
	if [ -f "$SETTINGS_FILE" ] && command -v node >/dev/null 2>&1; then
		node -e "
			const fs = require('fs');
			const s = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8'));
			if (s.hooks?.SessionStart) {
				s.hooks.SessionStart = s.hooks.SessionStart.filter(h =>
					!JSON.stringify(h).includes('co2-update-check.js')
				);
			}
			// Remove statusLine if it points to our script
			if (s.statusLine?.command?.includes('statusline/co2/')) {
				delete s.statusLine;
			}
			fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(s, null, 2));
		"
	fi
	echo "✓ CO2 status line removed"
	exit 0
fi

# --- Install ---
echo "Installing CO2 status line..."

# Create directories
mkdir -p "$INSTALL_DIR" "$COMMANDS_DIR" "$WORKFLOW_DIR" "${CLAUDE_DIR}/cache"

# Download source files
echo "  Downloading source files..."
curl -sL "${RAW_BASE}/src/calculate.js" -o "${INSTALL_DIR}/calculate.js"
curl -sL "${RAW_BASE}/src/statusline.js" -o "${INSTALL_DIR}/statusline.js"
curl -sL "${RAW_BASE}/src/update-check.js" -o "${INSTALL_DIR}/update-check.js"

# Download version
curl -sL "${RAW_BASE}/package.json" | node -e "
	let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
		process.stdout.write(JSON.parse(d).version);
	});
" > "$VERSION_FILE"

# Download command and workflow
curl -sL "${RAW_BASE}/commands/co2/update.md" -o "${COMMANDS_DIR}/update.md"
curl -sL "${RAW_BASE}/workflows/update.md" -o "${WORKFLOW_DIR}/update.md"

echo "  ✓ Files installed to ${INSTALL_DIR}"

# Build statusline command
STATUSLINE_CMD="node \"${INSTALL_DIR}/statusline.js\""
if [ -n "$WRAP_CMD" ]; then
	STATUSLINE_CMD="${STATUSLINE_CMD} --wrap '${WRAP_CMD}'"
fi

# Update settings.json
if command -v node >/dev/null 2>&1; then
	node -e "
		const fs = require('fs');
		const settingsFile = '$SETTINGS_FILE';
		let s = {};
		try { s = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch {}

		// Set statusLine
		s.statusLine = {
			type: 'command',
			command: $(node -e "process.stdout.write(JSON.stringify('$STATUSLINE_CMD'))")
		};

		// Add SessionStart hook for update check (if not already present)
		if (!s.hooks) s.hooks = {};
		if (!s.hooks.SessionStart) s.hooks.SessionStart = [];
		const hookCmd = 'node \"${INSTALL_DIR}/update-check.js\"';
		const hasHook = s.hooks.SessionStart.some(h =>
			JSON.stringify(h).includes('co2-update-check.js')
		);
		if (!hasHook) {
			s.hooks.SessionStart.push({
				hooks: [{
					type: 'command',
					command: hookCmd
				}]
			});
		}

		fs.writeFileSync(settingsFile, JSON.stringify(s, null, 2));
	"
	echo "  ✓ settings.json updated"
else
	echo "  ⚠ Node.js not found — update settings.json manually:"
	echo "    statusLine.command = ${STATUSLINE_CMD}"
fi

INSTALLED_VERSION=$(cat "$VERSION_FILE")
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  CO2 Status Line v${INSTALLED_VERSION} installed                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Restart Claude Code to activate."
echo "Update anytime with: /co2:update"
