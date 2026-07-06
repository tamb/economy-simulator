import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { EconomicSystemId } from "../data/economic-systems";
import type { CategoryId } from "../data/taxonomy";
import {
	getSectorAssignment,
	loadSectorAssignments,
	type SectorAssignments,
	setSectorAssignment,
} from "../storage/sector-assignments";

interface SectorAssignmentContextValue {
	assignments: SectorAssignments;
	isReady: boolean;
	getAssignment: (
		categoryId: CategoryId,
		sectorId: string,
	) => EconomicSystemId | null;
	setAssignment: (
		categoryId: CategoryId,
		sectorId: string,
		systemId: EconomicSystemId | null,
	) => Promise<void>;
}

const SectorAssignmentContext =
	createContext<SectorAssignmentContextValue | null>(null);

export function SectorAssignmentProvider({ children }: { children: ReactNode }) {
	const [assignments, setAssignments] = useState<SectorAssignments>({});
	const [isReady, setIsReady] = useState(false);
	const assignmentsRef = useRef(assignments);
	assignmentsRef.current = assignments;

	useEffect(() => {
		let cancelled = false;

		loadSectorAssignments()
			.then((saved) => {
				if (!cancelled) {
					setAssignments(saved);
					setIsReady(true);
				}
			})
			.catch(() => {
				if (!cancelled) setIsReady(true);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const getAssignment = useCallback(
		(categoryId: CategoryId, sectorId: string) =>
			getSectorAssignment(assignments, categoryId, sectorId),
		[assignments],
	);

	const setAssignment = useCallback(
		async (
			categoryId: CategoryId,
			sectorId: string,
			systemId: EconomicSystemId | null,
		) => {
			const next = await setSectorAssignment(
				assignmentsRef.current,
				categoryId,
				sectorId,
				systemId,
			);
			setAssignments(next);
		},
		[],
	);

	const value = useMemo(
		() => ({ assignments, isReady, getAssignment, setAssignment }),
		[assignments, isReady, getAssignment, setAssignment],
	);

	return (
		<SectorAssignmentContext.Provider value={value}>
			{children}
		</SectorAssignmentContext.Provider>
	);
}

export function useSectorAssignments() {
	const context = useContext(SectorAssignmentContext);
	if (!context) {
		throw new Error(
			"useSectorAssignments must be used within SectorAssignmentProvider",
		);
	}
	return context;
}
