import type { Category } from "../data/taxonomy";
import { categories, categoryColorClasses } from "../data/taxonomy";

interface CategoryMapProps {
	onSelect: (categoryId: Category["id"]) => void;
}

const pyramidWidths = ["w-full", "w-[92%]", "w-[84%]", "w-[76%]", "w-[68%]"];

export function CategoryMap({ onSelect }: CategoryMapProps) {
	const ordered = [...categories].sort((a, b) => a.tier - b.tier);

	return (
		<div className="flex flex-col-reverse items-center gap-2">
			{ordered.map((category, index) => {
				const colors = categoryColorClasses[category.color];
				return (
					<button
						key={category.id}
						type="button"
						onClick={() => onSelect(category.id)}
						className={`group relative ${pyramidWidths[index]} cursor-pointer border-2 px-4 py-4 text-left transition-all hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight ${colors.bg} ${colors.border} ${colors.text}`}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="font-label text-[10px] tracking-overline opacity-80">
									Tier {category.tier} · {category.tierName}
								</p>
								<h2 className="mt-1 text-[10px] leading-relaxed sm:text-xs">
									{category.shortLabel}
								</h2>
								<p className="mt-2 hidden text-xs leading-relaxed opacity-90 sm:block">
									{category.description}
								</p>
							</div>
							<span className="shrink-0 border border-current/30 bg-neutral-950/10 px-2 py-1 font-label text-[10px] tracking-overline">
								{category.subSectors.length}
							</span>
						</div>
						<span className="absolute right-3 bottom-3 font-label text-[10px] tracking-overline opacity-0 transition-opacity group-hover:opacity-100">
							Explore →
						</span>
					</button>
				);
			})}
		</div>
	);
}
