interface InfrastructureIndices {
	transport: number;
	powerWater: number;
	digital: number;
}

interface FiscalBudgetShares {
	infrastructure: number;
	healthcare: number;
	education: number;
	reliefReserve: number;
}

interface FiscalPolicy {
	/** Overall tax-to-output rate (0–1). */
	taxRate: number;
	budgetShares: FiscalBudgetShares;
}

interface ServiceMetrics {
	/** 0–100 coverage-style index (WHO SCI analogue). */
	coverage: number;
	/** 0–100 quality index. */
	quality: number;
}

interface PublicServicesState {
	healthcare: ServiceMetrics;
	education: ServiceMetrics;
}

interface FiscalYearSummary {
	outputProxy: number;
	taxRevenue: number;
	spendingByLine: {
		infrastructure: number;
		healthcare: number;
		education: number;
		reliefReserve: number;
	};
	totalSpending: number;
	debtService: number;
	deficit: number;
	insolvent: boolean;
}

/**
 * Persisted domestic foundations state (Phase 1). One blob, like the
 * national ledger — pure simulation shape written by the annual tick.
 */
interface NationEconomyState {
	year: number;
	treasury: number;
	debt: number;
	policy: FiscalPolicy;
	infrastructure: InfrastructureIndices;
	services: PublicServicesState;
	lastYear: FiscalYearSummary | null;
}

export type {
	FiscalBudgetShares,
	FiscalPolicy,
	FiscalYearSummary,
	InfrastructureIndices,
	NationEconomyState,
	PublicServicesState,
	ServiceMetrics,
};
