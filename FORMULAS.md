# Energy & CO2 Estimation Formulas

All constants and formulas used in this plugin, with source citations.

## Energy Per Token

Derived by Simon P. Couch from Epoch AI's ChatGPT-4o energy analysis.
The method back-solves per-token energy rates from total query energy using
the formula: `input_rate = Total_Wh / (input_tokens + 5 × output_tokens)`.

| Token Type       | Rate (Wh/MTok) | Rate (Wh/token)   |
|------------------|-----------------|--------------------|
| Input            | 390             | 0.000390           |
| Output           | 1,950           | 0.001950           |
| Cache Creation   | 490             | 0.000490           |
| Cache Read       | 39              | 0.000039           |

The 5:1 output-to-input energy ratio is derived from Anthropic's API pricing
ratios. Couch acknowledges this is "pretty silly" but it's the best available
proxy — frontier labs don't publish per-token energy data.

### Sources

- Simon P. Couch, "Estimating the Environmental Impact of Claude Code"
  https://www.simonpcouch.com/blog/2026-01-20-cc-impact/
  Accessed: 2026-03-22

- Josh You / Epoch AI, "How much energy does ChatGPT use?"
  https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
  Accessed: 2026-03-22

## CO2 from Energy

### Carbon Intensity

| Source                      | Value (g CO2/kWh) | Notes                        |
|-----------------------------|--------------------|------------------------------|
| US grid average (EIA 2023)  | 367                | 0.81 lbs/kWh converted       |
| Data center average (2024)  | 548                | Higher due to fossil-heavy regions |

**Default used: 548 g CO2/kWh** — data center average, because AI inference
runs in data centers which skew toward carbon-intensive grid regions.

### Sources

- US EIA, "How much carbon dioxide is produced per kilowatthour?"
  https://www.eia.gov/tools/faqs/faq.php?id=74&t=11
  Accessed: 2026-03-22

- ScienceDirect, "The carbon and water footprints of data centers"
  https://www.sciencedirect.com/science/article/pii/S2666389925002788
  Accessed: 2026-03-22

## Combined Formula

```
energy_wh = (input_tokens × 390 + output_tokens × 1950 +
             cache_creation × 490 + cache_read × 39) / 1_000_000

co2_grams = energy_wh × 548 / 1000
```

## Caveats

1. **Not Claude-specific.** Energy rates are derived from ChatGPT-4o data.
   No frontier lab publishes per-token energy consumption for their models.

2. **Order-of-magnitude estimates.** The 5:1 output/input energy ratio is
   inferred from pricing, not measured. SemiAnalysis suggests the true ratio
   may be as high as 15:1 at small context sizes.

3. **Carbon intensity varies by region.** 548 g/kWh is an average across
   US data centers. Individual facilities range from ~50 (hydro-powered)
   to ~900+ (coal-heavy grids).

4. **PUE not separately applied.** The Epoch AI figures are estimated to
   include data center overhead (PUE ~1.1-1.3) in the total energy figure.

5. **Cache token tracking is approximate.** Claude Code exposes cumulative
   input/output totals but only per-call cache breakdowns. We use the
   cumulative totals with input/output rates as the primary calculation.
