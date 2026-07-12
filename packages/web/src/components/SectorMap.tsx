import type { CategoryId } from "economy-simulator-data";
import { getEconomicSystemEffect } from "economy-simulator-data";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { usePopulation } from "../context/PopulationContext";
import { useSectorAssignments } from "../context/SectorAssignmentContext";
import { autoAssignCategory, autoAssignSector } from "../game/nation-setup";
import {
	type EconomicSystemId,
	economicSystems,
	getEconomicSystem,
	getRolesForSystem,
	isEconomicSystemId,
} from "../lib/economic-systems";
import {
	type Category,
	categories,
	categoryColorClasses,
	type SubSector,
} from "../lib/taxonomy";

const LABOR_EDICT_PERCENTS = [5, 10, 25, 50] as const;

interface SectorMapProps {
	category: Category;
	selectedSectorId: string | null;
	onSelect: (sectorId: string) => void;
}

function SectorMap({ category, selectedSectorId, onSelect }: SectorMapProps) {
	const { needsConfiguration } = usePopulation();
	const { getAssignment, refresh } = useSectorAssignments();
	const colors = categoryColorClasses[category.color];
	const selected = category.subSectors.find(
		(sector) => sector.id === selectedSectorId,
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3 border-2 border-primary bg-surface-muted px-4 py-3">
				<div>
					<p className="font-label text-[10px] text-muted-foreground tracking-overline">
						Tier {category.tier} · {category.tierName}
					</p>
					<h2 className="mt-1 text-xs sm:text-sm">{category.label}</h2>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						{category.description}
					</p>
				</div>
				{needsConfiguration && (
					<button
						type="button"
						onClick={() => {
							autoAssignCategory(category.id)
								.then(() => refresh())
								.catch(() => undefined);
						}}
						className="border-2 border-primary bg-surface px-3 py-1.5 text-xs text-foreground"
					>
						Auto-assign category
					</button>
				)}
			</div>

			<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{category.subSectors.map((sector) => (
					<SectorNode
						key={sector.id}
						sector={sector}
						colors={colors}
						systemId={getAssignment(category.id, sector.id)}
						isSelected={sector.id === selectedSectorId}
						onSelect={() => onSelect(sector.id)}
					/>
				))}
			</div>

			{selected && (
				<SectorDetail
					sector={selected}
					category={category}
					colors={colors}
					requireAssignment={needsConfiguration}
					onAutoAssignSector={() => {
						autoAssignSector(category.id, selected.id)
							.then(() => refresh())
							.catch(() => undefined);
					}}
				/>
			)}
		</div>
	);
}

function MidGameLevers({
	category,
	sector,
}: {
	category: Category;
	sector: SubSector;
}) {
	const { applyLaborEdict, applyRoleReform, isAdvancingDay, isGameActive } =
		usePopulation();
	const [targetKey, setTargetKey] = useState("");
	const [percent, setPercent] = useState<number>(10);
	const [lastResult, setLastResult] = useState<string | null>(null);

	const targetOptions = useMemo(() => {
		return categories.flatMap((entry) =>
			entry.subSectors.map((sub) => ({
				key: `${entry.id}:${sub.id}`,
				label: `${entry.shortLabel} / ${sub.label}`,
				categoryId: entry.id,
				subSectorId: sub.id,
			})),
		);
	}, []);

	const disabled = isAdvancingDay || !isGameActive;

	return (
		<div className="mt-6 space-y-4 border-t-2 border-primary/40 pt-5">
			<p className="font-label text-[10px] tracking-overline opacity-80">
				Mid-game levers
			</p>

			<div className="space-y-2">
				<p className="text-xs font-medium">Labor edict</p>
				<p className="text-xs leading-relaxed opacity-90">
					Reassign a share of workers from this sector. Citizens lose a little
					happiness from the disruption.
				</p>
				<label className="block space-y-1">
					<span className="text-xs">Destination sector</span>
					<select
						value={targetKey}
						onChange={(event) => setTargetKey(event.target.value)}
						disabled={disabled}
						className="w-full border-2 border-primary bg-surface px-2 py-1 text-sm"
					>
						<option value="">Select destination…</option>
						{targetOptions
							.filter(
								(option) =>
									!(
										option.categoryId === category.id &&
										option.subSectorId === sector.id
									),
							)
							.map((option) => (
								<option key={option.key} value={option.key}>
									{option.label}
								</option>
							))}
					</select>
				</label>
				<label className="block space-y-1">
					<span className="text-xs">Share to move</span>
					<select
						value={percent}
						onChange={(event) => setPercent(Number(event.target.value))}
						disabled={disabled}
						className="w-full border-2 border-primary bg-surface px-2 py-1 text-sm"
					>
						{LABOR_EDICT_PERCENTS.map((value) => (
							<option key={value} value={value}>
								{value}%
							</option>
						))}
					</select>
				</label>
				<button
					type="button"
					disabled={disabled || !targetKey}
					onClick={() => {
						const [categoryId, subSectorId] = targetKey.split(":");
						if (!categoryId || !subSectorId) return;
						applyLaborEdict(
							{ categoryId: category.id, subSectorId: sector.id },
							{ categoryId: categoryId as CategoryId, subSectorId },
							percent,
						)
							.then((result) => {
								setLastResult(
									result.affected > 0
										? `${result.affected.toLocaleString()} workers reassigned.`
										: "No eligible workers found.",
								);
							})
							.catch(() => setLastResult("Edict failed."));
					}}
					className="border-2 border-primary bg-surface px-3 py-1.5 text-xs disabled:opacity-50"
				>
					Issue labor edict
				</button>
			</div>

			<div className="space-y-2">
				<p className="text-xs font-medium">Role reform</p>
				<p className="text-xs leading-relaxed opacity-90">
					Re-roll roles for living workers in this sector using your current
					role mix.
				</p>
				<button
					type="button"
					disabled={disabled}
					onClick={() => {
						applyRoleReform(category.id, sector.id)
							.then((result) => {
								setLastResult(
									result.affected > 0
										? `${result.affected.toLocaleString()} roles reformed.`
										: "No workers to reform.",
								);
							})
							.catch(() => setLastResult("Reform failed."));
					}}
					className="border-2 border-primary bg-surface px-3 py-1.5 text-xs disabled:opacity-50"
				>
					Reform roles
				</button>
			</div>

			{lastResult && (
				<p className="text-xs text-muted-foreground" aria-live="polite">
					{lastResult}
				</p>
			)}
		</div>
	);
}

function SectorNode({
	sector,
	colors,
	systemId,
	isSelected,
	onSelect,
}: {
	sector: SubSector;
	colors: (typeof categoryColorClasses)[string];
	systemId: EconomicSystemId | null;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const system = systemId ? getEconomicSystem(systemId) : null;

	return (
		<button
			type="button"
			onClick={onSelect}
			className={`cursor-pointer border-2 px-3 py-3 text-left transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight ${
				isSelected
					? `${colors.bg} ${colors.border} ${colors.text} ring-2 ring-highlight ring-offset-2 ring-offset-surface`
					: "border-primary/30 bg-surface hover:border-primary"
			}`}
		>
			<h3 className="text-[10px] leading-relaxed sm:text-xs">{sector.label}</h3>
			<p
				className={`mt-1 line-clamp-2 text-xs leading-relaxed ${
					isSelected ? "opacity-90" : "text-muted-foreground"
				}`}
			>
				{sector.description}
			</p>
			{system && (
				<p
					className={`mt-2 font-label text-[10px] tracking-overline ${
						isSelected ? "opacity-90" : "text-primary"
					}`}
				>
					{system.label}
				</p>
			)}
		</button>
	);
}

function SectorDetail({
	sector,
	category,
	colors,
	requireAssignment,
	onAutoAssignSector,
}: {
	sector: SubSector;
	category: Category;
	colors: (typeof categoryColorClasses)[string];
	requireAssignment: boolean;
	onAutoAssignSector: () => void;
}) {
	const { isGameActive } = usePopulation();
	const {
		getAssignment,
		getRoleConfig,
		setAssignment,
		setRoleConfig,
		isReady,
	} = useSectorAssignments();
	const assignedSystemId = getAssignment(category.id, sector.id);
	const assignedSystem = assignedSystemId
		? getEconomicSystem(assignedSystemId)
		: null;
	const roleConfig = getRoleConfig(category.id, sector.id);
	const roles = assignedSystemId ? getRolesForSystem(assignedSystemId) : [];

	const handleSystemChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		const systemId = value === "" || !isEconomicSystemId(value) ? null : value;
		void setAssignment(category.id, sector.id, systemId);
	};

	const handleRoleShareChange = (roleId: number, sharePercent: number) => {
		if (!assignedSystemId) return;
		const share = Math.max(0, sharePercent) / 100;
		const existing = roleConfig?.quotas ?? [];
		const others = existing.filter((quota) => quota.roleId !== roleId);
		const nextQuotas = [...others, { roleId, share }];
		const total = nextQuotas.reduce((sum, quota) => sum + quota.share, 0);
		if (total <= 0) return;
		const normalized = nextQuotas.map((quota) => ({
			roleId: quota.roleId,
			share: quota.share / total,
		}));
		void setRoleConfig(category.id, sector.id, { quotas: normalized });
	};

	const quotaTotal = (roleConfig?.quotas ?? []).reduce(
		(sum, quota) => sum + quota.share,
		0,
	);

	return (
		<aside
			className={`border-2 px-5 py-4 ${colors.border} ${colors.muted} ${colors.mutedText}`}
			aria-live="polite"
		>
			<p className="font-label text-[10px] tracking-overline opacity-80">
				{category.shortLabel} / {sector.id}
			</p>
			<h3 className="mt-2 text-xs sm:text-sm">{sector.label}</h3>
			<p className="mt-3 text-sm leading-relaxed">{sector.description}</p>

			<div className="mt-5 space-y-2">
				<label
					htmlFor={`system-${category.id}-${sector.id}`}
					className="font-label block text-[10px] tracking-overline opacity-80"
				>
					Economic System
				</label>
				<select
					id={`system-${category.id}-${sector.id}`}
					value={assignedSystemId ?? ""}
					onChange={handleSystemChange}
					disabled={!isReady}
					className="w-full border-2 border-primary bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight disabled:opacity-60"
				>
					{!requireAssignment && <option value="">Unassigned</option>}
					{requireAssignment && !assignedSystemId && (
						<option value="">Select a system…</option>
					)}
					{economicSystems.map((system) => (
						<option key={system.id} value={system.id}>
							{system.label}
						</option>
					))}
				</select>
				{assignedSystem && (
					<>
						<p className="text-xs leading-relaxed opacity-90">
							{assignedSystem.description}
						</p>
						{(() => {
							const effect = getEconomicSystemEffect(assignedSystem.id);
							if (!effect) return null;
							return (
								<ul className="mt-2 space-y-1 border border-primary/30 bg-surface px-2 py-2 text-xs">
									<li>
										Extraction efficiency ×
										{effect.efficiencyMultiplier.toFixed(2)}
									</li>
									<li>
										Environmental impact ×
										{effect.environmentalImpactMultiplier.toFixed(2)}
									</li>
									<li>Worker morale ×{effect.moraleMultiplier.toFixed(2)}</li>
								</ul>
							);
						})()}
					</>
				)}
			</div>

			{assignedSystemId && (
				<div className="mt-5 space-y-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="font-label text-[10px] tracking-overline opacity-80">
							Role mix
						</p>
						{requireAssignment && (
							<button
								type="button"
								onClick={onAutoAssignSector}
								className="border border-primary bg-surface px-2 py-1 text-[10px] text-foreground"
							>
								Auto-assign roles
							</button>
						)}
					</div>
					{roles.map((role) => {
						const quota = roleConfig?.quotas.find(
							(entry) => entry.roleId === role.id,
						);
						const percent = Math.round((quota?.share ?? 0) * 100);
						return (
							<label key={role.id} className="block space-y-1">
								<span className="text-xs">
									{role.label} ({role.id})
								</span>
								<input
									type="number"
									min={0}
									max={100}
									value={percent}
									onChange={(event) => {
										handleRoleShareChange(role.id, Number(event.target.value));
									}}
									className="w-full border-2 border-primary bg-surface px-2 py-1 text-sm"
								/>
							</label>
						);
					})}
					<p className="mt-4 font-label text-[10px] tracking-overline opacity-70">
						Total: {Math.round(quotaTotal * 100)}%
					</p>
				</div>
			)}

			{!requireAssignment && isGameActive && (
				<MidGameLevers category={category} sector={sector} />
			)}
		</aside>
	);
}

export { SectorMap };
