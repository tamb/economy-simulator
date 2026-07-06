import type { FaceConfig } from "facesjs";

/**
 * Big Five / OCEAN personality dimensions — the widely accepted
 * five-factor model in modern psychology.
 */
export type PersonalityTrait =
	| "openness"
	| "conscientiousness"
	| "extraversion"
	| "agreeableness"
	| "neuroticism";

export class Person {
	name?: string;
	face?: FaceConfig;

	openness?: number;
	conscientiousness?: number;
	extraversion?: number;
	agreeableness?: number;
	neuroticism?: number;

	overallHappiness?: number;
	overallHealth?: number;
}
