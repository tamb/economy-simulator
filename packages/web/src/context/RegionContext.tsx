import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { RegionId } from "../lib/regions";
import { ensureRegionPool, type Region } from "../repos/regions";

interface RegionContextValue {
	regions: Region[];
	regionIds: RegionId[];
	getRegion: (id: RegionId | undefined) => Region | undefined;
	isReady: boolean;
	/** Reload named regions from the persisted world (e.g. after founding). */
	refreshRegions: () => Promise<Region[]>;
}

const RegionContext = createContext<RegionContextValue | null>(null);

function RegionProvider({ children }: { children: ReactNode }) {
	const [regions, setRegions] = useState<Region[]>([]);
	const [isReady, setIsReady] = useState(false);

	const refreshRegions = useCallback(async () => {
		const pool = await ensureRegionPool();
		setRegions(pool);
		setIsReady(true);
		return pool;
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function initializeRegions() {
			const pool = await ensureRegionPool();
			if (cancelled) return;

			setRegions(pool);
			setIsReady(true);
		}

		initializeRegions().catch(() => {
			if (!cancelled) setIsReady(true);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	const regionIds = regions.map((region) => region.id);

	return (
		<RegionContext.Provider
			value={{
				regions,
				regionIds,
				getRegion: (id) => regions.find((region) => region.id === id),
				isReady,
				refreshRegions,
			}}
		>
			{children}
		</RegionContext.Provider>
	);
}

function useRegions() {
	const context = useContext(RegionContext);
	if (!context) {
		throw new Error("useRegions must be used within RegionProvider");
	}
	return context;
}

export { RegionProvider, useRegions };
