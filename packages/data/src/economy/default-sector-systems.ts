import type { EconomicSystemId } from "./economic-systems";
import type { CategoryId } from "./taxonomy";
import { categories, sectorKey } from "./taxonomy";

/**
 * Default economic system per sub-sector for "auto-assign all".
 * Primary sectors lean feudal/subsistence; modern tiers lean mixed/capitalist.
 */
const defaultSystemBySubSector: Record<string, EconomicSystemId> = {
	// Extractive
	"extractive/agriculture": "feudalism",
	"extractive/livestock": "feudalism",
	"extractive/forestry": "subsistence",
	"extractive/fishing": "subsistence",
	"extractive/mining": "mercantilism",
	"extractive/energy": "state-capitalism",
	"extractive/quarrying": "mercantilism",
	// Industrial
	"industrial/heavy-industry": "state-capitalism",
	"industrial/light-manufacturing": "capitalism",
	"industrial/electronics-machinery": "capitalism",
	"industrial/automotive": "capitalism",
	"industrial/food-processing": "capitalism",
	"industrial/construction": "mixed-economy",
	"industrial/utilities": "mixed-economy",
	"industrial/pharmaceuticals": "mixed-economy",
	// Services
	"services/wholesale-retail": "capitalism",
	"services/transport-logistics": "capitalism",
	"services/financial-services": "capitalism",
	"services/real-estate": "capitalism",
	"services/healthcare": "mixed-economy",
	"services/education": "mixed-economy",
	"services/hospitality-tourism": "capitalism",
	"services/public-administration": "mixed-economy",
	"services/professional-services": "capitalism",
	"services/telecommunications": "capitalism",
	// Knowledge
	"knowledge/research-development": "market-socialism",
	"knowledge/information-technology": "capitalism",
	"knowledge/data-analytics": "capitalism",
	"knowledge/higher-education": "mixed-economy",
	"knowledge/media-publishing": "capitalism",
	"knowledge/biotechnology": "market-socialism",
	"knowledge/telecom-rd": "capitalism",
	// Command
	"command/executive-government": "state-capitalism",
	"command/central-banking": "state-capitalism",
	"command/legislature-judiciary": "tripartism",
	"command/corporate-headquarters": "capitalism",
	"command/international-bodies": "tripartism",
	"command/strategic-advisory": "capitalism",
};

function getDefaultSystemForSubSector(
	categoryId: CategoryId,
	subSectorId: string,
): EconomicSystemId {
	return (
		defaultSystemBySubSector[sectorKey(categoryId, subSectorId)] ??
		"mixed-economy"
	);
}

function getAllSubSectorKeys(): string[] {
	return categories.flatMap((category) =>
		category.subSectors.map((subSector) =>
			sectorKey(category.id, subSector.id),
		),
	);
}

export {
	defaultSystemBySubSector,
	getAllSubSectorKeys,
	getDefaultSystemForSubSector,
};
