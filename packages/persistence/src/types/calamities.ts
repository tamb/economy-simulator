import type { CalamitySeverity } from "economy-simulator-data";

type CalamityPhase = "midTerm" | "longTerm";

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

export type { ActiveCalamity, CalamityHistoryEntry, CalamityPhase };
export { createEmptyCalamityState };
