type SfxId = "calamity" | "year-end" | "edict" | "reform" | "advance";

const SFX_ENABLED_KEY = "economy-simulator-sfx";

function isSfxEnabled(): boolean {
	try {
		return localStorage.getItem(SFX_ENABLED_KEY) !== "off";
	} catch {
		return true;
	}
}

function setSfxEnabled(enabled: boolean): void {
	try {
		localStorage.setItem(SFX_ENABLED_KEY, enabled ? "on" : "off");
	} catch {
		// ignore storage failures
	}
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
}

function tone(
	frequency: number,
	durationMs: number,
	type: OscillatorType = "sine",
	volume = 0.04,
): void {
	if (!isSfxEnabled()) return;
	const context = getAudioContext();
	if (!context) return;

	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = type;
	oscillator.frequency.value = frequency;
	gain.gain.value = volume;
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.start();
	oscillator.stop(context.currentTime + durationMs / 1000);
}

function playSfx(id: SfxId): void {
	switch (id) {
		case "calamity":
			tone(110, 180, "sawtooth", 0.03);
			window.setTimeout(() => tone(82, 220, "sawtooth", 0.03), 120);
			break;
		case "year-end":
			tone(392, 120);
			window.setTimeout(() => tone(523, 160), 100);
			break;
		case "edict":
			tone(262, 100, "triangle");
			break;
		case "reform":
			tone(330, 100, "triangle");
			window.setTimeout(() => tone(392, 100, "triangle"), 90);
			break;
		case "advance":
			tone(440, 40, "sine", 0.02);
			break;
		default:
			break;
	}
}

export type { SfxId };
export { isSfxEnabled, playSfx, setSfxEnabled };
