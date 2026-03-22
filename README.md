# Claude CO2 Status Line

A Claude Code status line plugin that displays cumulative energy usage and CO2 estimates for your session.

```
⚡ 25.4 Wh │ 🌱 13.9g CO2 │ 📊 53.0k tokens
```

## How it works

After each interaction, the status line shows three metrics:

- **Energy (Wh)** — estimated electricity consumed by the LLM inference
- **CO2 (g)** — estimated carbon emissions based on data center grid intensity
- **Tokens** — cumulative input + output tokens for the session

All numbers are cumulative across the session and update after each assistant message.

## Napkin math

The energy estimates are based on napkin math — not precise measurements. Frontier labs don't publish per-token energy data, so the figures are derived from publicly available research:

**Energy per token** is derived from [Epoch AI's analysis of ChatGPT energy usage](https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use) (Josh You, 2025), as applied to Claude Code by Simon P. Couch in ["Estimating the Environmental Impact of Claude Code"](https://www.simonpcouch.com/blog/2026-01-20-cc-impact/).

The Epoch AI methodology works like this:

1. They estimated total energy per ChatGPT-4o query across different context lengths, using publicly available data on GPU hardware (H100s), data center PUE, and inference throughput benchmarks.
2. For a maximum-context query (~100k input tokens, ~530 output tokens), the total energy is approximately **40 Wh**.
3. Couch then back-solves for per-token rates using the formula: `input_rate = Total_Wh / (input_tokens + 5 × output_tokens)`.
4. The **5:1 output-to-input ratio** comes from Anthropic's API pricing (output tokens cost 5x input tokens). This is used as a proxy for the energy ratio — Couch acknowledges this is "pretty silly" but it's the best available approach since frontier labs don't publish actual per-token energy consumption.
5. Cache token rates are derived similarly from Anthropic's cache pricing multipliers relative to standard input pricing.

| Token type     | Wh per million tokens | Derivation |
|----------------|----------------------:|------------|
| Input          | 390                   | Base rate from Epoch AI back-calculation |
| Output         | 1,950                 | 5x input (from API pricing ratio) |
| Cache creation | 490                   | 1.25x input (from cache write pricing) |
| Cache read     | 39                    | 0.1x input (from cache read pricing) |

**CO2 per kWh** uses the US data center average of **548 g CO2/kWh**, sourced from a [2024 ScienceDirect study of 1,795 US data centers](https://www.sciencedirect.com/science/article/pii/S2666389925002788). This is significantly higher than the national grid average of 367 g/kWh ([US EIA, 2023 data](https://www.eia.gov/tools/faqs/faq.php?id=74&t=11)) because data centers tend to cluster in regions with carbon-intensive power grids — 56% of US data center electricity came from fossil fuels in the 2023-2024 period.

For full details on every constant, formula, and source citation, see [FORMULAS.md](./FORMULAS.md).

### What this means in practice

A typical Claude Code session (~100k input tokens, ~500 output tokens) uses roughly **40 Wh** and emits about **22g of CO2** — comparable to charging a phone halfway, or driving a car about 100 meters.

These are order-of-magnitude estimates. The actual numbers depend on model architecture, hardware, data center location, and many other factors that aren't publicly known.

## Install

### Via npx (recommended)

Add to your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y claude-co2-status-line@latest"
  }
}
```

### Composing with an existing statusline

Already have a statusline (GSD, claude-hud, etc.)? Use `--wrap` to keep it and add CO2 metrics as a second line:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y claude-co2-status-line@latest --wrap 'your-existing-statusline-command'"
  }
}
```

Example with GSD statusline:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y claude-co2-status-line@latest --wrap 'node ~/.claude/hooks/gsd-statusline.js'"
  }
}
```

The wrapped command's output appears on line 1, CO2 metrics on line 2. If the wrapped command fails, only the CO2 line is shown.

### All-time tracking (opt-in)

Add `--track` to persist cumulative totals across sessions. Totals are stored in `~/.claude/co2-totals.json` and shown as a second line below the session metrics:

```
⚡ 25.4 Wh │ 🌱 13.9g CO2 │ 📊 53.0k tokens
∑ 1.2 kWh │ 687.4g CO2 │ 2.4M tokens │ 14 sessions
```

Combine with any other flags:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y claude-co2-status-line@latest --track --wrap 'your-existing-statusline-command'"
  }
}
```

Without `--track`, only session metrics are shown and nothing is written to disk.

### Local install

Clone the repo and point to it directly:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"/path/to/claude-co2-status-line/src/statusline.js\""
  }
}
```

## Development

```bash
# Run tests
npm test

# Test with mock data
echo '{"context_window":{"total_input_tokens":100000,"total_output_tokens":5000},"model":{"display_name":"Opus"}}' | node src/statusline.js
```

## License

MIT
