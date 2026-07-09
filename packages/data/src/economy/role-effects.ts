import { getEconomicRole } from "./economic-roles";

interface RoleEffect {
	roleId: number;
	efficiencyMultiplier: number;
	moraleMultiplier: number;
	weeklyHoursOverride?: number;
	countsAsWorker: boolean;
}

/**
 * Mechanical consequences of holding an economic role within a sub-sector.
 * Magnitudes are v1 balancing choices (same spirit as economic-system-effects.ts).
 */
const roleEffects: RoleEffect[] = [
	// Capitalism
	{
		roleId: 10,
		efficiencyMultiplier: 1.0,
		moraleMultiplier: 1.0,
		countsAsWorker: true,
	},
	{
		roleId: 11,
		efficiencyMultiplier: 1.1,
		moraleMultiplier: 1.05,
		countsAsWorker: true,
	},
	{
		roleId: 12,
		efficiencyMultiplier: 0.5,
		moraleMultiplier: 1.2,
		countsAsWorker: false,
	},
	{
		roleId: 13,
		efficiencyMultiplier: 1.15,
		moraleMultiplier: 1.1,
		countsAsWorker: true,
	},
	// Socialism
	{
		roleId: 20,
		efficiencyMultiplier: 0.95,
		moraleMultiplier: 1.1,
		countsAsWorker: true,
	},
	{
		roleId: 21,
		efficiencyMultiplier: 1.05,
		moraleMultiplier: 1.0,
		countsAsWorker: true,
	},
	{
		roleId: 22,
		efficiencyMultiplier: 0.8,
		moraleMultiplier: 0.95,
		countsAsWorker: false,
	},
	// Tripartism
	{
		roleId: 30,
		efficiencyMultiplier: 1.0,
		moraleMultiplier: 1.1,
		countsAsWorker: true,
	},
	{
		roleId: 31,
		efficiencyMultiplier: 1.05,
		moraleMultiplier: 1.0,
		countsAsWorker: true,
	},
	{
		roleId: 32,
		efficiencyMultiplier: 0.85,
		moraleMultiplier: 1.05,
		countsAsWorker: false,
	},
	// Communism
	{
		roleId: 40,
		efficiencyMultiplier: 0.9,
		moraleMultiplier: 0.95,
		countsAsWorker: true,
	},
	{
		roleId: 41,
		efficiencyMultiplier: 0.75,
		moraleMultiplier: 0.9,
		countsAsWorker: false,
	},
	{
		roleId: 42,
		efficiencyMultiplier: 1.0,
		moraleMultiplier: 0.95,
		countsAsWorker: true,
	},
	// Mixed economy
	{
		roleId: 50,
		efficiencyMultiplier: 1.0,
		moraleMultiplier: 1.0,
		countsAsWorker: true,
	},
	{
		roleId: 51,
		efficiencyMultiplier: 0.95,
		moraleMultiplier: 1.1,
		countsAsWorker: true,
	},
	{
		roleId: 52,
		efficiencyMultiplier: 0.8,
		moraleMultiplier: 1.05,
		countsAsWorker: false,
	},
	// Feudalism
	{
		roleId: 65,
		efficiencyMultiplier: 1.2,
		moraleMultiplier: 0.75,
		countsAsWorker: true,
	},
	{
		roleId: 66,
		efficiencyMultiplier: 0.9,
		moraleMultiplier: 0.9,
		countsAsWorker: true,
	},
	{
		roleId: 67,
		efficiencyMultiplier: 0.4,
		moraleMultiplier: 1.25,
		countsAsWorker: false,
	},
	{
		roleId: 68,
		efficiencyMultiplier: 0.6,
		moraleMultiplier: 1.0,
		countsAsWorker: false,
	},
	// Mercantilism
	{
		roleId: 70,
		efficiencyMultiplier: 1.1,
		moraleMultiplier: 1.05,
		countsAsWorker: true,
	},
	{
		roleId: 71,
		efficiencyMultiplier: 1.0,
		moraleMultiplier: 1.0,
		countsAsWorker: true,
	},
	{
		roleId: 72,
		efficiencyMultiplier: 0.85,
		moraleMultiplier: 1.1,
		countsAsWorker: false,
	},
	// Market socialism
	{
		roleId: 80,
		efficiencyMultiplier: 1.0,
		moraleMultiplier: 1.1,
		countsAsWorker: true,
	},
	{
		roleId: 81,
		efficiencyMultiplier: 1.05,
		moraleMultiplier: 1.05,
		countsAsWorker: true,
	},
	{
		roleId: 82,
		efficiencyMultiplier: 0.85,
		moraleMultiplier: 1.0,
		countsAsWorker: false,
	},
	// State capitalism
	{
		roleId: 90,
		efficiencyMultiplier: 1.0,
		moraleMultiplier: 0.95,
		countsAsWorker: true,
	},
	{
		roleId: 91,
		efficiencyMultiplier: 0.8,
		moraleMultiplier: 1.0,
		countsAsWorker: false,
	},
	{
		roleId: 92,
		efficiencyMultiplier: 0.7,
		moraleMultiplier: 1.15,
		countsAsWorker: false,
	},
	// Anarcho-capitalism
	{
		roleId: 100,
		efficiencyMultiplier: 1.1,
		moraleMultiplier: 0.95,
		countsAsWorker: true,
	},
	{
		roleId: 101,
		efficiencyMultiplier: 1.15,
		moraleMultiplier: 1.05,
		countsAsWorker: true,
	},
	{
		roleId: 102,
		efficiencyMultiplier: 0.6,
		moraleMultiplier: 1.2,
		countsAsWorker: false,
	},
	// Subsistence
	{
		roleId: 110,
		efficiencyMultiplier: 0.85,
		moraleMultiplier: 1.1,
		countsAsWorker: true,
	},
	{
		roleId: 111,
		efficiencyMultiplier: 0.8,
		moraleMultiplier: 1.05,
		countsAsWorker: true,
	},
	{
		roleId: 112,
		efficiencyMultiplier: 0.5,
		moraleMultiplier: 1.15,
		countsAsWorker: false,
	},
];

function getRoleEffect(roleId: number): RoleEffect | undefined {
	return roleEffects.find((effect) => effect.roleId === roleId);
}

function getRoleEffectOrDefault(roleId: number): RoleEffect {
	return (
		getRoleEffect(roleId) ?? {
			roleId,
			efficiencyMultiplier: 1,
			moraleMultiplier: 1,
			countsAsWorker: true,
		}
	);
}

function roleBelongsToSystem(roleId: number, systemId: string): boolean {
	const role = getEconomicRole(roleId);
	return role?.systemId === systemId;
}

export type { RoleEffect };
export {
	getRoleEffect,
	getRoleEffectOrDefault,
	roleBelongsToSystem,
	roleEffects,
};
