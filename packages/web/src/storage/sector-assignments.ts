import localforage from "localforage";
import type { EconomicSystemId } from "../data/economic-systems";
import { isEconomicSystemId } from "../data/economic-systems";
import { type CategoryId, sectorKey } from "../data/taxonomy";

const STORAGE_KEY = "sector-assignments";

export type SectorAssignments = Record<string, EconomicSystemId>;

const store = localforage.createInstance({
	name: "economy-simulator",
	storeName: "sector-data",
});

export async function loadSectorAssignments(): Promise<SectorAssignments> {
	const saved = await store.getItem<unknown>(STORAGE_KEY);
	if (!saved || typeof saved !== "object") return {};

	const assignments: SectorAssignments = {};
	for (const [key, value] of Object.entries(saved)) {
		if (typeof value === "string" && isEconomicSystemId(value)) {
			assignments[key] = value;
		}
	}
	return assignments;
}

export async function saveSectorAssignments(
	assignments: SectorAssignments,
): Promise<void> {
	await store.setItem(STORAGE_KEY, assignments);
}

export async function setSectorAssignment(
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

export function getSectorAssignment(
	assignments: SectorAssignments,
	categoryId: CategoryId,
	sectorId: string,
): EconomicSystemId | null {
	return assignments[sectorKey(categoryId, sectorId)] ?? null;
}
