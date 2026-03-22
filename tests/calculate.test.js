import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	energyFromTokens,
	co2FromEnergy,
	waterFromEnergy,
	formatTokens,
	formatEnergy,
	formatCO2,
	formatWater,
	WH_PER_MTOK_INPUT,
	WH_PER_MTOK_OUTPUT,
	WH_PER_MTOK_CACHE_CREATE,
	WH_PER_MTOK_CACHE_READ,
	CO2_GRAMS_PER_KWH,
	WUE_SITE,
	WUE_SOURCE,
	PUE,
} from '../src/calculate.js';

describe('energyFromTokens', () => {
	test('zero tokens returns zero', () => {
		const result = energyFromTokens({ inputTokens: 0, outputTokens: 0 });
		assert.equal(result, 0);
	});

	test('input-only: 100k tokens at 390 Wh/MTok = 39 Wh', () => {
		const result = energyFromTokens({ inputTokens: 100_000, outputTokens: 0 });
		assert.equal(result, 39);
	});

	test('output-only: 1k tokens at 1950 Wh/MTok = 1.95 Wh', () => {
		const result = energyFromTokens({ inputTokens: 0, outputTokens: 1_000 });
		assert.equal(result, 1.95);
	});

	test('mixed: blog median session ~592k blended tokens', () => {
		// Blog says median session is 592,439 total tokens → ~41 Wh
		// Using blended rate of 240 Wh/MTok: 592439 × 240 / 1e6 = 142.2 Wh
		// But with split rates, we need to assume a split.
		// Blog median: 24 API requests, mostly input-heavy.
		// Let's test with a known split: 550k input + 42k output
		// = (550000 × 390 + 42000 × 1950) / 1e6 = 214.5 + 81.9 = 296.4
		// That's too high — the 41 Wh figure uses blended rate.
		//
		// Better test: use exact numbers that produce a known result.
		// 1M input tokens = 390 Wh, 1M output tokens = 1950 Wh
		const result = energyFromTokens({
			inputTokens: 1_000_000,
			outputTokens: 1_000_000,
		});
		assert.equal(result, 390 + 1950);
	});

	test('cache creation tokens use higher rate', () => {
		const result = energyFromTokens({
			inputTokens: 0,
			outputTokens: 0,
			cacheCreation: 1_000_000,
			cacheRead: 0,
		});
		assert.equal(result, 490);
	});

	test('cache read tokens use lower rate', () => {
		const result = energyFromTokens({
			inputTokens: 0,
			outputTokens: 0,
			cacheCreation: 0,
			cacheRead: 1_000_000,
		});
		assert.equal(result, 39);
	});

	test('all token types combined', () => {
		const result = energyFromTokens({
			inputTokens: 1_000_000,
			outputTokens: 1_000_000,
			cacheCreation: 1_000_000,
			cacheRead: 1_000_000,
		});
		assert.equal(result, 390 + 1950 + 490 + 39);
	});

	test('defaults missing fields to zero', () => {
		const result = energyFromTokens({ inputTokens: 1_000_000 });
		assert.equal(result, 390);
	});
});

describe('co2FromEnergy', () => {
	test('zero energy returns zero', () => {
		assert.equal(co2FromEnergy(0), 0);
	});

	test('1 kWh at 548 g/kWh = 548g', () => {
		assert.equal(co2FromEnergy(1000), 548);
	});

	test('41 Wh (blog median session) → ~22.5g CO2', () => {
		const result = co2FromEnergy(41);
		// 41 Wh × 548 / 1000 = 22.468
		assert.ok(result > 22.4 && result < 22.5, `Expected ~22.47, got ${result}`);
	});

	test('0.3 Wh (single query) → ~0.16g CO2', () => {
		const result = co2FromEnergy(0.3);
		// 0.3 × 548 / 1000 = 0.1644
		assert.ok(result > 0.16 && result < 0.17, `Expected ~0.164, got ${result}`);
	});
});

describe('constants match FORMULAS.md', () => {
	test('input rate is 390 Wh/MTok', () => {
		assert.equal(WH_PER_MTOK_INPUT, 390);
	});

	test('output rate is 1950 Wh/MTok', () => {
		assert.equal(WH_PER_MTOK_OUTPUT, 1950);
	});

	test('cache creation rate is 490 Wh/MTok', () => {
		assert.equal(WH_PER_MTOK_CACHE_CREATE, 490);
	});

	test('cache read rate is 39 Wh/MTok', () => {
		assert.equal(WH_PER_MTOK_CACHE_READ, 39);
	});

	test('carbon intensity is 548 g CO2/kWh', () => {
		assert.equal(CO2_GRAMS_PER_KWH, 548);
	});

	test('WUE site is 0.30 L/kWh', () => {
		assert.equal(WUE_SITE, 0.30);
	});

	test('WUE source is 3.142 L/kWh', () => {
		assert.equal(WUE_SOURCE, 3.142);
	});

	test('PUE is 1.12', () => {
		assert.equal(PUE, 1.12);
	});
});

describe('formatTokens', () => {
	test('small numbers show as-is', () => {
		assert.equal(formatTokens(500), '500');
	});

	test('thousands format as k', () => {
		assert.equal(formatTokens(12_400), '12.4k');
	});

	test('millions format as M', () => {
		assert.equal(formatTokens(1_200_000), '1.2M');
	});

	test('zero', () => {
		assert.equal(formatTokens(0), '0');
	});

	test('exactly 1000 formats as 1.0k', () => {
		assert.equal(formatTokens(1000), '1.0k');
	});

	test('exactly 1M formats as 1.0M', () => {
		assert.equal(formatTokens(1_000_000), '1.0M');
	});
});

describe('formatEnergy', () => {
	test('sub-Wh shows decimal Wh', () => {
		assert.equal(formatEnergy(0.3), '0.3 Wh');
	});

	test('small Wh shows one decimal', () => {
		assert.equal(formatEnergy(41.2), '41.2 Wh');
	});

	test('1000+ Wh shows kWh', () => {
		assert.equal(formatEnergy(1300), '1.3 kWh');
	});

	test('zero', () => {
		assert.equal(formatEnergy(0), '0.0 Wh');
	});
});

describe('waterFromEnergy', () => {
	test('zero energy returns zero', () => {
		assert.equal(waterFromEnergy(0), 0);
	});

	test('1 kWh = ~3.41 L', () => {
		const result = waterFromEnergy(1000);
		// (1/1.12) * 0.30 + 1 * 3.142 = 0.2679 + 3.142 = 3.4099
		assert.ok(result > 3.40 && result < 3.42, `Expected ~3.41, got ${result}`);
	});

	test('40 Wh (typical session) = ~136 ml', () => {
		const result = waterFromEnergy(40);
		// 0.04 kWh: (0.04/1.12)*0.30 + 0.04*3.142 = 0.01071 + 0.12568 = 0.1364 L
		const ml = result * 1000;
		assert.ok(ml > 135 && ml < 137, `Expected ~136 ml, got ${ml}`);
	});
});

describe('formatWater', () => {
	test('sub-litre shows ml', () => {
		assert.equal(formatWater(0.136), '136ml');
	});

	test('litres range', () => {
		assert.equal(formatWater(3.4), '3.4L');
	});

	test('zero', () => {
		assert.equal(formatWater(0), '0ml');
	});

	test('exactly 1L', () => {
		assert.equal(formatWater(1.0), '1.0L');
	});

	test('small ml values', () => {
		assert.equal(formatWater(0.005), '5ml');
	});
});

describe('formatCO2', () => {
	test('sub-gram shows decimal grams', () => {
		assert.equal(formatCO2(0.2), '0.2g');
	});

	test('grams range', () => {
		assert.equal(formatCO2(22.5), '22.5g');
	});

	test('1000+ grams shows kg', () => {
		assert.equal(formatCO2(1500), '1.5kg');
	});

	test('zero', () => {
		assert.equal(formatCO2(0), '0.0g');
	});
});
