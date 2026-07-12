import mandatesCopy from "../copy/mandates.json" with { type: "json" };

type MandateId =
	| "resource_security"
	| "stem_emigration"
	| "raise_qol"
	| "heal_land";

interface MandateDefinition {
	id: MandateId;
	label: string;
	description: string;
	/** Bonus points added to nation score when fulfilled. */
	scoreBonus: number;
}

/** Game logic only — labels/descriptions come from `copy/mandates.json`. */
interface MandateLogic {
	id: MandateId;
	scoreBonus: number;
}

const mandatesLogic: MandateLogic[] = [
	{ id: "resource_security", scoreBonus: 3 },
	{ id: "stem_emigration", scoreBonus: 3 },
	{ id: "raise_qol", scoreBonus: 2 },
	{ id: "heal_land", scoreBonus: 2 },
];

type MandatesCopyFile = Record<string, { label: string; description: string }>;

const copy = mandatesCopy as MandatesCopyFile;

function mergeMandates(): MandateDefinition[] {
	return mandatesLogic.map((mandate) => {
		const text = copy[mandate.id];
		if (!text) {
			throw new Error(
				`Missing copy for mandate "${mandate.id}" in copy/mandates.json`,
			);
		}
		return {
			id: mandate.id,
			label: text.label,
			description: text.description,
			scoreBonus: mandate.scoreBonus,
		};
	});
}

const mandateDefinitions = mergeMandates();

function getMandateDefinition(id: MandateId): MandateDefinition | undefined {
	return mandateDefinitions.find((mandate) => mandate.id === id);
}

function pickMandateForYear(year: number): MandateId {
	return (
		mandateDefinitions[year % mandateDefinitions.length]?.id ?? "raise_qol"
	);
}

export type { MandateDefinition, MandateId };
export { getMandateDefinition, mandateDefinitions, pickMandateForYear };
