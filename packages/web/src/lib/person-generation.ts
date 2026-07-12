import { gameSettings } from "economy-simulator-data";
import type { PersonalityTrait } from "../models/Person";

/**
 * Balance numbers (`traitPointBudget`, `happiness`, `health`) are sourced
 * from `gameSettings.personGeneration`, the single tunable source of truth
 * shared with `packages/data`/`packages/simulation`. The `traits` list stays
 * here because it's tied to the web-only `Person` class's OCEAN fields.
 */
const personGenerationConfig = {
	traits: [
		"openness",
		"conscientiousness",
		"extraversion",
		"agreeableness",
		"neuroticism",
	] as const satisfies readonly PersonalityTrait[],

	traitPointBudget: gameSettings.personGeneration.traitPointBudget,
	happiness: gameSettings.personGeneration.happiness,
	health: gameSettings.personGeneration.health,
} as const;

type PersonGenerationConfig = typeof personGenerationConfig;

export type { PersonGenerationConfig };
export { personGenerationConfig };
