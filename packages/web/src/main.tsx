import { appConfig } from "economy-simulator-data";
import {
	createStorageDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import App from "./App";
import { FacePoolProvider } from "./context/FacePoolContext";
import { PopulationProvider } from "./context/PopulationContext";
import { RegionProvider } from "./context/RegionContext";
import { SectorAssignmentProvider } from "./context/SectorAssignmentContext";
import { registerChartTheme } from "./data/chart-theme";
import "./index.css";

registerChartTheme();

setStorageDriver(createStorageDriver(appConfig.storage));

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
	<StrictMode>
		<FacePoolProvider>
			<RegionProvider>
				<SectorAssignmentProvider>
					<PopulationProvider>
						{/*
						 * HashRouter (not BrowserRouter): the desktop build is served by
						 * Neutralino's static file server, which has no SPA fallback for
						 * arbitrary paths. Keeping the whole route in the URL fragment
						 * means every navigation still resolves to the same index.html.
						 */}
						<HashRouter>
							<App />
						</HashRouter>
					</PopulationProvider>
				</SectorAssignmentProvider>
			</RegionProvider>
		</FacePoolProvider>
	</StrictMode>,
);
