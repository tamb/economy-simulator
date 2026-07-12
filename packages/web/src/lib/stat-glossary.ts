interface StatGlossaryEntry {
	id: string;
	title: string;
	summary: string;
}

/**
 * Player-facing explanations for citizen stats shown on the Population page
 * and elsewhere. Keep copy short and instructional — not academic.
 */
const statGlossary: readonly StatGlossaryEntry[] = [
	{
		id: "happiness",
		title: "Happiness",
		summary:
			"A 0–100 score of day-to-day wellbeing. Work hours, job fit (personality vs sector), resource shortfalls, and local environment all push it up or down each day a citizen's cohort is updated.",
	},
	{
		id: "health",
		title: "Health",
		summary:
			"A 0–100 physical condition score. Health drifts toward happiness over time — sustained low happiness erodes health gradually, and a single bad day will not crash it.",
	},
	{
		id: "age",
		title: "Age",
		summary:
			"Years since birth. Age shapes mortality and fertility in the annual cycle; older citizens face higher death risk, and only adults in the fertile range can give birth.",
	},
	{
		id: "region",
		title: "Region",
		summary:
			"The home hex on the island map. Terrain and local environment affect quality of life; extractive jobs only exist where the land can support them.",
	},
	{
		id: "living",
		title: "Living status",
		summary:
			"Living citizens still participate in the economy and demographics. Deceased citizens remain in the registry for history but no longer update day to day.",
	},
	{
		id: "openness",
		title: "Openness (O)",
		summary:
			"Curiosity and appetite for new ideas. High openness fits knowledge work especially well.",
	},
	{
		id: "conscientiousness",
		title: "Conscientiousness (C)",
		summary:
			"Discipline and reliability. Strong across most jobs, especially extractive, industrial, knowledge, and command roles.",
	},
	{
		id: "extraversion",
		title: "Extraversion (E)",
		summary:
			"Energy drawn from people and activity. Helps in services and command roles that rely on social presence.",
	},
	{
		id: "agreeableness",
		title: "Agreeableness (A)",
		summary:
			"Cooperation and empathy. Especially valuable in services work that depends on helping others.",
	},
	{
		id: "neuroticism",
		title: "Neuroticism (N)",
		summary:
			"Tendency toward stress and emotional volatility. High neuroticism is a poor fit for many demanding or high-stakes jobs.",
	},
];

export type { StatGlossaryEntry };
export { statGlossary };
