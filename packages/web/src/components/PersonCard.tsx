import { Face } from "facesjs/react";
import { useFacePool } from "../context/FacePoolContext";
import { personGenerationConfig } from "../data/person-generation";
import type { Person } from "../models/Person";

const traitLabels: Record<
	(typeof personGenerationConfig.traits)[number],
	string
> = {
	openness: "O",
	conscientiousness: "C",
	extraversion: "E",
	agreeableness: "A",
	neuroticism: "N",
};

interface PersonCardProps {
	person: Person;
	onOpenGlossary?: () => void;
	onOpenDossier?: (person: Person) => void;
}

function formatPercentStat(value: number | undefined): string {
	if (value === undefined) return "—";
	return `${Math.ceil(value)}%`;
}

function PersonCard({
	person,
	onOpenGlossary,
	onOpenDossier,
}: PersonCardProps) {
	const { getFace } = useFacePool();
	const face = getFace(person.getFaceId());
	const isAlive = person.isLiving();

	return (
		<article
			className={`flex h-40 gap-4 border-2 p-4 ${
				isAlive
					? "border-primary/30 bg-surface-muted"
					: "border-primary/15 bg-surface-muted/60 opacity-70"
			} ${onOpenDossier ? "cursor-pointer hover:border-primary" : ""}`}
			onClick={() => onOpenDossier?.(person)}
			onKeyDown={(event) => {
				if (!onOpenDossier) return;
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onOpenDossier(person);
				}
			}}
			{...(onOpenDossier ? { role: "button" as const, tabIndex: 0 } : {})}
		>
			{face && (
				<div className="shrink-0 border-2 border-primary bg-surface p-1">
					<Face face={face} lazy style={{ width: 72, height: 108 }} />
				</div>
			)}

			<div className="min-w-0 flex-1 space-y-3">
				<div>
					<div className="flex items-start justify-between gap-2">
						<h3 className="truncate text-[10px] leading-relaxed sm:text-xs">
							{person.getName() ?? "Unknown"}
							{person.getIndex() !== undefined && (
								<span className="text-muted-foreground">
									{" "}
									#{person.getIndex()?.toLocaleString()}
								</span>
							)}
						</h3>
						{onOpenGlossary && (
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									onOpenGlossary();
								}}
								className="shrink-0 border border-primary/30 bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-overline text-muted-foreground hover:border-primary hover:text-primary"
								aria-label="What do these stats mean?"
							>
								?
							</button>
						)}
					</div>
					<p className="mt-1 font-label text-[10px] tracking-overline text-muted-foreground">
						Age {person.getAge() ?? "—"} · {person.getSex() ?? "—"}
						{!isAlive && <span className="text-primary"> · Deceased</span>}
					</p>
					<div className="mt-2 grid grid-cols-2 gap-2 text-xs">
						<Stat label="Health" value={person.getOverallHealth()} />
						<Stat label="Happiness" value={person.getOverallHappiness()} />
					</div>
				</div>

				<div>
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						Big Five Traits
					</p>
					<div className="mt-1 flex flex-wrap gap-1">
						{personGenerationConfig.traits.map((trait) => (
							<span
								key={trait}
								className="border border-primary/30 bg-surface px-2 py-0.5 font-label text-[10px] tracking-overline"
								title={trait}
							>
								{traitLabels[trait]} {person.getTrait(trait) ?? 0}
							</span>
						))}
					</div>
				</div>
			</div>
		</article>
	);
}

function Stat({ label, value }: { label: string; value?: number }) {
	return (
		<div className="border border-primary/20 bg-surface px-2 py-1">
			<p className="font-label text-[10px] tracking-overline text-muted-foreground">
				{label}
			</p>
			<p className="text-sm">{formatPercentStat(value)}</p>
		</div>
	);
}

export { formatPercentStat, PersonCard };
