#!/usr/bin/env node
// CO2 Status Line — composable wrapper
// Runs an existing statusline command (if configured), passes through its
// output, and appends a CO2/energy metrics line.
//
// Flags:
//   --wrap 'command'  Run an existing statusline first, show its output above
//   --track           Persist all-time totals to ~/.claude/co2-totals.json
//
// Usage in ~/.claude/settings.json:
//   "statusLine": {
//     "type": "command",
//     "command": "npx -y co2-status-line@latest --wrap 'node ~/.claude/hooks/gsd-statusline.js' --track"
//   }

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
	energyFromTokens,
	co2FromEnergy,
	formatTokens,
	formatEnergy,
	formatCO2,
} from './calculate.js';

// Parse CLI flags
function getFlag(argv, flag) {
	return argv.includes(flag);
}

function getFlagValue(argv, flag) {
	const idx = argv.indexOf(flag);
	if (idx !== -1 && idx + 1 < argv.length) {
		return argv[idx + 1];
	}
	return null;
}

// All-time tracking via ~/.claude/co2-totals.json
function getTotalsPath() {
	const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
	return path.join(claudeDir, 'co2-totals.json');
}

function readTotals() {
	try {
		return JSON.parse(fs.readFileSync(getTotalsPath(), 'utf8'));
	} catch {
		return { inputTokens: 0, outputTokens: 0, sessions: 0 };
	}
}

function writeTotals(totals) {
	try {
		fs.writeFileSync(getTotalsPath(), JSON.stringify(totals));
	} catch {
		// Silent fail — don't break statusline
	}
}

// Timeout guard: exit silently if stdin doesn't close within 3s
const stdinTimeout = setTimeout(() => process.exit(0), 3000);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
	clearTimeout(stdinTimeout);
	try {
		const data = JSON.parse(input);

		// Run wrapped statusline command if configured
		const wrappedCmd = getFlagValue(process.argv, '--wrap');
		if (wrappedCmd) {
			try {
				const wrappedOutput = execSync(wrappedCmd, {
					input,
					encoding: 'utf8',
					timeout: 2500,
					stdio: ['pipe', 'pipe', 'ignore'],
				});
				if (wrappedOutput.trim()) {
					process.stdout.write(wrappedOutput.trimEnd() + '\n');
				}
			} catch {
				// Wrapped command failed — continue with our line only
			}
		}

		const ctx = data.context_window ?? {};
		const sessionId = data.session_id ?? '';

		// Cumulative session totals
		const totalInput = ctx.total_input_tokens ?? 0;
		const totalOutput = ctx.total_output_tokens ?? 0;

		// Per-call cache breakdown (best we can get — not cumulative)
		const usage = ctx.current_usage ?? {};
		const cacheCreation = usage.cache_creation_input_tokens ?? 0;
		const cacheRead = usage.cache_read_input_tokens ?? 0;

		// Calculate session energy
		const energyWh = energyFromTokens({
			inputTokens: totalInput,
			outputTokens: totalOutput,
			cacheCreation,
			cacheRead,
		});

		const co2Grams = co2FromEnergy(energyWh);
		const totalTokens = totalInput + totalOutput;

		const DIM = '\x1b[2m';
		const RESET = '\x1b[0m';

		// Session line
		process.stdout.write(
			`${DIM}⚡${RESET} ${formatEnergy(energyWh)} ${DIM}│${RESET} ` +
			`${DIM}🌱${RESET} ${formatCO2(co2Grams)} CO2 ${DIM}│${RESET} ` +
			`${DIM}📊${RESET} ${formatTokens(totalTokens)} tokens`
		);

		// All-time tracking (opt-in via --track)
		if (getFlag(process.argv, '--track')) {
			const totals = readTotals();

			// Detect new session by comparing session_id
			if (totals._sessionId !== sessionId) {
				// New session — add previous session's tokens to all-time,
				// then start tracking this session
				if (totals._sessionId) {
					totals.inputTokens += totals._lastInput ?? 0;
					totals.outputTokens += totals._lastOutput ?? 0;
					totals.sessions += 1;
				}
				totals._sessionId = sessionId;
				totals._lastInput = 0;
				totals._lastOutput = 0;
			}

			// Update current session snapshot
			totals._lastInput = totalInput;
			totals._lastOutput = totalOutput;
			writeTotals(totals);

			// Calculate all-time (completed sessions + current)
			const allInput = totals.inputTokens + totalInput;
			const allOutput = totals.outputTokens + totalOutput;
			const allTokens = allInput + allOutput;
			const allEnergy = energyFromTokens({
				inputTokens: allInput,
				outputTokens: allOutput,
			});
			const allCO2 = co2FromEnergy(allEnergy);
			const sessionCount = totals.sessions + 1;

			process.stdout.write(
				`\n${DIM}∑ ${formatEnergy(allEnergy)} │ ${formatCO2(allCO2)} CO2 │ ` +
				`${formatTokens(allTokens)} tokens │ ${sessionCount} sessions${RESET}`
			);
		}
	} catch {
		// Silent fail — don't break statusline on parse errors
	}
});
