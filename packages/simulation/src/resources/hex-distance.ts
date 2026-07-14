/** Axial hex distance (cube metric) between two pointy-top hexes. */
function axialDistance(
	a: { q: number; r: number },
	b: { q: number; r: number },
): number {
	const dq = a.q - b.q;
	const dr = a.r - b.r;
	return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export { axialDistance };
