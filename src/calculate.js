// Energy and CO2 estimation constants
// All values documented in FORMULAS.md with source citations

// Energy rates: Wh per million tokens
// Source: Simon P. Couch / Epoch AI (see FORMULAS.md)
export const WH_PER_MTOK_INPUT = 390;
export const WH_PER_MTOK_OUTPUT = 1950;
export const WH_PER_MTOK_CACHE_CREATE = 490;
export const WH_PER_MTOK_CACHE_READ = 39;

// Carbon intensity: grams CO2 per kWh
// Source: ScienceDirect 2024, US data center average (see FORMULAS.md)
export const CO2_GRAMS_PER_KWH = 548;

// Water usage constants for LLM inference
// Source: "How Hungry is AI?" (2025), Azure infrastructure (see FORMULAS.md)
export const WUE_SITE = 0.30;    // L/kWh - on-site cooling water
export const WUE_SOURCE = 3.142; // L/kWh - off-site water (electricity generation)
export const PUE = 1.12;         // Power Usage Effectiveness

/**
 * Estimate energy consumption from token counts.
 * @param {object} tokens
 * @param {number} tokens.inputTokens
 * @param {number} [tokens.outputTokens=0]
 * @param {number} [tokens.cacheCreation=0]
 * @param {number} [tokens.cacheRead=0]
 * @returns {number} Energy in Wh
 */
export function energyFromTokens({
	inputTokens = 0,
	outputTokens = 0,
	cacheCreation = 0,
	cacheRead = 0,
} = {}) {
	return (
		inputTokens * WH_PER_MTOK_INPUT +
		outputTokens * WH_PER_MTOK_OUTPUT +
		cacheCreation * WH_PER_MTOK_CACHE_CREATE +
		cacheRead * WH_PER_MTOK_CACHE_READ
	) / 1_000_000;
}

/**
 * Estimate CO2 emissions from energy consumption.
 * @param {number} wh - Energy in watt-hours
 * @returns {number} CO2 in grams
 */
export function co2FromEnergy(wh) {
	return wh * CO2_GRAMS_PER_KWH / 1000;
}

/**
 * Estimate water consumption from energy usage.
 * Uses on-site cooling + off-site electricity generation water.
 * @param {number} wh - Energy in watt-hours
 * @returns {number} Water in litres
 */
export function waterFromEnergy(wh) {
	const kwh = wh / 1000;
	return (kwh / PUE) * WUE_SITE + kwh * WUE_SOURCE;
}

/**
 * Format water for display.
 * @param {number} litres
 * @returns {string} e.g. "136ml", "3.4L"
 */
export function formatWater(litres) {
	if (litres >= 1) return `${litres.toFixed(1)}L`;
	const ml = Math.round(litres * 1000);
	return `${ml}ml`;
}

/**
 * Format token count for display.
 * @param {number} n - Token count
 * @returns {string} e.g. "500", "12.4k", "1.2M"
 */
export function formatTokens(n) {
	if (n === 0) return '0';
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return `${n}`;
}

/**
 * Format energy for display.
 * @param {number} wh - Energy in watt-hours
 * @returns {string} e.g. "0.3 Wh", "41.2 Wh", "1.3 kWh"
 */
export function formatEnergy(wh) {
	if (wh >= 1000) return `${(wh / 1000).toFixed(1)} kWh`;
	return `${wh.toFixed(1)} Wh`;
}

/**
 * Format CO2 for display.
 * @param {number} g - CO2 in grams
 * @returns {string} e.g. "0.2g", "22.5g", "1.5kg"
 */
export function formatCO2(g) {
	if (g >= 1000) return `${(g / 1000).toFixed(1)}kg`;
	return `${g.toFixed(1)}g`;
}
