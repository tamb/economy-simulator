import { badgeDefinitions, getBadgeDefinition } from "economy-simulator-data";
import type { PlayerProfile } from "economy-simulator-persistence";

interface BadgeGalleryProps {
	profile: PlayerProfile | null;
	runBadges?: readonly string[];
}

function BadgeGallery({ profile, runBadges = [] }: BadgeGalleryProps) {
	const unlockedIds = new Set([
		...(profile?.unlockedBadges.map((badge) => badge.id) ?? []),
		...runBadges,
	]);

	return (
		<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
			{badgeDefinitions.map((badge) => {
				const unlocked = unlockedIds.has(badge.id);
				return (
					<li
						key={badge.id}
						className={`border-2 px-3 py-2 ${
							unlocked
								? "border-primary bg-surface-muted"
								: "border-primary/20 bg-surface-muted/50 opacity-60"
						}`}
					>
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							{badge.scope === "career" ? "Career" : "Run"}
						</p>
						<p className="text-sm">{badge.title}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{badge.description}
						</p>
					</li>
				);
			})}
		</ul>
	);
}

function badgeTitle(id: string): string {
	return getBadgeDefinition(id)?.title ?? id;
}

export { BadgeGallery, badgeTitle };
