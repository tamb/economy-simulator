/** Sync web build output into the desktop package. */
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const WEB_ROOT = path.join(REPO_ROOT, "packages", "web");
const DESKTOP_ROOT = path.join(REPO_ROOT, "packages", "desktop");
const WEB_OUTPUT = "dist";
const DESKTOP_TARGET = "resources";

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

async function removeWithRetry(dir: string, retries = 8, delayMs = 250): Promise<void> {
	let lastErr: unknown;
	for (let i = 0; i < retries; i++) {
		try {
			await fsp.rm(dir, { recursive: true, force: true });
			return;
		} catch (err) {
			lastErr = err;
			if (i < retries - 1) await sleep(delayMs);
		}
	}
	throw lastErr;
}

async function main(): Promise<void> {
	const webDist = path.join(WEB_ROOT, WEB_OUTPUT);
	const desktopTarget = path.join(DESKTOP_ROOT, DESKTOP_TARGET);

	try {
		await fsp.access(webDist);
	} catch {
		throw new Error(
			`Web build not found at ${webDist}. Run build:web first.`,
		);
	}

	console.log(`Copying ${webDist} → ${desktopTarget}`);
	await removeWithRetry(desktopTarget);
	await fsp.mkdir(path.dirname(desktopTarget), { recursive: true });
	await fsp.cp(webDist, desktopTarget, { recursive: true, force: true });
	console.log("Done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
