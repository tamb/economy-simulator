import { useEffect, useState } from "react";
import { usePopulation } from "../context/PopulationContext";
import { useRegions } from "../context/RegionContext";
import {
	buildCitizenQolBreakdown,
	type CitizenQolBreakdown,
} from "../game/citizen-qol-breakdown";
import type { Person } from "../models/Person";
import { loadNationalLedger } from "../repos/national-ledger";
import { loadSectorAssignments } from "../repos/sector-assignments";

interface CitizenDossierModalProps {
	person: Person;
	onClose: () => void;
}

function formatDelta(delta: number): string {
	const rounded = Math.round(delta * 100) / 100;
	if (rounded > 0) return `+${rounded.toFixed(2)}`;
	if (rounded < 0) return rounded.toFixed(2);
	return "0";
}

function CitizenDossierModal({ person, onClose }: CitizenDossierModalProps) {
	const { gameDay, gameRun } = usePopulation();
	const { getRegion } = useRegions();
	const [breakdown, setBreakdown] = useState<CitizenQolBreakdown | null>(null);

	useEffect(() => {
		let cancelled = false;
		Promise.all([loadSectorAssignments(), loadNationalLedger()])
			.then(([assignments, ledger]) => {
				if (cancelled) return;
				const regionId = person.getRegionId();
				setBreakdown(
					buildCitizenQolBreakdown({
						person,
						gameDay,
						activeCalamities: gameRun?.activeCalamities ?? [],
						sectorAssignments: assignments,
						nationalLedger: ledger,
						region: regionId ? getRegion(regionId) : undefined,
					}),
				);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [person, gameDay, gameRun?.activeCalamities, getRegion]);

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-neutral-950/80 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="citizen-dossier-title"
		>
			<div className="my-auto flex max-h-[min(90vh,42rem)] w-full max-w-md flex-col overflow-hidden border-4 border-primary bg-surface shadow-lg shadow-surface-shadow">
				<header className="shrink-0 border-b-4 border-primary bg-neutral-950 px-6 py-4 text-on-dark">
					<p className="font-label text-[10px] tracking-overline text-on-dark-muted">
						Citizen dossier
					</p>
					<h2
						id="citizen-dossier-title"
						className="mt-2 text-sm text-highlight"
					>
						{person.getName() ?? "Unknown"}
					</h2>
				</header>

				<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5 text-sm">
					{breakdown ? (
						<>
							<dl className="grid grid-cols-2 gap-2">
								<div className="border border-primary/30 bg-surface-muted px-2 py-1">
									<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
										Region
									</dt>
									<dd>{breakdown.regionName}</dd>
								</div>
								<div className="border border-primary/30 bg-surface-muted px-2 py-1">
									<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
										Job
									</dt>
									<dd>{breakdown.jobLabel}</dd>
								</div>
								<div className="border border-primary/30 bg-surface-muted px-2 py-1">
									<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
										Role
									</dt>
									<dd>{breakdown.roleLabel}</dd>
								</div>
								<div className="border border-primary/30 bg-surface-muted px-2 py-1">
									<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
										QoL
									</dt>
									<dd>
										H {Math.ceil(breakdown.happiness)}% · He{" "}
										{Math.ceil(breakdown.health)}%
									</dd>
								</div>
							</dl>

							<div>
								<p className="font-label text-[10px] tracking-overline text-muted-foreground">
									Daily happiness factors
								</p>
								<ul className="mt-2 space-y-2">
									{breakdown.factors.map((factor) => (
										<li
											key={factor.id}
											className="flex items-start justify-between gap-3 border border-primary/20 bg-surface-muted px-2 py-1.5"
										>
											<div>
												<p>{factor.label}</p>
												{factor.note && (
													<p className="text-xs text-muted-foreground">
														{factor.note}
													</p>
												)}
											</div>
											<span
												className={
													factor.delta < 0
														? "text-destructive"
														: factor.delta > 0
															? "text-success"
															: "text-muted-foreground"
												}
											>
												{formatDelta(factor.delta)}
											</span>
										</li>
									))}
								</ul>
							</div>
						</>
					) : (
						<p className="text-muted-foreground">Loading dossier…</p>
					)}

					<button
						type="button"
						onClick={onClose}
						className="w-full cursor-pointer border-2 border-primary bg-primary px-4 py-3 text-primary-foreground"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

export { CitizenDossierModal };
