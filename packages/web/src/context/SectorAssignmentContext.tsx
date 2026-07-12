import {
	getDefaultRoleQuotasForSystem,
	quotasSumToOne,
	type SectorRoleConfig,
	sectorKey,
	validateNationSetup,
} from "economy-simulator-data";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { EconomicSystemId } from "../lib/economic-systems";
import type { CategoryId } from "../lib/taxonomy";
import {
	getSectorAssignment,
	loadSectorAssignments,
	type SectorAssignments,
	setSectorAssignment,
} from "../repos/sector-assignments";
import {
	getSectorRoleConfig,
	loadSectorRoleConfigs,
	type SectorRoleConfigs,
	setSectorRoleConfig,
} from "../repos/sector-role-config";

interface SectorAssignmentContextValue {
	assignments: SectorAssignments;
	roleConfigs: SectorRoleConfigs;
	isReady: boolean;
	setupValidation: ReturnType<typeof validateNationSetup>;
	getAssignment: (
		categoryId: CategoryId,
		sectorId: string,
	) => EconomicSystemId | null;
	getRoleConfig: (
		categoryId: CategoryId,
		sectorId: string,
	) => SectorRoleConfig | null;
	setAssignment: (
		categoryId: CategoryId,
		sectorId: string,
		systemId: EconomicSystemId | null,
	) => Promise<void>;
	setRoleConfig: (
		categoryId: CategoryId,
		sectorId: string,
		config: SectorRoleConfig,
	) => Promise<void>;
	refresh: () => Promise<void>;
}

const SectorAssignmentContext =
	createContext<SectorAssignmentContextValue | null>(null);

function SectorAssignmentProvider({ children }: { children: ReactNode }) {
	const [assignments, setAssignments] = useState<SectorAssignments>({});
	const [roleConfigs, setRoleConfigs] = useState<SectorRoleConfigs>({});
	const [isReady, setIsReady] = useState(false);
	const assignmentsRef = useRef(assignments);
	const roleConfigsRef = useRef(roleConfigs);
	assignmentsRef.current = assignments;
	roleConfigsRef.current = roleConfigs;

	const refresh = useCallback(async () => {
		const [savedAssignments, savedRoleConfigs] = await Promise.all([
			loadSectorAssignments(),
			loadSectorRoleConfigs(),
		]);
		setAssignments(savedAssignments);
		setRoleConfigs(savedRoleConfigs);
	}, []);

	useEffect(() => {
		let cancelled = false;

		refresh()
			.then(() => {
				if (!cancelled) setIsReady(true);
			})
			.catch(() => {
				if (!cancelled) setIsReady(true);
			});

		return () => {
			cancelled = true;
		};
	}, [refresh]);

	const getAssignment = useCallback(
		(categoryId: CategoryId, sectorId: string) =>
			getSectorAssignment(assignments, categoryId, sectorId),
		[assignments],
	);

	const getRoleConfig = useCallback(
		(categoryId: CategoryId, sectorId: string) =>
			getSectorRoleConfig(roleConfigs, categoryId, sectorId),
		[roleConfigs],
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

			if (systemId) {
				const key = sectorKey(categoryId, sectorId);
				const existing = roleConfigsRef.current[key];
				if (!existing?.quotas?.length) {
					const nextRoleConfigs = await setSectorRoleConfig(
						roleConfigsRef.current,
						key,
						{ quotas: getDefaultRoleQuotasForSystem(systemId) },
					);
					setRoleConfigs(nextRoleConfigs);
				}
			}
		},
		[],
	);

	const setRoleConfigFn = useCallback(
		async (
			categoryId: CategoryId,
			sectorId: string,
			config: SectorRoleConfig,
		) => {
			const key = sectorKey(categoryId, sectorId);
			const next = await setSectorRoleConfig(
				roleConfigsRef.current,
				key,
				config,
			);
			setRoleConfigs(next);
		},
		[],
	);

	const setupValidation = useMemo(
		() => validateNationSetup(assignments, roleConfigs),
		[assignments, roleConfigs],
	);

	const value = useMemo(
		() => ({
			assignments,
			roleConfigs,
			isReady,
			setupValidation,
			getAssignment,
			getRoleConfig,
			setAssignment,
			setRoleConfig: setRoleConfigFn,
			refresh,
		}),
		[
			assignments,
			roleConfigs,
			isReady,
			setupValidation,
			getAssignment,
			getRoleConfig,
			setAssignment,
			setRoleConfigFn,
			refresh,
		],
	);

	return (
		<SectorAssignmentContext.Provider value={value}>
			{children}
		</SectorAssignmentContext.Provider>
	);
}

function useSectorAssignments() {
	const context = useContext(SectorAssignmentContext);
	if (!context) {
		throw new Error(
			"useSectorAssignments must be used within SectorAssignmentProvider",
		);
	}
	return context;
}

export { quotasSumToOne, SectorAssignmentProvider, useSectorAssignments };
