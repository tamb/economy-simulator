import { useCallback, useEffect, useState } from "react";
import {
	type CategoryId,
	categories,
	getCategory,
} from "../data/taxonomy";
import { CategoryMap } from "./CategoryMap";
import { SectorMap } from "./SectorMap";

type View = "categories" | "sectors";

function parseHash(): { categoryId: CategoryId | null; sectorId: string | null } {
	const hash = window.location.hash.replace(/^#/, "");
	if (!hash) return { categoryId: null, sectorId: null };

	const [categoryId, sectorId] = hash.split("/");
	if (!getCategory(categoryId as CategoryId)) {
		return { categoryId: null, sectorId: null };
	}

	return {
		categoryId: categoryId as CategoryId,
		sectorId: sectorId ?? null,
	};
}

export function EconomicMap() {
	const [view, setView] = useState<View>("categories");
	const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
	const [sectorId, setSectorId] = useState<string | null>(null);

	const syncFromHash = useCallback(() => {
		const { categoryId: hashCategory, sectorId: hashSector } = parseHash();
		if (hashCategory) {
			setCategoryId(hashCategory);
			setSectorId(hashSector);
			setView("sectors");
		} else {
			setCategoryId(null);
			setSectorId(null);
			setView("categories");
		}
	}, []);

	useEffect(() => {
		syncFromHash();
		window.addEventListener("hashchange", syncFromHash);
		return () => window.removeEventListener("hashchange", syncFromHash);
	}, [syncFromHash]);

	const updateHash = (nextCategory: CategoryId | null, nextSector: string | null) => {
		if (nextCategory) {
			window.location.hash = nextSector
				? `${nextCategory}/${nextSector}`
				: nextCategory;
		} else {
			history.pushState(null, "", window.location.pathname);
		}
	};

	const handleCategorySelect = (id: CategoryId) => {
		setCategoryId(id);
		setSectorId(null);
		setView("sectors");
		updateHash(id, null);
	};

	const handleSectorSelect = (id: string) => {
		setSectorId(id);
		if (categoryId) updateHash(categoryId, id);
	};

	const handleBackToCategories = () => {
		setCategoryId(null);
		setSectorId(null);
		setView("categories");
		updateHash(null, null);
	};

	const handleBackToSectorMap = () => {
		setSectorId(null);
		if (categoryId) updateHash(categoryId, null);
	};

	const category = categoryId ? getCategory(categoryId) : null;
	const totalSectors = categories.reduce(
		(sum, item) => sum + item.subSectors.length,
		0,
	);

	return (
		<div className="space-y-6">
			<nav
				className="flex flex-wrap items-center gap-2 font-label text-[10px] tracking-overline"
				aria-label="Map navigation"
			>
				<button
					type="button"
					onClick={handleBackToCategories}
					className={`cursor-pointer border px-2 py-1 transition-colors ${
						view === "categories"
							? "border-primary bg-primary text-primary-foreground"
							: "border-primary/30 bg-surface-muted text-muted-foreground hover:border-primary"
					}`}
				>
					Economic Map
				</button>
				{category && (
					<>
						<span className="text-muted-foreground">/</span>
						<button
							type="button"
							onClick={handleBackToSectorMap}
							className={`cursor-pointer border px-2 py-1 transition-colors ${
								view === "sectors" && !sectorId
									? "border-primary bg-primary text-primary-foreground"
									: "border-primary/30 bg-surface-muted text-muted-foreground hover:border-primary"
							}`}
						>
							{category.shortLabel}
						</button>
					</>
				)}
				{category && sectorId && (
					<>
						<span className="text-muted-foreground">/</span>
						<span className="border border-primary bg-surface px-2 py-1 text-foreground">
							{category.subSectors.find((s) => s.id === sectorId)?.label ??
								sectorId}
						</span>
					</>
				)}
			</nav>

			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">
					{view === "categories"
						? "Five-Sector Economic Pyramid"
						: `${category?.label ?? "Sector Map"}`}
				</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{view === "categories"
						? `Select a tier to explore ${totalSectors} sub-sectors across the production stack — from extraction to command.`
						: "Select a sub-sector and assign an economic system. Assignments are saved locally."}
				</p>
			</header>

			{view === "categories" && categoryId === null && (
				<CategoryMap onSelect={handleCategorySelect} />
			)}

			{view === "sectors" && category && (
				<SectorMap
					category={category}
					selectedSectorId={sectorId}
					onSelect={handleSectorSelect}
				/>
			)}
		</div>
	);
}
