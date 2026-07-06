import type { PersonalityTrait } from "../models/Person";

export const personGenerationConfig = {
	traits: [
		"openness",
		"conscientiousness",
		"extraversion",
		"agreeableness",
		"neuroticism",
	] as const satisfies readonly PersonalityTrait[],

	/** Total personality points split across all traits. */
	traitPointBudget: 22,

	happiness: {
		min: 0,
		max: 100,
	},

	health: {
		min: 0,
		max: 100,
	},
} as const;

export type PersonGenerationConfig = typeof personGenerationConfig;
