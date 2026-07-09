import {
	clearSectorAssignmentsStore,
	loadSectorAssignmentsRaw,
	saveSectorAssignmentsRaw,
} from "economy-simulator-persistence";
import type { EconomicSystemId } from "../data/economic-systems";
import { isEconomicSystemId } from "../data/economic-systems";
import { type CategoryId, sectorKey } from "../data/taxonomy";

type SectorAssignments = Record<string, EconomicSystemId>;

async function loadSectorAssignments(): Promise<SectorAssignments> {
	const saved = await loadSectorAssignmentsRaw();
	if (!saved || typeof saved !== "object") return {};

	const assignments: SectorAssignments = {};
	for (const [key, value] of Object.entries(saved)) {
		if (typeof value === "string" && isEconomicSystemId(value)) {
			assignments[key] = value;
		}
	}
	return assignments;
}

async function saveSectorAssignments(
	assignments: SectorAssignments,
): Promise<void> {
	await saveSectorAssignmentsRaw(assignments);
}

async function setSectorAssignment(
	assignments: SectorAssignments,
	categoryId: CategoryId,
	sectorId: string,
	systemId: EconomicSystemId | null,
): Promise<SectorAssignments> {
	const key = sectorKey(categoryId, sectorId);
	const next = { ...assignments };

	if (systemId === null) {
		delete next[key];
	} else {
		next[key] = systemId;
	}

	await saveSectorAssignments(next);
	return next;
}

function getSectorAssignment(
	assignments: SectorAssignments,
	categoryId: CategoryId,
	sectorId: string,
): EconomicSystemId | null {
	return assignments[sectorKey(categoryId, sectorId)] ?? null;
}

async function clearSectorAssignments(): Promise<void> {
	await clearSectorAssignmentsStore();
}

export type { SectorAssignments };
export {
	clearSectorAssignments,
	getSectorAssignment,
	loadSectorAssignments,
	saveSectorAssignments,
	setSectorAssignment,
};
