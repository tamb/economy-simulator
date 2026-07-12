import { useNavigate } from "react-router";
import { CategoryMap } from "../components/CategoryMap";
import { categories } from "../lib/taxonomy";

/** Index route for `/atlas` — the five-tier category pyramid. */
function AtlasCategoriesPage() {
	const navigate = useNavigate();
	const totalSectors = categories.reduce(
		(sum, item) => sum + item.subSectors.length,
		0,
	);

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Five-Sector Economic Pyramid</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Select a tier to explore {totalSectors} sub-sectors across the
					production stack — from extraction to command.
				</p>
			</header>

			<CategoryMap onSelect={(id) => navigate(`/atlas/${id}`)} />
		</div>
	);
}

export { AtlasCategoriesPage };
