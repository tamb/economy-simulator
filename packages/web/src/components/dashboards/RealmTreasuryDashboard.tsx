import type { FiscalBudgetLine } from "economy-simulator-data";
import { gameSettings } from "economy-simulator-data";
import type { NationEconomyState } from "economy-simulator-simulation";
import { meanInfrastructure } from "economy-simulator-simulation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePopulation } from "../../context/PopulationContext";
import {
	BUDGET_LINE_LABELS,
	INFRA_LABELS,
	updateNationFiscalPolicy,
} from "../../lib/realm-dashboard";
import {
	ensureNationEconomy,
	saveNationEconomy,
} from "../../repos/nation-economy";

const BUDGET_LINES = Object.keys(BUDGET_LINE_LABELS) as FiscalBudgetLine[];

function formatRate(rate: number): string {
	return `${(rate * 100).toFixed(0)}%`;
}

function BriefingPanel({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="border-4 border-primary bg-surface shadow-sm shadow-surface-shadow">
			<header className="border-b-4 border-primary bg-neutral-950 px-4 py-3 text-on-dark">
				<p className="font-label text-[10px] tracking-overline text-on-dark-muted">
					Cabinet briefing
				</p>
				<h3 className="mt-1 text-xs text-highlight">{title}</h3>
				<p className="mt-2 text-xs leading-relaxed text-on-dark-muted">
					{description}
				</p>
			</header>
			<div className="px-4 py-3">{children}</div>
		</div>
	);
}

function MetricRow({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="flex items-baseline justify-between gap-3 border-b border-primary/15 py-2 last:border-b-0">
			<div>
				<p className="font-label text-[10px] tracking-overline text-muted-foreground">
					{label}
				</p>
				{hint ? (
					<p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
				) : null}
			</div>
			<p className="text-sm tabular-nums">{value}</p>
		</div>
	);
}

function IndexBar({ label, value }: { label: string; value: number }) {
	return (
		<div className="space-y-1">
			<div className="flex justify-between font-label text-[10px] tracking-overline text-muted-foreground">
				<span>{label}</span>
				<span className="tabular-nums">{value.toFixed(0)}</span>
			</div>
			<div className="h-2 border border-primary/30 bg-surface-muted">
				<div
					className="h-full bg-primary"
					style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
				/>
			</div>
		</div>
	);
}

function RealmTreasuryDashboard() {
	const { isReady, gameDay } = usePopulation();
	const [economy, setEconomy] = useState<NationEconomyState | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload whenever the game day advances
	useEffect(() => {
		if (!isReady) return;

		let cancelled = false;
		setIsLoading(true);

		ensureNationEconomy()
			.then((result) => {
				if (!cancelled) setEconomy(result);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isReady, gameDay]);

	async function persist(next: NationEconomyState) {
		setIsSaving(true);
		setEconomy(next);
		try {
			await saveNationEconomy(next);
		} finally {
			setIsSaving(false);
		}
	}

	async function onTaxRateChange(value: number) {
		if (!economy) return;
		await persist(
			updateNationFiscalPolicy(economy, {
				taxRate: value / 100,
			}),
		);
	}

	async function onBudgetShareChange(line: FiscalBudgetLine, value: number) {
		if (!economy) return;
		await persist(
			updateNationFiscalPolicy(economy, {
				budgetShares: { [line]: value / 100 },
			}),
		);
	}

	if (!isReady) {
		return (
			<p className="text-sm text-muted-foreground">Generating citizens…</p>
		);
	}

	if (isLoading && !economy) {
		return (
			<p className="font-label text-[10px] text-muted-foreground tracking-overline">
				Loading realm accounts…
			</p>
		);
	}

	if (!economy) {
		return (
			<p className="text-sm text-muted-foreground">
				Realm accounts are not ready yet.
			</p>
		);
	}

	const last = economy.lastYear;
	const meanInfra = meanInfrastructure(economy.infrastructure);

	return (
		<div className="space-y-4">
			{isSaving ? (
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Saving fiscal policy…
				</p>
			) : null}

			<div className="grid gap-4 lg:grid-cols-2">
				<BriefingPanel
					title="Treasury"
					description="Annual tax revenue funds infrastructure, healthcare, education, and a relief reserve. Soft deficits are allowed; insolvency pressures score."
				>
					<div className="space-y-1">
						<MetricRow
							label="Balance"
							value={economy.treasury.toFixed(0)}
							hint={
								last?.insolvent
									? "Accounts closed under strain last year"
									: undefined
							}
						/>
						<MetricRow label="Debt" value={economy.debt.toFixed(0)} />
						{last ? (
							<>
								<MetricRow
									label="Last tax revenue"
									value={last.taxRevenue.toFixed(0)}
								/>
								<MetricRow
									label="Last spending"
									value={last.totalSpending.toFixed(0)}
								/>
								<MetricRow
									label="Debt service"
									value={last.debtService.toFixed(0)}
								/>
								<MetricRow
									label="Output proxy"
									value={last.outputProxy.toFixed(0)}
									hint="National resource production throughput"
								/>
							</>
						) : (
							<p className="py-2 text-xs text-muted-foreground">
								Advance past one full game year to settle the first fiscal
								accounts.
							</p>
						)}
					</div>
				</BriefingPanel>

				<BriefingPanel
					title="Infrastructure capital"
					description="Construction, utilities, and telecom labor plus the infrastructure budget raise indices. Neglect and capital-hitting calamities lower them."
				>
					<div className="space-y-3 pt-1">
						<IndexBar
							label={INFRA_LABELS.transport}
							value={economy.infrastructure.transport}
						/>
						<IndexBar
							label={INFRA_LABELS.powerWater}
							value={economy.infrastructure.powerWater}
						/>
						<IndexBar
							label={INFRA_LABELS.digital}
							value={economy.infrastructure.digital}
						/>
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Mean index{" "}
							<span className="tabular-nums text-foreground">
								{meanInfra.toFixed(0)}
							</span>
						</p>
					</div>
				</BriefingPanel>
			</div>

			<BriefingPanel
				title="Public services"
				description="Healthcare and education coverage × quality, funded by budget lines and staffing, delivered through infrastructure."
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Healthcare
						</p>
						<MetricRow
							label="Coverage"
							value={economy.services.healthcare.coverage.toFixed(0)}
						/>
						<MetricRow
							label="Quality"
							value={economy.services.healthcare.quality.toFixed(0)}
						/>
					</div>
					<div className="space-y-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Education
						</p>
						<MetricRow
							label="Coverage"
							value={economy.services.education.coverage.toFixed(0)}
						/>
						<MetricRow
							label="Quality"
							value={economy.services.education.quality.toFixed(0)}
						/>
					</div>
				</div>
			</BriefingPanel>

			<BriefingPanel
				title="Fiscal policy"
				description={`Tax band ${(gameSettings.fiscal.taxRateMin * 100).toFixed(0)}–${(gameSettings.fiscal.taxRateMax * 100).toFixed(0)}% of output. Higher rates raise revenue but press happiness and emigration. Budget shares rebalance automatically.`}
			>
				<div className="space-y-5 pt-1">
					<label className="block space-y-2">
						<div className="flex justify-between font-label text-[10px] tracking-overline text-muted-foreground">
							<span>Overall tax rate</span>
							<span className="tabular-nums">
								{formatRate(economy.policy.taxRate)}
							</span>
						</div>
						<input
							type="range"
							min={gameSettings.fiscal.taxRateMin * 100}
							max={gameSettings.fiscal.taxRateMax * 100}
							step={1}
							value={Math.round(economy.policy.taxRate * 100)}
							onChange={(event) => {
								void onTaxRateChange(Number(event.target.value));
							}}
							className="w-full accent-primary"
						/>
					</label>

					{BUDGET_LINES.map((line) => (
						<label key={line} className="block space-y-2">
							<div className="flex justify-between font-label text-[10px] tracking-overline text-muted-foreground">
								<span>{BUDGET_LINE_LABELS[line]}</span>
								<span className="tabular-nums">
									{formatRate(economy.policy.budgetShares[line])}
								</span>
							</div>
							<input
								type="range"
								min={5}
								max={60}
								step={1}
								value={Math.round(economy.policy.budgetShares[line] * 100)}
								onChange={(event) => {
									void onBudgetShareChange(line, Number(event.target.value));
								}}
								className="w-full accent-primary"
							/>
						</label>
					))}
				</div>
			</BriefingPanel>
		</div>
	);
}

export { RealmTreasuryDashboard };
