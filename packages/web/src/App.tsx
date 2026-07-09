import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { usePopulation } from "./context/PopulationContext";
import { AtlasCategoriesPage } from "./pages/AtlasCategoriesPage";
import { AtlasSectorPage } from "./pages/AtlasSectorPage";
import { CreditsPage } from "./pages/CreditsPage";
import { EconomicAtlasPage } from "./pages/EconomicAtlasPage";
import { InstructionsPage } from "./pages/InstructionsPage";
import { NewGameSetupPage } from "./pages/NewGameSetupPage";
import { PopulationPage } from "./pages/PopulationPage";
import { RecordsPage } from "./pages/RecordsPage";

// Lazy-loaded into their own chunks: both pull in sizeable third-party
// dependencies (chart.js/react-chartjs-2, honeycomb-grid) that were
// previously bundled into the single main chunk, which triggered a
// module-initialization-order bug ("Cannot read properties of null (reading
// 'useRef')" inside react-chartjs-2). Splitting them out fixes that and
// trims the initial bundle.
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
	const { needsSetup, startGeneration } = usePopulation();

	if (needsSetup) {
		return (
			<NewGameSetupPage
				onStart={(size) => {
					startGeneration(size).catch(() => undefined);
				}}
			/>
		);
	}

	return (
		<Routes>
			<Route element={<AppShell />}>
				<Route index element={<Navigate to="/atlas" replace />} />
				<Route path="atlas" element={<EconomicAtlasPage />}>
					<Route index element={<AtlasCategoriesPage />} />
					<Route path=":categoryId" element={<AtlasSectorPage />} />
					<Route path=":categoryId/:sectorId" element={<AtlasSectorPage />} />
				</Route>
				<Route path="population" element={<PopulationPage />} />
				<Route
					path="map"
					element={
						<Suspense fallback={<PageLoadingFallback />}>
							<CountryMapPage />
						</Suspense>
					}
				/>
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
				<Route path="*" element={<Navigate to="/atlas" replace />} />
			</Route>
		</Routes>
	);
}

export default App;
