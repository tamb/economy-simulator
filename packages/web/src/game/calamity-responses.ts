import type { ResourceId } from "economy-simulator-data";
import { gameSettings, getCalamityResponseCopy } from "economy-simulator-data";
import type {
	ActiveCalamity,
	CalamityPlayerResponse,
	GameEvent,
	GameRunState,
} from "economy-simulator-persistence";
import { appendGameEvents } from "economy-simulator-persistence";
import { spendStockpileForCalamityResponse } from "economy-simulator-simulation";

interface CalamityResponseEffect {
	happinessPenaltyScale: number;
	extractionHitScale: number;
	/** Fraction of remaining mid-term days to keep (1 = full duration). */
	midTermRemainingFactor: number;
	label: string;
	detail: string;
}

/**
 * Spend API for calamity responses (Phase 0a hooks → 0c stockpile / 1b treasury).
 *
 * Relief and Rebuild may optionally consume national stockpile (and later
 * treasury). When a spend succeeds, response scales are further blunted.
 * Endure never spends. Callers persist `remainingStockpileByResource` back
 * onto the national ledger.
 */
interface CalamityResponseSpendInput {
	stockpileByResource?: Partial<Record<ResourceId, number>>;
}

interface CalamityResponseSpendResult {
	gameRun: GameRunState;
	/** True when stockpile was debited for at least one onset. */
	didSpendStockpile: boolean;
	totalStockpileSpent: number;
	remainingStockpileByResource: Partial<Record<ResourceId, number>>;
}

/** Numeric scales live here; labels/details come from `copy/calamities/responses.json`. */
const RESPONSE_SCALES: Record<
	CalamityPlayerResponse,
	Omit<CalamityResponseEffect, "label" | "detail">
> = {
	endure: {
		happinessPenaltyScale: 1,
		extractionHitScale: 1,
		midTermRemainingFactor: 1,
	},
	relief: {
		happinessPenaltyScale: 0.55,
		extractionHitScale: 1,
		midTermRemainingFactor: 0.55,
	},
	rebuild: {
		happinessPenaltyScale: 1.15,
		extractionHitScale: 0.45,
		midTermRemainingFactor: 0.85,
	},
};

const RESPONSE_EFFECTS: Record<CalamityPlayerResponse, CalamityResponseEffect> =
	{
		endure: {
			...RESPONSE_SCALES.endure,
			...getCalamityResponseCopy("endure"),
		},
		relief: {
			...RESPONSE_SCALES.relief,
			...getCalamityResponseCopy("relief"),
		},
		rebuild: {
			...RESPONSE_SCALES.rebuild,
			...getCalamityResponseCopy("rebuild"),
		},
	};

function applyResponseToCalamity(
	calamity: ActiveCalamity,
	response: CalamityPlayerResponse,
	gameDay: number,
	stockSpent: boolean,
): ActiveCalamity {
	const effect = RESPONSE_EFFECTS[response];
	const remainingMid = Math.max(0, calamity.midTermEndsOnGameDay - gameDay);
	const remainingLong = Math.max(0, calamity.longTermEndsOnGameDay - gameDay);
	const nextMid = Math.max(
		gameDay + 1,
		gameDay + Math.ceil(remainingMid * effect.midTermRemainingFactor),
	);
	const nextLong = Math.max(
		nextMid,
		gameDay + Math.ceil(remainingLong * effect.midTermRemainingFactor),
	);

	let happinessPenaltyScale = effect.happinessPenaltyScale;
	let extractionHitScale = effect.extractionHitScale;
	if (stockSpent && response === "relief") {
		happinessPenaltyScale *=
			gameSettings.resources.stockpile.reliefStockpileBlunt;
	}
	if (stockSpent && response === "rebuild") {
		extractionHitScale *=
			gameSettings.resources.stockpile.rebuildStockpileBlunt;
	}

	return {
		...calamity,
		playerResponse: response,
		happinessPenaltyScale,
		extractionHitScale,
		midTermEndsOnGameDay: nextMid,
		longTermEndsOnGameDay: nextLong,
	};
}

/**
 * Apply the same player response to every pending onset instance, optionally
 * spend national stockpile (Phase 0c), log events, and return the updated run.
 */
function applyCalamityResponses(
	gameRun: GameRunState,
	instanceIds: string[],
	response: CalamityPlayerResponse,
	gameDay: number,
	spendInput: CalamityResponseSpendInput = {},
): CalamityResponseSpendResult {
	const idSet = new Set(instanceIds);
	const effect = RESPONSE_EFFECTS[response];
	const events: GameEvent[] = [];

	let remainingStockpileByResource = {
		...(spendInput.stockpileByResource ?? {}),
	};
	let didSpendStockpile = false;
	let totalStockpileSpent = 0;

	const pendingCount = gameRun.activeCalamities.filter(
		(calamity) => idSet.has(calamity.instanceId) && !calamity.playerResponse,
	).length;

	// Spend once for the batch of simultaneous onsets (not per instance).
	if (pendingCount > 0 && response !== "endure") {
		const spend = spendStockpileForCalamityResponse(
			remainingStockpileByResource,
			response,
		);
		if (spend.didSpend) {
			didSpendStockpile = true;
			totalStockpileSpent = spend.totalSpent;
			remainingStockpileByResource = spend.remainingByResource;
		}
	}

	const activeCalamities = gameRun.activeCalamities.map((calamity) => {
		if (!idSet.has(calamity.instanceId) || calamity.playerResponse) {
			return calamity;
		}
		const spendNote = didSpendStockpile
			? ` Stockpile spent: ${totalStockpileSpent.toFixed(1)} units.`
			: "";
		events.push({
			id: `response-${calamity.instanceId}-${response}`,
			gameDay,
			type: "calamity_response",
			title: `${effect.label}: ${calamity.name}`,
			detail: `${effect.detail}${spendNote}`,
		});
		return applyResponseToCalamity(
			calamity,
			response,
			gameDay,
			didSpendStockpile,
		);
	});

	return {
		gameRun: appendGameEvents({ ...gameRun, activeCalamities }, events),
		didSpendStockpile,
		totalStockpileSpent,
		remainingStockpileByResource,
	};
}

export type {
	CalamityResponseEffect,
	CalamityResponseSpendInput,
	CalamityResponseSpendResult,
};
export { applyCalamityResponses, RESPONSE_EFFECTS };
