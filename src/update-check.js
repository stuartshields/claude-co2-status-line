#!/usr/bin/env node
// Check for CO2 status line updates in background, write result to cache
// Called by SessionStart hook — runs once per session

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, '..');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const cacheDir = path.join(claudeDir, 'cache');
const cacheFile = path.join(cacheDir, 'co2-update-check.json');

// Read version from plugin's package.json
const packageJsonPath = path.join(pluginRoot, 'package.json');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
	fs.mkdirSync(cacheDir, { recursive: true });
}

// Run check in background (non-blocking)
const child = spawn(process.execPath, ['-e', `
	const fs = require('fs');
	const https = require('https');

	const cacheFile = ${JSON.stringify(cacheFile)};
	const packageJsonPath = ${JSON.stringify(packageJsonPath)};

	// Read installed version from package.json
	let installed = '0.0.0';
	try {
		const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
		installed = pkg.version || '0.0.0';
	} catch (e) {}

	// Check latest version from GitHub
	function checkLatest() {
		return new Promise((resolve) => {
			const url = 'https://raw.githubusercontent.com/stuartshields/claude-co2-status-line/main/package.json';
			https.get(url, { timeout: 10000 }, (res) => {
				let data = '';
				res.on('data', c => data += c);
				res.on('end', () => {
					try {
						resolve(JSON.parse(data).version);
					} catch { resolve(null); }
				});
			}).on('error', () => resolve(null));
		});
	}

	checkLatest().then(latest => {
		const result = {
			update_available: latest && installed !== latest,
			installed,
			latest: latest || 'unknown',
			checked: Math.floor(Date.now() / 1000)
		};
		fs.writeFileSync(cacheFile, JSON.stringify(result));
	});
`], {
	stdio: 'ignore',
	detached: true
});

child.unref();
