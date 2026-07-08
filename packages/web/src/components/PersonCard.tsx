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
}

function PersonCard({ person }: PersonCardProps) {
	const { getFace } = useFacePool();
	const face = getFace(person.getFaceId());
	const isAlive = person.isLiving();

	return (
		<article
			className={`flex h-40 gap-4 border-2 p-4 ${
				isAlive
					? "border-primary/30 bg-surface-muted"
					: "border-primary/15 bg-surface-muted/60 opacity-70"
			}`}
		>
			{face && (
				<div className="shrink-0 border-2 border-primary bg-surface p-1">
					<Face face={face} lazy style={{ width: 72, height: 108 }} />
				</div>
			)}

			<div className="min-w-0 flex-1 space-y-3">
				<div>
					<h3 className="truncate text-[10px] leading-relaxed sm:text-xs">
						{person.getName() ?? "Unknown"}
						{person.getIndex() !== undefined && (
							<span className="text-muted-foreground">
								{" "}
								#{person.getIndex()?.toLocaleString()}
							</span>
						)}
					</h3>
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
			<p className="text-sm">{value ?? "—"}%</p>
		</div>
	);
}

export { PersonCard };
