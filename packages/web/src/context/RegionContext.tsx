import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import type { RegionId } from "../data/regions";
import { ensureRegionPool, type Region } from "../storage/regions";

interface RegionContextValue {
	regions: Region[];
	regionIds: RegionId[];
	getRegion: (id: RegionId | undefined) => Region | undefined;
	isReady: boolean;
}

const RegionContext = createContext<RegionContextValue | null>(null);

function RegionProvider({ children }: { children: ReactNode }) {
	const [regions, setRegions] = useState<Region[]>([]);
	const [isReady, setIsReady] = useState(false);

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
