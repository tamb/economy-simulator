import { Navigate, useNavigate, useParams } from "react-router";
import { SectorMap } from "../components/SectorMap";
import { type CategoryId, getCategory } from "../lib/taxonomy";

/** Renders for both `/atlas/:categoryId` and `/atlas/:categoryId/:sectorId`. */
function AtlasSectorPage() {
	const { categoryId, sectorId } = useParams<{
		categoryId: string;
		sectorId?: string;
	}>();
	const navigate = useNavigate();
	const category = categoryId
		? getCategory(categoryId as CategoryId)
		: undefined;

	if (!category) {
		return <Navigate to="/atlas" replace />;
	}

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">{category.label}</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Select a sub-sector and assign an economic system. Assignments are
					saved locally.
				</p>
			</header>

			<SectorMap
				category={category}
				selectedSectorId={sectorId ?? null}
				onSelect={(id) => navigate(`/atlas/${category.id}/${id}`)}
			/>
		</div>
	);
}

export { AtlasSectorPage };
