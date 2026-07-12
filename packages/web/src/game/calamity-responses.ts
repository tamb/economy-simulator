import { getCalamityResponseCopy } from "economy-simulator-data";
import type {
	ActiveCalamity,
	CalamityPlayerResponse,
	GameEvent,
	GameRunState,
} from "economy-simulator-persistence";
import { appendGameEvents } from "economy-simulator-persistence";

interface CalamityResponseEffect {
	happinessPenaltyScale: number;
	extractionHitScale: number;
	/** Fraction of remaining mid-term days to keep (1 = full duration). */
	midTermRemainingFactor: number;
	label: string;
	detail: string;
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

	return {
		...calamity,
		playerResponse: response,
		happinessPenaltyScale: effect.happinessPenaltyScale,
		extractionHitScale: effect.extractionHitScale,
		midTermEndsOnGameDay: nextMid,
		longTermEndsOnGameDay: nextLong,
	};
}

/**
 * Apply the same player response to every pending onset instance, log events,
 * and return the updated run.
 */
function applyCalamityResponses(
	gameRun: GameRunState,
	instanceIds: string[],
	response: CalamityPlayerResponse,
	gameDay: number,
): GameRunState {
	const idSet = new Set(instanceIds);
	const effect = RESPONSE_EFFECTS[response];
	const events: GameEvent[] = [];

	const activeCalamities = gameRun.activeCalamities.map((calamity) => {
		if (!idSet.has(calamity.instanceId) || calamity.playerResponse) {
			return calamity;
		}
		events.push({
			id: `response-${calamity.instanceId}-${response}`,
			gameDay,
			type: "calamity_response",
			title: `${effect.label}: ${calamity.name}`,
			detail: effect.detail,
		});
		return applyResponseToCalamity(calamity, response, gameDay);
	});

	return appendGameEvents({ ...gameRun, activeCalamities }, events);
}

export type { CalamityResponseEffect };
export { applyCalamityResponses, RESPONSE_EFFECTS };
