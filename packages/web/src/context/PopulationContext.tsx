import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { POPULATION_SIZE } from "../data/population";
import { generatePopulation } from "../models/generatePopulation";
import type { Person } from "../models/Person";
import { loadPopulation, savePopulation } from "../storage/population";

interface PopulationContextValue {
	population: Person[];
	isReady: boolean;
	loadProgress: number;
	total: number;
}

const PopulationContext = createContext<PopulationContextValue | null>(null);

export function PopulationProvider({ children }: { children: ReactNode }) {
	const [population, setPopulation] = useState<Person[]>([]);
	const [isReady, setIsReady] = useState(false);
	const [loadProgress, setLoadProgress] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function initializePopulation() {
			const saved = await loadPopulation();
			if (saved) {
				if (!cancelled) {
					setPopulation(saved);
					setLoadProgress(saved.length);
					setIsReady(true);
				}
				return;
			}

			const generated = await generatePopulation(POPULATION_SIZE, (loaded) => {
				if (!cancelled) setLoadProgress(loaded);
			});

			if (cancelled) return;

			await savePopulation(generated);
			setPopulation(generated);
			setIsReady(true);
		}

		initializePopulation().catch(() => {
			if (!cancelled) setIsReady(true);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<PopulationContext.Provider
			value={{
				population,
				isReady,
				loadProgress,
				total: POPULATION_SIZE,
			}}
		>
			{children}
		</PopulationContext.Provider>
	);
}

export function usePopulation() {
	const context = useContext(PopulationContext);
	if (!context) {
		throw new Error("usePopulation must be used within PopulationProvider");
	}
	return context;
}
