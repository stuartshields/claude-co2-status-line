# Claude CO2 Status Line

A Claude Code plugin that shows how much energy, CO2, and water your session is burning through.

```
⚡ 40.0 Wh │ 🌱 21.9g CO2 │ 💧 137ml │ 📊 100.5k tokens
```

## How it works

After each interaction, the status line shows four things:

- **Energy (Wh)** - estimated electricity used by the LLM inference
- **CO2 (g)** - estimated carbon emissions based on data center grid intensity
- **Water (ml)** - estimated water for cooling and electricity generation
- **Tokens** - cumulative input + output tokens for the session

Numbers accumulate across the session and update after each assistant message.

## Install

### Plugin install (recommended)

```
/plugin marketplace add stuartshields/claude-co2-status-line
/plugin install co2-status-line@claude-co2-status-line
```

Then run the setup skill to configure your statusline:

```
/co2-status-line:setup
```

The setup skill detects any existing statusline and offers to wrap it (keeping your current statusline on line 1, CO2 metrics on line 2).

### Composing with an existing statusline

`/co2-status-line:setup` handles this automatically — it detects your existing statusline (GSD, claude-hud, etc.) and offers to wrap it using the `--wrap` flag. The wrapped command's output shows on line 1, CO2 metrics on line 2. If the wrapped command fails, you still get the CO2 line.

### All-time tracking (opt-in)

Add `--track` to the statusline command in `~/.claude/settings.json` after setup:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"<plugin-path>/src/statusline.js\" --track"
  }
}
```

Totals get saved to `~/.claude/co2-totals.json` and show up as a second line:

```
⚡ 25.4 Wh │ 🌱 13.9g CO2 │ 💧 87ml │ 📊 53.0k tokens
∑ 1.2 kWh │ 687.4g CO2 │ 4.1L │ 2.4M tokens │ 14 sessions
```

Without `--track`, it's session-only and nothing hits disk.

### Updating

Run `/co2-status-line:update` inside Claude Code.

### Uninstall

```
/plugin uninstall co2-status-line@claude-co2-status-line
```

Then remove the `statusLine` entry from `~/.claude/settings.json`.

### Local development

Clone the repo and load it directly:

```bash
claude --plugin-dir ./claude-co2-status-line
```

Or point your statusline at the source:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"/path/to/claude-co2-status-line/src/statusline.js\""
  }
}
```

## Napkin math

These are napkin math estimates, not precise measurements. Frontier labs don't publish per-token energy data, so the figures come from publicly available research.

**Energy per token** comes from [Epoch AI's analysis of ChatGPT energy usage](https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use) (Josh You, 2025), adapted for Claude Code by Simon P. Couch in ["Estimating the Environmental Impact of Claude Code"](https://www.simonpcouch.com/blog/2026-01-20-cc-impact/).

Here's how the Epoch AI methodology works:

1. They estimated total energy per ChatGPT-4o query across different context lengths, using public data on GPU hardware (H100s), data center PUE, and inference throughput benchmarks.
2. For a max-context query (~100k input tokens, ~530 output tokens), total energy comes out to roughly **40 Wh**.
3. Couch back-solves for per-token rates using: `input_rate = Total_Wh / (input_tokens + 5 x output_tokens)`.
4. The **5:1 output-to-input ratio** comes from Anthropic's API pricing (output tokens cost 5x input tokens). It's a proxy for the energy ratio. Couch calls this "pretty silly" but it's the best we've got since no frontier lab publishes actual per-token energy numbers.
5. Cache token rates use the same idea, derived from Anthropic's cache pricing multipliers.

| Token type     | Wh per million tokens | Where it comes from |
|----------------|----------------------:|---------------------|
| Input          | 390                   | Base rate, back-calculated from Epoch AI |
| Output         | 1,950                 | 5x input (API pricing ratio) |
| Cache creation | 490                   | 1.25x input (cache write pricing) |
| Cache read     | 39                    | 0.1x input (cache read pricing) |

**CO2 per kWh** uses **548 g CO2/kWh**, the US data center average from a [2024 ScienceDirect study of 1,795 data centers](https://www.sciencedirect.com/science/article/pii/S2666389925002788). That's a lot higher than the national grid average of 367 g/kWh ([US EIA, 2023](https://www.eia.gov/tools/faqs/faq.php?id=74&t=11)) because data centers tend to sit in regions with dirtier power. About 56% of US data center electricity came from fossil fuels in 2023-2024.

**Water per kWh** uses constants from ["How Hungry is AI?"](https://arxiv.org/html/2505.09598v1) (2025), a paper that benchmarked 30 LLMs including Claude 3.7 Sonnet. Water consumption has two parts: on-site cooling (0.30 L/kWh) and off-site water used to generate the electricity (3.142 L/kWh, US average). The electricity generation side is about 92% of the total.

The water constants come from Azure infrastructure. Anthropic runs on AWS and GCP, which report slightly different on-site WUE numbers (AWS is lower at 0.18 L/kWh). But since off-site water dominates, the cloud provider difference is small. Also, the paper tested Claude 3.7 Sonnet - we're now on Claude 4.5/4.6. The water formula takes energy as input though, so if the energy estimate is in the right ballpark, the water estimate follows.

Full details on every constant, formula, and source URL in [FORMULAS.md](./FORMULAS.md).

### In practice

A typical Claude Code session (~100k input tokens, ~500 output tokens) uses about **40 Wh**, produces roughly **22g of CO2**, and consumes about **137ml of water**. That's like charging your phone halfway, or about a third of a bottle of water.

These are order-of-magnitude numbers. The real figures depend on model architecture, hardware, data center location, and plenty of other stuff that isn't public.

## Development

```bash
# Run tests
npm test

# Test with mock data
echo '{"context_window":{"total_input_tokens":100000,"total_output_tokens":5000},"model":{"display_name":"Opus"}}' | node src/statusline.js
```

## License

MIT
