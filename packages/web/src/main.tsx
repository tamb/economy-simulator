import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PopulationProvider } from "./context/PopulationContext";
import { SectorAssignmentProvider } from "./context/SectorAssignmentContext";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
	<StrictMode>
		<PopulationProvider>
			<SectorAssignmentProvider>
				<App />
			</SectorAssignmentProvider>
		</PopulationProvider>
	</StrictMode>,
);
