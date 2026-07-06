# Economic Sectors — Definitions, Rules & Success Parameters

Reference for **economy-simulator**: how the economy divides into productive sectors, what each sector does, how they depend on one another, and what measurable outcomes indicate health or failure.

Companion document: [economic-systems.md](./economic-systems.md)

---

## How to Read This Document

Each sector is described with:

| Section | Purpose |
| --- | --- |
| **Definition** | What the sector produces and its role in the economy |
| **Core Activities** | Primary goods, services, and processes |
| **Key Subsectors** | Major divisions within the sector |
| **Inputs & Outputs** | What it consumes and what it supplies to other sectors |
| **Success Parameters** | Quantifiable indicators of sector health |
| **Failure Signals** | Warning signs of sector breakdown |
| **System Sensitivity** | How different economic systems affect this sector |

Parameters are framed for simulation metrics: output volume, employment share, productivity, trade balance, etc.

---

## Sector Taxonomy Overview

Economies are commonly divided by **stage of production**:

```
┌─────────────────────────────────────────────────────────────────┐
│  QUINARY     High-level control: policy, strategy, command      │
├─────────────────────────────────────────────────────────────────┤
│  QUATERNARY  Knowledge: R&D, IT, education, information         │
├─────────────────────────────────────────────────────────────────┤
│  TERTIARY    Services: trade, finance, health, transport, gov   │
├─────────────────────────────────────────────────────────────────┤
│  SECONDARY   Industry: manufacturing, construction, utilities   │
├─────────────────────────────────────────────────────────────────┤
│  PRIMARY     Extraction: agriculture, mining, fishing, forestry │
└─────────────────────────────────────────────────────────────────┘
```

**Development pattern:** As economies mature, employment and GDP share typically shift **upward** through the stack — from primary toward tertiary and quaternary. A pre-industrial economy is primary-heavy; a post-industrial economy is service- and knowledge-heavy.

| Sector | Also Called | Typical GDP Share (Developed) | Typical GDP Share (Developing) |
| --- | --- | --- | --- |
| Primary | Extractive | 1–3% | 15–40% |
| Secondary | Industrial | 15–25% | 20–35% |
| Tertiary | Services | 60–75% | 35–55% |
| Quaternary | Knowledge | 5–15% (embedded in tertiary) | 1–5% |
| Quinary | Command | < 2% (embedded in government) | < 2% |

---

## Shared Vocabulary

| Term | Definition |
| --- | --- |
| **Value added** | Output minus intermediate inputs consumed in production |
| **Intermediate goods** | Products used as inputs by other firms (steel, semiconductors, electricity) |
| **Final goods** | Products consumed by households or government, not reprocessed |
| **Supply chain** | Linked sequence of firms transforming inputs into finished products |
| **Labor productivity** | Output per worker or per hour worked |
| **Capital intensity** | Ratio of machinery and equipment to labor in a sector |
| **Terms of trade** | Relative price of a sector's exports vs. its imports |
| **Employment share** | Percentage of total workforce employed in the sector |

---

## 1. Primary Sector (Extractive)

### Definition

The **primary sector** extracts **raw materials directly from nature** — crops from soil, ore from mines, fish from water, timber from forests. It is the base of the economic pyramid: every other sector depends on primary output as an input.

### Core Activities

- Cultivation and harvest of crops and livestock
- Mining and quarrying of minerals and fossil fuels
- Commercial fishing and aquaculture
- Logging and forestry
- Water extraction

### Key Subsectors

| Subsector | Output | Examples |
| --- | --- | --- |
| **Agriculture** | Food crops, fiber, biofuels | Wheat, rice, cotton, cattle |
| **Livestock & dairy** | Meat, milk, eggs, wool | Poultry, dairy farms, ranching |
| **Forestry** | Timber, pulp, non-timber forest products | Lumber, paper feedstock |
| **Fishing & aquaculture** | Seafood, algae | Wild catch, farmed salmon |
| **Mining — metals** | Iron, copper, gold, rare earths | Open-pit and underground mines |
| **Mining — energy** | Coal, oil, natural gas | Wells, strip mines, offshore rigs |
| **Quarrying** | Stone, sand, gravel, clay | Construction aggregates |

### Inputs & Outputs

| Direction | Items |
| --- | --- |
| **Inputs** | Land, water, labor, seeds/livestock, fuel, machinery, fertilizers, pesticides |
| **Outputs to Secondary** | Raw ore, crude oil, lumber, unprocessed cotton, fresh fish |
| **Outputs to Tertiary** | Food sold directly to consumers (farmer's markets), agritourism |
| **Outputs to Quaternary** | Research plots, genetic stock for breeding programs |

### Success Parameters

| Parameter | Target Range | Why It Matters |
| --- | --- | --- |
| Crop yield per hectare | At or above regional trend | Land efficiency |
| Food self-sufficiency ratio | > 80% for staple calories | National security |
| Resource depletion rate | Below regeneration rate (renewables) | Long-term viability |
| Agricultural employment productivity | Rising output per farm worker | Modernization progressing |
| Export value of commodities | Stable or rising terms of trade | Primary sector earns foreign exchange |
| Post-harvest loss rate | < 10% (developed); improving elsewhere | Waste minimized |

### Failure Signals

- Soil exhaustion, desertification, or aquifer depletion
- Collapsed fish stocks or deforestation beyond regrowth
- Famine or import dependence for staple foods
- Commodity price crashes without diversification
- Climate shocks (drought, flood) without buffer stocks

### System Sensitivity

| System | Effect on Primary |
| --- | --- |
| Capitalism | Market prices drive crop choice; consolidation into agribusiness |
| Socialism | Collectivized farms or state grain procurement |
| Feudalism | Serfs work lord's land; surplus extracted as rent |
| Mercantilism | Colonies forced into raw-material export roles |

---

## 2. Secondary Sector (Industrial)

### Definition

The **secondary sector** **transforms raw materials into finished or semi-finished goods** through manufacturing, construction, and utility generation. It builds physical capital and consumer products.

### Core Activities

- Factory manufacturing (discrete and process)
- Construction of buildings and infrastructure
- Electricity, gas, and water generation and distribution
- Refining and smelting
- Assembly of components into final products

### Key Subsectors

| Subsector | Output | Examples |
| --- | --- | --- |
| **Heavy industry** | Steel, chemicals, cement, ships | Blast furnaces, petrochemical plants |
| **Light manufacturing** | Consumer goods, textiles, furniture | Apparel, appliances, toys |
| **Electronics & machinery** | Components, industrial equipment | Semiconductors, turbines, robotics |
| **Automotive & transport equipment** | Vehicles and parts | Cars, aircraft, rolling stock |
| **Food processing** | Packaged food and beverages | Milling, canning, brewing |
| **Construction** | Buildings, roads, bridges, dams | Residential, commercial, civil works |
| **Utilities** | Power, water, waste management | Grids, treatment plants, pipelines |
| **Pharmaceuticals** | Drugs and medical supplies | API synthesis, vaccine production |

### Inputs & Outputs

| Direction | Items |
| --- | --- |
| **Inputs from Primary** | Ore, crude oil, timber, cotton, agricultural commodities |
| **Inputs from Tertiary** | Logistics, financing, engineering services |
| **Inputs from Quaternary** | R&D, patents, process innovation |
| **Outputs to Tertiary** | Finished goods for retail, commercial buildings |
| **Outputs to Primary** | Tractors, fertilizer, irrigation equipment |
| **Exports** | Manufactured goods (main export category for industrialized nations) |

### Success Parameters

| Parameter | Target Range | Why It Matters |
| --- | --- | --- |
| Manufacturing value added / GDP | 15–25% (developed); higher in industrializing | Industrial base maintained |
| Capacity utilization | 75–85% | Plants neither idle nor overstretched |
| Industrial productivity growth | Positive annually | Technology and skills improving |
| Construction output index | Stable growth aligned with population | Infrastructure keeps pace |
| Energy intensity per unit GDP | Declining over time | Efficiency gains |
| Supply chain resilience index | High diversity of suppliers | Shocks absorbed |

### Failure Signals

- Deindustrialization without service-sector replacement
- Blackouts or utility grid collapse
- Factory closures and rust-belt unemployment
- Supply chain single-point failures
- Construction bubbles followed by crashes

### System Sensitivity

| System | Effect on Secondary |
| --- | --- |
| Capitalism | Competition drives automation; offshoring to lower-cost regions |
| Communism | State-owned heavy industry prioritized; consumer goods secondary |
| State capitalism | Strategic industries (steel, chips, energy) state-directed |
| Tripartism | Sectoral wage bargaining stabilizes industrial labor costs |

---

## 3. Tertiary Sector (Services)

### Definition

The **tertiary sector** provides **intangible services** rather than physical goods — transport, trade, finance, healthcare, education, hospitality, and government administration. It is the largest sector in most modern economies.

### Core Activities

- Moving people and goods (transport, logistics, warehousing)
- Buying and selling (wholesale, retail, e-commerce)
- Storing and lending money (banking, insurance, investment)
- Healing and caring (healthcare, social work)
- Teaching and training (schools, vocational programs)
- Governing and administering (civil service, courts, military logistics)
- Entertaining and hosting (tourism, restaurants, media distribution)

### Key Subsectors

| Subsector | Output | Examples |
| --- | --- | --- |
| **Wholesale & retail trade** | Distribution of goods | Supermarkets, e-commerce platforms |
| **Transport & logistics** | Movement and storage | Rail, shipping, trucking, ports |
| **Financial services** | Capital intermediation | Banks, stock exchanges, insurance |
| **Real estate** | Property transactions and rental | Commercial leasing, housing markets |
| **Healthcare** | Medical treatment and care | Hospitals, clinics, pharmacies |
| **Education** | Instruction and certification | Schools, universities, training |
| **Hospitality & tourism** | Accommodation and experiences | Hotels, restaurants, travel agencies |
| **Public administration** | Governance and defense | Civil service, police, military |
| **Professional services** | Expert advice | Law, accounting, consulting, advertising |
| **Telecommunications** | Connectivity | ISPs, mobile networks, cable |

### Inputs & Outputs

| Direction | Items |
| --- | --- |
| **Inputs from Secondary** | Buildings, vehicles, medical equipment, IT hardware |
| **Inputs from Primary** | Food for hospitality, energy for transport |
| **Inputs from Quaternary** | Software, data analytics, research |
| **Outputs to all sectors** | Financing, legal frameworks, labor supply (via education), market access |
| **Outputs to households** | Healthcare, education, entertainment, retail goods |

### Success Parameters

| Parameter | Target Range | Why It Matters |
| --- | --- | --- |
| Services share of GDP | 60–75% (developed economy) | Modern economic structure |
| Retail sales growth | Aligned with real income growth | Consumer demand healthy |
| Financial sector assets / GDP | Stable; sharp spikes are risk signals | Credit not overheating |
| Healthcare access | > 90% population with essential coverage | Social floor intact |
| Logistics performance index | Top quartile globally | Trade facilitation |
| Service productivity growth | Positive (harder to measure than manufacturing) | Not just low-wage job creation |

### Failure Signals

- Financial crises from excessive leverage
- Healthcare system collapse or unaffordable care
- Retail decline without economic replacement
- Transport gridlock raising costs economy-wide
- Bureaucratic paralysis in public administration

### System Sensitivity

| System | Effect on Tertiary |
| --- | --- |
| Capitalism | Financial and retail sectors expand; deregulation cycles |
| Socialism | Public healthcare and education expand; private retail constrained |
| Mixed economy | Large public service sector alongside private services |
| Mercantilism | State-controlled trade houses dominate commerce |

---

## 4. Quaternary Sector (Knowledge)

### Definition

The **quaternary sector** creates and distributes **knowledge, information, and intellectual property** — research, software, data, education at advanced levels, and information services. It is often embedded within tertiary statistics but functionally distinct because its output is **non-rival**: one person using an algorithm does not consume it for others.

### Core Activities

- Scientific and industrial research (R&D)
- Software development and IT services
- Data collection, analysis, and AI
- Higher education and think tanks
- Media creation and publishing (information content)
- Intellectual property licensing
- Biotechnology and pharmaceutical research

### Key Subsectors

| Subsector | Output | Examples |
| --- | --- | --- |
| **Research & development** | Patents, prototypes, new processes | Labs, corporate R&D centers |
| **Information technology** | Software, cloud, cybersecurity | SaaS, enterprise systems |
| **Data & analytics** | Datasets, models, insights | Data brokers, AI firms |
| **Higher education** | Graduates, research papers | Universities, research institutes |
| **Media & publishing** | News, books, digital content | Studios, platforms, journals |
| **Biotechnology** | Genetic tools, therapies | Gene sequencing, CRISPR applications |
| **Telecom R&D** | Network standards, protocols | 5G/6G research, satellite systems |

### Inputs & Outputs

| Direction | Items |
| --- | --- |
| **Inputs from Tertiary** | Financing (VC, grants), legal IP protection |
| **Inputs from Secondary** | Lab equipment, servers, clean rooms |
| **Inputs from Primary** | Rare materials for electronics (lithium, gallium) |
| **Outputs to Secondary** | Automation, new materials, improved processes |
| **Outputs to Tertiary** | Software platforms, financial models, medical protocols |
| **Spillovers** | Productivity gains across entire economy |

### Success Parameters

| Parameter | Target Range | Why It Matters |
| --- | --- | --- |
| R&D spending / GDP | 2–4% (developed); Israel/Korea > 4% | Innovation investment |
| Patents filed per capita | Top quartile for developed nations | IP generation |
| STEM graduates per year | Rising or stable pipeline | Talent supply |
| Tech sector productivity | High and rising | Knowledge converts to output |
| Broadband / digital access | > 90% population | Infrastructure for knowledge work |
| Citation impact / research quality | Above global median | Research is influential, not just voluminous |

### Failure Signals

- Brain drain — researchers emigrate
- R&D concentrated in military only; civilian spillover low
- Patent trolling — IP blocks innovation rather than enabling it
- Digital divide — knowledge benefits only urban elite
- Hype cycles without commercialization (bubble)

### System Sensitivity

| System | Effect on Quaternary |
| --- | --- |
| Capitalism | VC-funded startups; IP monopolies (patents) |
| Socialism | State research institutes; open science mandates |
| State capitalism | Strategic tech sectors (semiconductors, AI) state-funded |
| Mixed economy | Public research grants + private commercialization |

---

## 5. Quinary Sector (Command & Control)

### Definition

The **quinary sector** comprises **top-level decision-making** that directs the entire economy — senior government, central bank leadership, multinational executive strategy, and elite advisory bodies. It is tiny in employment but enormous in **influence**.

### Core Activities

- National economic policy (fiscal, monetary, trade)
- Legislative and regulatory design
- Central bank and treasury decisions
- Corporate strategic planning at headquarters level
- International diplomacy affecting trade and sanctions
- Military-strategic resource allocation

### Key Subsectors

| Subsector | Output | Examples |
| --- | --- | --- |
| **Executive government** | Laws, budgets, regulation | Cabinet, ministries, agencies |
| **Central banking** | Monetary policy, currency stability | Interest rates, reserve requirements |
| **Legislature & judiciary** | Legal framework enforcement | Parliaments, supreme courts |
| **Corporate headquarters** | Strategic direction of conglomerates | C-suite, board governance |
| **International bodies** | Trade rules, standards, aid | WTO, IMF, bilateral treaties |
| **Strategic advisory** | Policy recommendations | Central planning commissions, think tanks |

### Inputs & Outputs

| Direction | Items |
| --- | --- |
| **Inputs from Quaternary** | Economic models, intelligence, research briefs |
| **Inputs from Tertiary** | Administrative execution capacity |
| **Outputs to all sectors** | Tax policy, interest rates, tariffs, regulations, subsidies |
| **Outputs** | Macroeconomic stability (or instability) |

### Success Parameters

| Parameter | Target Range | Why It Matters |
| --- | --- | --- |
| Policy coherence index | High — fiscal and monetary aligned | Avoids contradictory signals |
| Regulatory quality index | Top quartile | Rules clear and enforceable |
| Central bank independence score | High in market economies | Credibility of monetary policy |
| Government effectiveness index | Top quartile | Decisions implemented, not just announced |
| Time to pass critical legislation | Reasonable, not paralyzed | Adaptive governance |
| Corruption perceptions index | Low corruption | Decisions serve public interest |

### Failure Signals

- Hyperinflation from monetary mismanagement
- Policy whiplash — rules change faster than firms adapt
- Regulatory capture by industry lobbies
- Failed states — government cannot enforce basic functions
- Sanctions or trade wars with no strategic exit

### System Sensitivity

| System | Effect on Quinary |
| --- | --- |
| Capitalism | Independent central bank; corporate HQ power |
| Communism | Party central committee directs all major decisions |
| Tripartism | Tripartite councils co-determine wage and labor macro policy |
| Feudalism | Monarch and great lords hold decision power |

---

## Cross-Sector Flows

### The Circular Flow (Simplified)

```
     PRIMARY ──raw materials──▶ SECONDARY ──finished goods──▶ TERTIARY
        ▲                            │                            │
        │                            │                            │
        └──── equipment, fertilizer ─┘                            │
        ▲                                                         │
        └────────────── consumer demand, labor, capital ──────────┘

     QUATERNARY ──innovation, IP, software──▶ all sectors
     QUINARY ──policy, regulation, money supply──▶ all sectors
```

### Dependency Matrix

| Sector | Depends On (Inputs) | Supplies To (Outputs) |
| --- | --- | --- |
| **Primary** | Quinary (land law), Secondary (machinery) | Secondary, Tertiary |
| **Secondary** | Primary, Quaternary, Tertiary (logistics, finance) | Tertiary, Primary, exports |
| **Tertiary** | Secondary, Primary, Quaternary | All sectors, households |
| **Quaternary** | Tertiary (finance), Secondary (equipment) | Secondary, Tertiary, Quinary |
| **Quinary** | Quaternary (analysis), Tertiary (administration) | All sectors |

### Employment Migration (Development Stages)

| Stage | Dominant Sector | Characteristics |
| --- | --- | --- |
| **Pre-industrial** | Primary (60–80% labor) | Subsistence agriculture |
| **Industrializing** | Secondary rising (20–35%) | Factory urbanization |
| **Industrial** | Secondary peak; tertiary growing | Manufacturing employment max |
| **Post-industrial** | Tertiary (60–75%) | Service economy |
| **Knowledge economy** | Tertiary + quaternary (70%+ combined) | High R&D, digital services |

---

## Sector Classification Systems (Real-World Reference)

For granular industry data, national statistics offices use standardized codes:

| System | Used By | Granularity |
| --- | --- | --- |
| **ISIC Rev. 4** | UN, most countries | Sections A–U (21 sections, 88 divisions) |
| **NAICS** | US, Canada, Mexico | 20 sectors, 1,000+ industries |
| **NACE** | European Union | Aligned with ISIC, more EU detail |
| **SIC** | Legacy (US, UK) | 4-digit industry codes (largely replaced) |

### ISIC Section Mapping

| ISIC Section | Letter | Maps To |
| --- | --- | --- |
| Agriculture, forestry, fishing | A | Primary |
| Mining and quarrying | B | Primary |
| Manufacturing | C | Secondary |
| Electricity, gas, steam, AC | D | Secondary (utilities) |
| Water supply, sewerage, waste | E | Secondary (utilities) |
| Construction | F | Secondary |
| Wholesale and retail trade | G | Tertiary |
| Transport and storage | H | Tertiary |
| Accommodation and food service | I | Tertiary |
| Information and communication | J | Tertiary / Quaternary |
| Financial and insurance | K | Tertiary |
| Real estate | L | Tertiary |
| Professional, scientific, technical | M | Tertiary / Quaternary |
| Administrative and support | N | Tertiary |
| Public administration and defense | O | Tertiary / Quinary |
| Education | P | Tertiary / Quaternary |
| Human health and social work | Q | Tertiary |
| Arts, entertainment, recreation | R | Tertiary |
| Other service activities | S | Tertiary |
| Households as employers | T | Tertiary |
| Extraterritorial organizations | U | Quinary |

---

## Comparative Summary

| Sector | Output Type | Capital Intensity | Typical Wage Level | Trade Exposure |
| --- | --- | --- | --- | --- |
| **Primary** | Raw materials | Low–medium | Low–medium | High (commodities) |
| **Secondary** | Physical goods | High | Medium–high | Very high |
| **Tertiary** | Services | Low–medium | Low–high (wide range) | Medium |
| **Quaternary** | Knowledge / IP | Low (high human capital) | High | High (licensing, tech) |
| **Quinary** | Decisions / policy | Very low | Very high | Low direct; high indirect |

---

## Simulation Mapping (Suggested)

### Sector Entity Schema

```
Sector {
  id:                   string       // "primary", "secondary", etc.
  gdpShare:             0.0 – 1.0   // fraction of total GDP
  employmentShare:      0.0 – 1.0   // fraction of workforce
  productivityIndex:    float        // output per worker, baseline = 1.0
  outputVolume:         float        // total value added
  growthRate:           float        // annual % change
  importDependence:     0.0 – 1.0   // share of inputs imported
  exportShare:          0.0 – 1.0   // share of output exported
  capitalStock:         float        // accumulated machinery, infrastructure
  rndSpending:          float        // R&D investment (quaternary-heavy)
  regulationLevel:      0.0 – 1.0   // quinary policy burden
}
```

### Inter-Sector Flow Matrix

Define `flow[from][to]` as the value of goods, services, or knowledge transferred annually:

```
flow[primary][secondary]    // raw materials to factories
flow[secondary][tertiary]    // finished goods to retailers
flow[tertiary][primary]      // machinery, fertilizer, finance to farms
flow[quaternary][secondary]  // patents, automation to factories
flow[quaternary][tertiary]   // software to service firms
flow[quinary][*]             // policy effects applied as multipliers on all sectors
```

### Sector Health Score (Example)

| Metric | Weight | Applies To |
| --- | --- | --- |
| Productivity growth | 20% | All |
| Employment share vs. GDP share alignment | 10% | All (detects inefficiency) |
| Output growth | 15% | All |
| Self-sufficiency (1 − importDependence) | 15% | Primary, Secondary |
| R&D / GDP | 15% | Quaternary (spillover to Secondary) |
| Service access coverage | 10% | Tertiary |
| Policy coherence | 15% | Quinary |

### Development Stage Presets

| Preset | Primary | Secondary | Tertiary | Quaternary |
| --- | --- | --- | --- | --- |
| **Agrarian** | 0.40 | 0.20 | 0.35 | 0.05 |
| **Industrializing** | 0.15 | 0.35 | 0.42 | 0.08 |
| **Developed** | 0.02 | 0.20 | 0.68 | 0.10 |
| **Knowledge economy** | 0.02 | 0.15 | 0.58 | 0.25 |

Adjust quinary influence separately via `regulationLevel` and policy multipliers from [economic-systems.md](./economic-systems.md).

---

## Further Reading

- [International Standard Industrial Classification (ISIC Rev. 4)](https://unstats.un.org/unsd/classifications)
- [North American Industry Classification System (NAICS)](https://www.census.gov/naics/)
- Three-sector theory — [Primary, secondary, and tertiary sectors (Wikipedia)](https://en.wikipedia.org/wiki/Three-sector_model)
- [Quaternary sector of the economy (Wikipedia)](https://en.wikipedia.org/wiki/Quaternary_sector_of_the_economy)

---

*Last updated: July 2026 — economy-simulator reference document*
