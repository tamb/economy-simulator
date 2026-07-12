import { Link, Outlet, useParams } from "react-router";
import { type CategoryId, getCategory } from "../lib/taxonomy";

/**
 * Breadcrumb layout shared by the atlas' nested routes (category grid ->
 * sector map -> sector detail); the active view itself renders via
 * `<Outlet />` (see `AtlasCategoriesPage` / `AtlasSectorPage`).
 */
function EconomicAtlasPage() {
	const params = useParams<{ categoryId?: string; sectorId?: string }>();
	const category = params.categoryId
		? getCategory(params.categoryId as CategoryId)
		: null;
	const sector = category?.subSectors.find(
		(candidate) => candidate.id === params.sectorId,
	);

	return (
		<div className="space-y-6">
			<nav
				className="flex flex-wrap items-center gap-2 font-label text-[10px] tracking-overline"
				aria-label="Map navigation"
			>
				<Link
					to="/atlas"
					className={`cursor-pointer border px-2 py-1 transition-colors ${
						!category
							? "border-primary bg-primary text-primary-foreground"
							: "border-primary/30 bg-surface-muted text-muted-foreground hover:border-primary"
					}`}
				>
					Economic Map
				</Link>
				{category && (
					<>
						<span className="text-muted-foreground">/</span>
						<Link
							to={`/atlas/${category.id}`}
							className={`cursor-pointer border px-2 py-1 transition-colors ${
								!sector
									? "border-primary bg-primary text-primary-foreground"
									: "border-primary/30 bg-surface-muted text-muted-foreground hover:border-primary"
							}`}
						>
							{category.shortLabel}
						</Link>
					</>
				)}
				{category && sector && (
					<>
						<span className="text-muted-foreground">/</span>
						<span className="border border-primary bg-surface px-2 py-1 text-foreground">
							{sector.label}
						</span>
					</>
				)}
			</nav>

			<Outlet />
		</div>
	);
}

export { EconomicAtlasPage };
