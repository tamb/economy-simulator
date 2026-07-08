import { appConfig } from "economy-simulator-data";

/**
 * Reads `VITE_POPULATION_SIZE`, an escape hatch so e2e tests (and manual
 * debugging) can run against a small population (seconds) instead of the
 * full 1,000,000-citizen ceiling (about a minute to generate) without going
 * through the new-game setup screen. Returns `null` when unset/invalid so
 * callers can distinguish "no override" from "use the default".
 */
function getPopulationSizeOverride(): number | null {
	const override = import.meta.env.VITE_POPULATION_SIZE;
	if (override) {
		const parsed = Number(override);
		if (Number.isFinite(parsed) && parsed > 0) {
			return Math.floor(parsed);
		}
	}
	return null;
}

/**
 * Resolves the population size to simulate before the player has made an
 * explicit choice on the new-game setup screen (used as an initial/fallback
 * value), preferring `VITE_POPULATION_SIZE` over `appConfig.population.size`.
 */
function getPopulationSize(): number {
	return getPopulationSizeOverride() ?? appConfig.population.size;
}

export { getPopulationSize, getPopulationSizeOverride };
