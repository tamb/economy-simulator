import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { SetupAppShell } from "./components/SetupAppShell";
import { usePopulation } from "./context/PopulationContext";
import { AtlasCategoriesPage } from "./pages/AtlasCategoriesPage";
import { AtlasSectorPage } from "./pages/AtlasSectorPage";
import { CreditsPage } from "./pages/CreditsPage";
import { EconomicAtlasPage } from "./pages/EconomicAtlasPage";
import { InstructionsPage } from "./pages/InstructionsPage";
import { NationSetupPage } from "./pages/NationSetupPage";
import { NewGameSetupPage } from "./pages/NewGameSetupPage";
import { PopulationPage } from "./pages/PopulationPage";
import { RecordsPage } from "./pages/RecordsPage";

const CountryMapPage = lazy(() =>
	import("./pages/CountryMapPage").then((m) => ({
		default: m.CountryMapPage,
	})),
);
const DashboardsPage = lazy(() =>
	import("./pages/DashboardsPage").then((m) => ({
		default: m.DashboardsPage,
	})),
);

function PageLoadingFallback() {
	return <p className="text-sm text-muted-foreground">Loading…</p>;
}

function App() {
	const { needsSetup, needsConfiguration, startGeneration } = usePopulation();

	if (needsSetup) {
		return (
			<NewGameSetupPage
				onStart={(size) => {
					startGeneration(size).catch(() => undefined);
				}}
			/>
		);
	}

	if (needsConfiguration) {
		return (
			<Routes>
				<Route element={<SetupAppShell />}>
					<Route path="setup" element={<NationSetupPage />} />
					<Route path="atlas" element={<EconomicAtlasPage />}>
						<Route index element={<AtlasCategoriesPage />} />
						<Route path=":categoryId" element={<AtlasSectorPage />} />
						<Route path=":categoryId/:sectorId" element={<AtlasSectorPage />} />
					</Route>
					<Route path="*" element={<Navigate to="setup" replace />} />
				</Route>
			</Routes>
		);
	}

	return (
		<Routes>
			<Route element={<AppShell />}>
				<Route index element={<Navigate to="/map" replace />} />
				<Route
					path="map"
					element={
						<Suspense fallback={<PageLoadingFallback />}>
							<CountryMapPage />
						</Suspense>
					}
				/>
				<Route path="atlas" element={<EconomicAtlasPage />}>
					<Route index element={<AtlasCategoriesPage />} />
					<Route path=":categoryId" element={<AtlasSectorPage />} />
					<Route path=":categoryId/:sectorId" element={<AtlasSectorPage />} />
				</Route>
				<Route path="population" element={<PopulationPage />} />
				<Route
					path="dashboards"
					element={
						<Suspense fallback={<PageLoadingFallback />}>
							<DashboardsPage />
						</Suspense>
					}
				/>
				<Route path="instructions" element={<InstructionsPage />} />
				<Route path="records" element={<RecordsPage />} />
				<Route path="credits" element={<CreditsPage />} />
				<Route path="*" element={<Navigate to="/map" replace />} />
			</Route>
		</Routes>
	);
}

export default App;
