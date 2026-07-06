import { useState } from "react";
import { AppShell, type AppPage } from "./components/AppShell";
import { CreditsPage } from "./pages/CreditsPage";
import { EconomicAtlasPage } from "./pages/EconomicAtlasPage";
import { PopulationPage } from "./pages/PopulationPage";

function renderPage(page: AppPage) {
	switch (page) {
		case "atlas":
			return <EconomicAtlasPage />;
		case "population":
			return <PopulationPage />;
		case "credits":
			return <CreditsPage />;
	}
}

export default function App() {
	const [page, setPage] = useState<AppPage>("atlas");

	return (
		<AppShell page={page} onPageChange={setPage}>
			{renderPage(page)}
		</AppShell>
	);
}
