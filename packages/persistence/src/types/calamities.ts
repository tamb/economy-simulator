import type { CalamitySeverity } from "economy-simulator-data";

type CalamityPhase = "midTerm" | "longTerm";
type CalamityPlayerResponse = "relief" | "rebuild" | "endure";

interface ActiveCalamity {
	instanceId: string;
	calamityId: string;
	name: string;
	severity: CalamitySeverity;
	regionIds: string[];
	startedOnGameDay: number;
	/** Mid-term (visible nation debuff) ends on this day. */
	midTermEndsOnGameDay: number;
	/** Long-term scar modifiers end on this day (>= midTermEndsOnGameDay). */
	longTermEndsOnGameDay: number;
	/** True if this instance was spawned as a cascade from another calamity. */
	fromCascade: boolean;
	/** Player response chosen at onset, if any. */
	playerResponse?: CalamityPlayerResponse;
	/** Scales mid/long-term happiness penalties (1 = catalog default). */
	happinessPenaltyScale?: number;
	/**
	 * Scales how hard extraction is hit: 1 = full catalog hit, 0 = no hit.
	 * Applied as `1 - (1 - catalogFactor) * extractionHitScale`.
	 */
	extractionHitScale?: number;
}

interface CalamityHistoryEntry {
	instanceId: string;
	calamityId: string;
	name: string;
	severity: CalamitySeverity;
	regionIds: string[];
	startedOnGameDay: number;
	endedOnGameDay: number;
	year: number;
}

function createEmptyCalamityState(): {
	activeCalamities: ActiveCalamity[];
	calamityHistory: CalamityHistoryEntry[];
	lastCalamityOnsetGameDay: number | null;
	lastSevereCalamityOnsetGameDay: number | null;
} {
	return {
		activeCalamities: [],
		calamityHistory: [],
		lastCalamityOnsetGameDay: null,
		lastSevereCalamityOnsetGameDay: null,
	};
}

export type {
	ActiveCalamity,
	CalamityHistoryEntry,
	CalamityPhase,
	CalamityPlayerResponse,
};
export { createEmptyCalamityState };
