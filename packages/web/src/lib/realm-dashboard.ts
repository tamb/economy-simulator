import type { FiscalBudgetLine } from "economy-simulator-data";
import { gameSettings } from "economy-simulator-data";
import type {
	FiscalBudgetShares,
	FiscalPolicy,
	NationEconomyState,
} from "economy-simulator-simulation";
import { normalizeBudgetShares } from "economy-simulator-simulation";

function clampTaxRate(taxRate: number): number {
	return Math.min(
		gameSettings.fiscal.taxRateMax,
		Math.max(gameSettings.fiscal.taxRateMin, taxRate),
	);
}

function updateNationFiscalPolicy(
	state: NationEconomyState,
	patch: {
		taxRate?: number;
		budgetShares?: Partial<FiscalBudgetShares>;
	},
): NationEconomyState {
	const nextShares: FiscalBudgetShares = {
		...state.policy.budgetShares,
		...patch.budgetShares,
	};
	const policy: FiscalPolicy = {
		taxRate: clampTaxRate(patch.taxRate ?? state.policy.taxRate),
		budgetShares: normalizeBudgetShares(nextShares),
	};
	return { ...state, policy };
}

const BUDGET_LINE_LABELS: Record<FiscalBudgetLine, string> = {
	infrastructure: "Infrastructure",
	healthcare: "Healthcare",
	education: "Education",
	reliefReserve: "Relief reserve",
};

const INFRA_LABELS = {
	transport: "Transport",
	powerWater: "Power & water",
	digital: "Digital",
} as const;

export {
	BUDGET_LINE_LABELS,
	clampTaxRate,
	INFRA_LABELS,
	updateNationFiscalPolicy,
};
