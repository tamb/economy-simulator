import {
	type CategoryId,
	type Category as DataCategory,
	categories as dataCategories,
	getSubSector,
	type SubSector,
	sectorKey,
} from "economy-simulator-data";

/** UI-only accent color per category, keyed by id (not part of the shared reference data). */
const categoryColors: Record<CategoryId, string> = {
	extractive: "green",
	industrial: "orange",
	services: "cyan",
	knowledge: "blue",
	command: "red",
};

interface Category extends DataCategory {
	color: string;
}

const categories: Category[] = dataCategories.map((category) => ({
	...category,
	color: categoryColors[category.id],
}));

function getCategory(id: CategoryId): Category | undefined {
	return categories.find((category) => category.id === id);
}

const categoryColorClasses: Record<
	string,
	{ bg: string; border: string; text: string; muted: string; mutedText: string }
> = {
	green: {
		bg: "bg-green",
		border: "border-green-muted",
		text: "text-neutral-950",
		muted: "bg-green-muted",
		mutedText: "text-on-dark",
	},
	orange: {
		bg: "bg-orange",
		border: "border-orange-light",
		text: "text-neutral-950",
		muted: "bg-orange-light",
		mutedText: "text-neutral-950",
	},
	cyan: {
		bg: "bg-cyan",
		border: "border-cyan-dark",
		text: "text-neutral-950",
		muted: "bg-cyan-light",
		mutedText: "text-neutral-950",
	},
	blue: {
		bg: "bg-blue",
		border: "border-blue",
		text: "text-on-dark",
		muted: "bg-blue/20",
		mutedText: "text-foreground",
	},
	red: {
		bg: "bg-red",
		border: "border-red-dark",
		text: "text-on-dark",
		muted: "bg-red-dark",
		mutedText: "text-on-dark-muted",
	},
};

export type { Category, CategoryId, SubSector };
export {
	categories,
	categoryColorClasses,
	getCategory,
	getSubSector,
	sectorKey,
};
