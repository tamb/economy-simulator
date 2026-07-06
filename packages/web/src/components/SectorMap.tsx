import type { ChangeEvent } from "react";
import {
	type EconomicSystemId,
	economicSystems,
	getEconomicSystem,
	isEconomicSystemId,
} from "../data/economic-systems";
import type { Category, SubSector } from "../data/taxonomy";
import { categoryColorClasses } from "../data/taxonomy";
import { useSectorAssignments } from "../context/SectorAssignmentContext";

interface SectorMapProps {
	category: Category;
	selectedSectorId: string | null;
	onSelect: (sectorId: string) => void;
}

export function SectorMap({
	category,
	selectedSectorId,
	onSelect,
}: SectorMapProps) {
	const { getAssignment } = useSectorAssignments();
	const colors = categoryColorClasses[category.color];
	const selected = category.subSectors.find(
		(sector) => sector.id === selectedSectorId,
	);

	return (
		<div className="space-y-6">
			<div className="border-2 border-primary bg-surface-muted px-4 py-3">
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Tier {category.tier} · {category.tierName}
				</p>
				<h2 className="mt-1 text-xs sm:text-sm">{category.label}</h2>
				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
					{category.description}
				</p>
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
				<SectorDetail sector={selected} category={category} colors={colors} />
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
}: {
	sector: SubSector;
	category: Category;
	colors: (typeof categoryColorClasses)[string];
}) {
	const { getAssignment, setAssignment, isReady } = useSectorAssignments();
	const assignedSystemId = getAssignment(category.id, sector.id);
	const assignedSystem = assignedSystemId
		? getEconomicSystem(assignedSystemId)
		: null;

	const handleSystemChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		const systemId =
			value === "" || !isEconomicSystemId(value) ? null : value;
		void setAssignment(category.id, sector.id, systemId);
	};

	const simulationPath = assignedSystemId
		? `sectors/${category.id}/${sector.id}/${assignedSystemId}`
		: `sectors/${category.id}/${sector.id}/`;

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
					<option value="">Unassigned</option>
					{economicSystems.map((system) => (
						<option key={system.id} value={system.id}>
							{system.label}
						</option>
					))}
				</select>
				{assignedSystem && (
					<p className="text-xs leading-relaxed opacity-90">
						{assignedSystem.description}
					</p>
				)}
			</div>

			<p className="mt-4 font-label text-[10px] tracking-overline opacity-70">
				Path: {simulationPath}
			</p>
		</aside>
	);
}
