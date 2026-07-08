import type { FaceConfig } from "facesjs";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { FACE_POOL_SIZE, type FaceId } from "../data/faces";
import { ensureFacePool, loadFacePool } from "../storage/faces";

interface FacePoolContextValue {
	faceIds: FaceId[];
	getFace: (id: FaceId | undefined) => FaceConfig | undefined;
	isReady: boolean;
}

const FacePoolContext = createContext<FacePoolContextValue | null>(null);

function FacePoolProvider({ children }: { children: ReactNode }) {
	const [facePool, setFacePool] = useState<Map<FaceId, FaceConfig>>(new Map());
	const [faceIds, setFaceIds] = useState<FaceId[]>([]);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function initializeFacePool() {
			const ids = await ensureFacePool();
			const pool = await loadFacePool();

			if (cancelled) return;

			setFaceIds(ids);
			setFacePool(pool);
			setIsReady(pool.size === FACE_POOL_SIZE);
		}

		initializeFacePool().catch(() => {
			if (!cancelled) setIsReady(true);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<FacePoolContext.Provider
			value={{
				faceIds,
				getFace: (id) => (id ? facePool.get(id) : undefined),
				isReady,
			}}
		>
			{children}
		</FacePoolContext.Provider>
	);
}

function useFacePool() {
	const context = useContext(FacePoolContext);
	if (!context) {
		throw new Error("useFacePool must be used within FacePoolProvider");
	}
	return context;
}

export { FacePoolProvider, useFacePool };
