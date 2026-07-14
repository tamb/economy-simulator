import {
	appConfig,
	buildAutoAssignments,
	buildAutoRoleConfigs,
	sectorKey,
} from "economy-simulator-data";
import {
	createInitialGameRunState,
	loadGameRunState,
	loadPopulationChunkRaw,
	type PopulationMeta,
	saveGameRunState,
	savePopulationChunkRaw,
	savePopulationMeta,
} from "economy-simulator-persistence";
import { beforeEach, describe, expect, it } from "vitest";
import { formatChunkKey, getCohortSize } from "../lib/population-cohorts";
import { Person } from "../models/Person";
import { saveSectorRoleConfigs } from "../repos/sector-role-config";
import { ensureWorld } from "../repos/world";
import { setupMemoryStorage } from "../test/storage-driver";
import { applyLaborEdict, applyRoleReform } from "./population-mutations";

function buildPopulationMeta(size: number): PopulationMeta {
	const cohortSizes = Array.from(
		{ length: appConfig.population.cohortCount },
		(_, cohort) => getCohortSize(cohort, size),
	);
	return {
		version: appConfig.population.storageVersion,
		size,
		cohortCount: appConfig.population.cohortCount,
		chunkSize: appConfig.population.chunkSize,
		cohortSizes,
		gameDay: 0,
	};
}

function makeWorker(
	overrides: {
		categoryId?: "industrial" | "extractive" | "services";
		subSectorId?: string;
		roleId?: number;
		regionId?: string;
		happiness?: number;
	} = {},
): Person {
	const person = new Person();
	person.setAge(30);
	person.setIsAlive(true);
	person.setFaceId("01");
	person.setCategoryId(overrides.categoryId ?? "industrial");
	person.setSubSectorId(overrides.subSectorId ?? "light-manufacturing");
	person.setRoleId(overrides.roleId ?? 1);
	person.setRegionId(overrides.regionId);
	person.setOverallHappiness(overrides.happiness ?? 70);
	return person;
}

async function seedPopulation(people: Person[]): Promise<void> {
	await savePopulationMeta(buildPopulationMeta(people.length));
	await savePopulationChunkRaw(
		formatChunkKey(0, 0),
		people.map((person) => person.toSnapshot()),
	);
}

async function loadFirstChunk(): Promise<Person[]> {
	const raw = await loadPopulationChunkRaw(formatChunkKey(0, 0));
	expect(Array.isArray(raw)).toBe(true);
	return (raw ?? []).map((snapshot) =>
		Person.fromSnapshot(snapshot as Parameters<typeof Person.fromSnapshot>[0]),
	);
}

beforeEach(() => {
	setupMemoryStorage();
});

describe("applyLaborEdict", () => {
	it("reassigns eligible workers and applies the happiness penalty", async () => {
		await ensureWorld(() => 0.5);
		await seedPopulation([
			makeWorker(),
			makeWorker({ categoryId: "services", subSectorId: "wholesale-retail" }),
		]);
		await saveGameRunState(createInitialGameRunState(2));

		const result = await applyLaborEdict({
			source: {
				categoryId: "industrial",
				subSectorId: "light-manufacturing",
			},
			target: {
				categoryId: "services",
				subSectorId: "wholesale-retail",
			},
			percent: 100,
			gameDay: 5,
			random: () => 0,
		});

		expect(result.affected).toBe(1);
		const people = await loadFirstChunk();
		const reassigned = people.find(
			(person) => person.getSubSectorId() === "wholesale-retail",
		);
		expect(reassigned?.getCategoryId()).toBe("services");
		expect(reassigned?.getRoleId()).toBeUndefined();
		expect(reassigned?.getOverallHappiness()).toBe(62);

		const run = await loadGameRunState();
		expect(run?.eventLog.at(-1)?.type).toBe("labor_edict");
	});

	it("skips extractive targets that are not viable in the worker's region", async () => {
		const regions = await ensureWorld(() => 0.5);
		const landRegion = regions.find((region) => region.terrain !== "ocean");
		expect(landRegion).toBeDefined();

		await seedPopulation([
			makeWorker({ regionId: landRegion?.id, happiness: 80 }),
		]);

		const result = await applyLaborEdict({
			source: {
				categoryId: "industrial",
				subSectorId: "light-manufacturing",
			},
			target: {
				categoryId: "extractive",
				subSectorId: "offshore-fishing",
			},
			percent: 100,
			gameDay: 9,
			random: () => 0,
		});

		expect(result.affected).toBe(0);
		const [worker] = await loadFirstChunk();
		expect(worker?.getCategoryId()).toBe("industrial");
		expect(worker?.getSubSectorId()).toBe("light-manufacturing");
		expect(worker?.getOverallHappiness()).toBe(80);
	});
});

describe("applyRoleReform", () => {
	it("rerolls roles for living workers in the target sector", async () => {
		const assignments = buildAutoAssignments();
		const roleConfigs = buildAutoRoleConfigs(assignments);
		await saveSectorRoleConfigs(roleConfigs);
		await seedPopulation([
			makeWorker({ roleId: 1 }),
			makeWorker({
				categoryId: "services",
				subSectorId: "wholesale-retail",
				roleId: 2,
			}),
		]);
		await saveGameRunState(createInitialGameRunState(2));

		const result = await applyRoleReform({
			categoryId: "industrial",
			subSectorId: "light-manufacturing",
			gameDay: 12,
			random: () => 0.99,
		});

		expect(result.affected).toBe(1);
		const people = await loadFirstChunk();
		const reformed = people.find(
			(person) => person.getSubSectorId() === "light-manufacturing",
		);
		expect(reformed?.getRoleId()).not.toBe(1);
		expect(reformed?.getOverallHappiness()).toBe(65);

		const untouched = people.find(
			(person) => person.getSubSectorId() === "wholesale-retail",
		);
		expect(untouched?.getRoleId()).toBe(2);

		const run = await loadGameRunState();
		expect(run?.eventLog.at(-1)?.type).toBe("role_reform");
	});

	it("returns zero affected when the sector has no role quotas configured", async () => {
		await seedPopulation([makeWorker()]);
		const key = sectorKey("industrial", "light-manufacturing");
		await saveSectorRoleConfigs({ [key]: { quotas: [] } });

		const result = await applyRoleReform({
			categoryId: "industrial",
			subSectorId: "light-manufacturing",
			gameDay: 3,
		});

		expect(result.affected).toBe(0);
	});
});
