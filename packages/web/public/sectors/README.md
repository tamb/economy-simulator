# Sectors Directory Layout

Each path follows:

```
sectors/{category}/{sector}/{economic-system}/
```

## Categories (five-sector model)

| Directory | Sector | Subsectors |
| --- | --- | --- |
| `extractive/` | Primary (Extractive) | agriculture, livestock, forestry, fishing, mining, energy, quarrying |
| `industrial/` | Secondary (Industrial) | heavy-industry, light-manufacturing, electronics-machinery, automotive, food-processing, construction, utilities, pharmaceuticals |
| `services/` | Tertiary (Services) | wholesale-retail, transport-logistics, financial-services, real-estate, healthcare, education, hospitality-tourism, public-administration, professional-services, telecommunications |
| `knowledge/` | Quaternary (Knowledge) | research-development, information-technology, data-analytics, higher-education, media-publishing, biotechnology, telecom-rd |
| `command/` | Quinary (Command) | executive-government, central-banking, legislature-judiciary, corporate-headquarters, international-bodies, strategic-advisory |

## Economic systems (leaf directory names)

Each sector contains one directory per system:

- `capitalism`
- `socialism`
- `tripartism`
- `communism`
- `mixed-economy`
- `mercantilism`
- `feudalism`
- `market-socialism`
- `state-capitalism`
- `anarcho-capitalism`
- `subsistence`

## Example paths

```
sectors/extractive/mining/capitalism
sectors/knowledge/information-technology/socialism
sectors/command/central-banking/tripartism
sectors/services/healthcare/mixed-economy
```

See [economic-sectors.md](../economic-sectors.md) and [economic-systems.md](../economic-systems.md) for definitions and parameters.
