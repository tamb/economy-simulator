import responsesCopy from "./responses.json" with { type: "json" };

type CalamityResponseKind = "endure" | "relief" | "rebuild";

interface CalamityResponseCopy {
	label: string;
	detail: string;
}

type ResponsesCopyFile = Record<CalamityResponseKind, CalamityResponseCopy>;

const CALAMITY_RESPONSE_COPY = responsesCopy as ResponsesCopyFile;

function getCalamityResponseCopy(
	kind: CalamityResponseKind,
): CalamityResponseCopy {
	const copy = CALAMITY_RESPONSE_COPY[kind];
	if (!copy) {
		throw new Error(
			`Missing copy for calamity response "${kind}" in copy/calamities/responses.json`,
		);
	}
	return copy;
}

export type { CalamityResponseCopy, CalamityResponseKind };
export { CALAMITY_RESPONSE_COPY, getCalamityResponseCopy };
