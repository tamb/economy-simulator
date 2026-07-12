import { appConfig } from "economy-simulator-data";
import {
	ensurePlayerProfile,
	type GameRunState,
	loadGameRunState,
	type PlayerProfile,
} from "economy-simulator-persistence";
import { useEffect, useState } from "react";
import { BadgeGallery } from "../components/BadgeGallery";
import { DispatchLog } from "../components/DispatchLog";
import { ScoreDashboard } from "../components/dashboards/ScoreDashboard";
import { formatEndReason } from "../lib/score-dashboard";

function regionScaleLabel(boundingRadius: number | undefined): string | null {
	if (boundingRadius == null) return null;
	const match = appConfig.regions.regionScaleOptions.find(
		(option) => option.boundingRadius === boundingRadius,
	);
	return match?.label ?? `radius ${boundingRadius}`;
}
function RecordsPage() {
	const [profile, setProfile] = useState<PlayerProfile | null>(null);
	const [gameRun, setGameRun] = useState<GameRunState | null>(null);

	useEffect(() => {
		Promise.all([ensurePlayerProfile(), loadGameRunState()])
			.then(([loadedProfile, loadedRun]) => {
				setProfile(loadedProfile);
				setGameRun(loadedRun);
			})
			.catch(() => undefined);
	}, []);

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Records</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Career wins and losses, nation scores, badges, and past runs.
				</p>
			</header>

			<section className="space-y-3">
				<h3 className="font-label text-[10px] tracking-overline text-muted-foreground">
					Career
				</h3>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Wins
						</p>
						<p className="text-xl text-primary">{profile?.wins ?? 0}</p>
					</div>
					<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Losses
						</p>
						<p className="text-xl">{profile?.losses ?? 0}</p>
					</div>
					<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Best score
						</p>
						<p className="text-xl">{Math.round(profile?.bestScore ?? 0)}</p>
					</div>
					<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Years ruled
						</p>
						<p className="text-xl">{profile?.totalYearsRuled ?? 0}</p>
					</div>
				</div>
			</section>

			<section className="space-y-3">
				<h3 className="font-label text-[10px] tracking-overline text-muted-foreground">
					Current run score
				</h3>
				<ScoreDashboard gameRun={gameRun} />
			</section>

			<section className="space-y-3">
				<h3 className="font-label text-[10px] tracking-overline text-muted-foreground">
					Badges
				</h3>
				<BadgeGallery profile={profile} runBadges={gameRun?.unlockedThisRun} />
			</section>

			<section className="space-y-3">
				<h3 className="font-label text-[10px] tracking-overline text-muted-foreground">
					Recent dispatches
				</h3>
				<DispatchLog limit={8} />
			</section>

			<section className="space-y-3">
				<h3 className="font-label text-[10px] tracking-overline text-muted-foreground">
					Calamity log
				</h3>
				{(gameRun?.calamityHistory.length ?? 0) === 0 &&
				(gameRun?.activeCalamities.length ?? 0) === 0 ? (
					<p className="text-sm text-muted-foreground">
						No calamities recorded this run yet.
					</p>
				) : (
					<div className="overflow-x-auto border-2 border-primary/30">
						<table className="w-full min-w-[28rem] text-left text-sm">
							<thead className="bg-surface-muted font-label text-[10px] tracking-overline text-muted-foreground">
								<tr>
									<th className="px-3 py-2">Event</th>
									<th className="px-3 py-2">Severity</th>
									<th className="px-3 py-2">Regions</th>
									<th className="px-3 py-2">Status</th>
								</tr>
							</thead>
							<tbody>
								{(gameRun?.activeCalamities ?? []).map((calamity) => (
									<tr
										key={calamity.instanceId}
										className="border-t border-primary/20"
									>
										<td className="px-3 py-2">{calamity.name}</td>
										<td className="px-3 py-2 capitalize">
											{calamity.severity}
										</td>
										<td className="px-3 py-2">
											{calamity.regionIds.join(", ")}
										</td>
										<td className="px-3 py-2">Active</td>
									</tr>
								))}
								{[...(gameRun?.calamityHistory ?? [])]
									.reverse()
									.slice(0, 20)
									.map((entry) => (
										<tr
											key={entry.instanceId}
											className="border-t border-primary/20"
										>
											<td className="px-3 py-2">{entry.name}</td>
											<td className="px-3 py-2 capitalize">{entry.severity}</td>
											<td className="px-3 py-2">
												{entry.regionIds.join(", ")}
											</td>
											<td className="px-3 py-2">
												Ended (year {entry.year + 1})
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<section className="space-y-3">
				<h3 className="font-label text-[10px] tracking-overline text-muted-foreground">
					Run history
				</h3>
				{(profile?.runHistory.length ?? 0) === 0 ? (
					<p className="text-sm text-muted-foreground">
						No completed runs yet.
					</p>
				) : (
					<div className="overflow-x-auto border-2 border-primary/30">
						<table className="w-full min-w-[32rem] text-left text-sm">
							<thead className="bg-surface-muted font-label text-[10px] tracking-overline text-muted-foreground">
								<tr>
									<th className="px-3 py-2">Result</th>
									<th className="px-3 py-2">Score</th>
									<th className="px-3 py-2">Years</th>
									<th className="px-3 py-2">Population</th>
									<th className="px-3 py-2">Provinces</th>
									<th className="px-3 py-2">Reason</th>
								</tr>
							</thead>
							<tbody>
								{profile?.runHistory.map((run) => (
									<tr key={run.runId} className="border-t border-primary/20">
										<td className="px-3 py-2 capitalize">{run.status}</td>
										<td className="px-3 py-2">{Math.round(run.finalScore)}</td>
										<td className="px-3 py-2">{run.yearsPlayed}</td>
										<td className="px-3 py-2">
											{run.startingPopulation.toLocaleString()} →{" "}
											{run.endingPopulation.toLocaleString()}
										</td>
										<td className="px-3 py-2">
											{regionScaleLabel(run.boundingRadius) ?? "—"}
										</td>
										<td className="px-3 py-2">
											{formatEndReason(run.endReason)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}

export { RecordsPage };
