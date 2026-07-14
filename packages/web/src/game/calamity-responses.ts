import type { ResourceId } from "economy-simulator-data";
import { gameSettings, getCalamityResponseCopy } from "economy-simulator-data";
import type {
	ActiveCalamity,
	CalamityPlayerResponse,
	GameEvent,
	GameRunState,
} from "economy-simulator-persistence";
import { appendGameEvents } from "economy-simulator-persistence";
import {
	spendStockpileForCalamityResponse,
	spendTreasuryForCalamityResponse,
} from "economy-simulator-simulation";

interface CalamityResponseEffect {
	happinessPenaltyScale: number;
	extractionHitScale: number;
	/** Fraction of remaining mid-term days to keep (1 = full duration). */
	midTermRemainingFactor: number;
	label: string;
	detail: string;
}

/**
 * Spend API for calamity responses (Phase 0a/0c stockpile + Phase 1b treasury).
 *
 * Relief and Rebuild may optionally consume national stockpile and treasury.
 * When a spend succeeds, response scales are further blunted.
 * Endure never spends. Callers persist remaining stockpile / treasury.
 */
interface CalamityResponseSpendInput {
	stockpileByResource?: Partial<Record<ResourceId, number>>;
	treasury?: number;
}

interface CalamityResponseSpendResult {
	gameRun: GameRunState;
	/** True when stockpile was debited for at least one onset. */
	didSpendStockpile: boolean;
	totalStockpileSpent: number;
	remainingStockpileByResource: Partial<Record<ResourceId, number>>;
	didSpendTreasury: boolean;
	totalTreasurySpent: number;
	remainingTreasury: number;
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
	treasurySpent: boolean,
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
	if (treasurySpent && response === "relief") {
		happinessPenaltyScale *= gameSettings.fiscal.reliefTreasuryBlunt;
	}
	if (treasurySpent && response === "rebuild") {
		extractionHitScale *= gameSettings.fiscal.rebuildTreasuryBlunt;
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
 * spend national stockpile and treasury, log events, and return the updated run.
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
	let remainingTreasury = spendInput.treasury ?? 0;
	let didSpendStockpile = false;
	let totalStockpileSpent = 0;
	let didSpendTreasury = false;
	let totalTreasurySpent = 0;

	const pendingCount = gameRun.activeCalamities.filter(
		(calamity) => idSet.has(calamity.instanceId) && !calamity.playerResponse,
	).length;

	// Spend once for the batch of simultaneous onsets (not per instance).
	if (pendingCount > 0 && response !== "endure") {
		const stockSpend = spendStockpileForCalamityResponse(
			remainingStockpileByResource,
			response,
		);
		if (stockSpend.didSpend) {
			didSpendStockpile = true;
			totalStockpileSpent = stockSpend.totalSpent;
			remainingStockpileByResource = stockSpend.remainingByResource;
		}
		const treasurySpend = spendTreasuryForCalamityResponse(
			remainingTreasury,
			response,
		);
		if (treasurySpend.didSpend) {
			didSpendTreasury = true;
			totalTreasurySpent = treasurySpend.spent;
			remainingTreasury = treasurySpend.remainingTreasury;
		}
	}

	const activeCalamities = gameRun.activeCalamities.map((calamity) => {
		if (!idSet.has(calamity.instanceId) || calamity.playerResponse) {
			return calamity;
		}
		const spendNotes: string[] = [];
		if (didSpendStockpile) {
			spendNotes.push(
				`Stockpile spent: ${totalStockpileSpent.toFixed(1)} units`,
			);
		}
		if (didSpendTreasury) {
			spendNotes.push(`Treasury spent: ${totalTreasurySpent.toFixed(0)}`);
		}
		const spendNote = spendNotes.length > 0 ? ` ${spendNotes.join(". ")}.` : "";
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
			didSpendTreasury,
		);
	});

	return {
		gameRun: appendGameEvents({ ...gameRun, activeCalamities }, events),
		didSpendStockpile,
		totalStockpileSpent,
		remainingStockpileByResource,
		didSpendTreasury,
		totalTreasurySpent,
		remainingTreasury,
	};
}

export type {
	CalamityResponseEffect,
	CalamityResponseSpendInput,
	CalamityResponseSpendResult,
};
export { applyCalamityResponses, RESPONSE_EFFECTS };
