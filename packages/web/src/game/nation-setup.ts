import {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	type EconomicSystemId,
	getDefaultRoleQuotasForSystem,
	getDefaultSystemForSubSector,
	sectorKey,
	validateNationSetup,
} from "economy-simulator-data";
import {
	ensureGameRunState,
	loadGameRunState,
	saveGameRunState,
} from "economy-simulator-persistence";
import type { FaceId } from "../data/faces";
import { type CategoryId, getCategory } from "../data/taxonomy";
import { generateAndSavePopulation } from "../models/generatePopulation";
import {
	loadSectorAssignments,
	type SectorAssignments,
	saveSectorAssignments,
} from "../storage/sector-assignments";
import {
	loadSectorRoleConfigs,
	type SectorRoleConfigs,
	saveSectorRoleConfigs,
} from "../storage/sector-role-config";
import type { ensureWorld } from "../storage/world";
import { assignInnerCircle } from "./aide-proposals";
import { issueMandateForYear } from "./mandates";

async function loadNationSetupState(): Promise<{
	assignments: SectorAssignments;
	roleConfigs: SectorRoleConfigs;
}> {
	const [assignments, roleConfigs] = await Promise.all([
		loadSectorAssignments(),
		loadSectorRoleConfigs(),
	]);
	return { assignments, roleConfigs };
}

function getNationSetupValidation(
	assignments: SectorAssignments,
	roleConfigs: SectorRoleConfigs,
) {
	return validateNationSetup(assignments, roleConfigs);
}

async function autoAssignAllSectors(): Promise<{
	assignments: SectorAssignments;
	roleConfigs: SectorRoleConfigs;
}> {
	const assignments = buildAutoAssignments();
	const roleConfigs = buildAutoRoleConfigs(assignments);
	await Promise.all([
		saveSectorAssignments(assignments),
		saveSectorRoleConfigs(roleConfigs),
	]);
	return { assignments, roleConfigs };
}

async function autoAssignCategory(categoryId: CategoryId): Promise<{
	assignments: SectorAssignments;
	roleConfigs: SectorRoleConfigs;
}> {
	const { assignments, roleConfigs } = await loadNationSetupState();
	const nextAssignments = { ...assignments };
	const nextRoleConfigs = { ...roleConfigs };

	const category = getCategory(categoryId);
	if (!category) {
		return { assignments: nextAssignments, roleConfigs: nextRoleConfigs };
	}

	for (const subSector of category.subSectors) {
		const key = sectorKey(categoryId, subSector.id);
		const systemId = getDefaultSystemForSubSector(categoryId, subSector.id);
		nextAssignments[key] = systemId;
		nextRoleConfigs[key] = { quotas: getDefaultRoleQuotasForSystem(systemId) };
	}

	await Promise.all([
		saveSectorAssignments(nextAssignments),
		saveSectorRoleConfigs(nextRoleConfigs),
	]);
	return { assignments: nextAssignments, roleConfigs: nextRoleConfigs };
}

async function autoAssignSector(
	categoryId: CategoryId,
	subSectorId: string,
	systemId?: EconomicSystemId,
): Promise<{
	assignments: SectorAssignments;
	roleConfigs: SectorRoleConfigs;
}> {
	const { assignments, roleConfigs } = await loadNationSetupState();
	const key = sectorKey(categoryId, subSectorId);
	const resolvedSystemId =
		systemId ?? getDefaultSystemForSubSector(categoryId, subSectorId);
	const nextAssignments = { ...assignments, [key]: resolvedSystemId };
	const nextRoleConfigs = {
		...roleConfigs,
		[key]: { quotas: getDefaultRoleQuotasForSystem(resolvedSystemId) },
	};

	await Promise.all([
		saveSectorAssignments(nextAssignments),
		saveSectorRoleConfigs(nextRoleConfigs),
	]);
	return { assignments: nextAssignments, roleConfigs: nextRoleConfigs };
}

async function beginNationFounding(size: number): Promise<void> {
	await ensureGameRunState(size);
}

async function startGame(
	size: number,
	faceIds: readonly FaceId[],
	regions: Awaited<ReturnType<typeof ensureWorld>>,
	onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
	const { assignments, roleConfigs } = await loadNationSetupState();
	const validation = validateNationSetup(assignments, roleConfigs);
	if (!validation.ready) {
		throw new Error("Nation setup is incomplete");
	}

	let gameRun = await ensureGameRunState(size);
	gameRun = {
		...gameRun,
		phase: "active",
		startedAt: Date.now(),
		startingPopulation: size,
		innerCircle: assignInnerCircle(faceIds),
	};
	gameRun = issueMandateForYear(gameRun, 1);
	await saveGameRunState(gameRun);

	await generateAndSavePopulation(
		faceIds,
		regions,
		size,
		onProgress,
		roleConfigs,
	);
}

async function isNationInSetupPhase(): Promise<boolean> {
	const gameRun = await loadGameRunState();
	return gameRun?.phase === "setup";
}

export {
	autoAssignAllSectors,
	autoAssignCategory,
	autoAssignSector,
	beginNationFounding,
	getNationSetupValidation,
	isNationInSetupPhase,
	loadNationSetupState,
	startGame,
};
