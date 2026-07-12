import { appConfig } from "economy-simulator-data";
import { useId, useState } from "react";

interface NewGameSetupOptions {
	size: number;
	boundingRadius: number;
}

interface NewGameSetupPageProps {
	onStart: (options: NewGameSetupOptions) => void;
}

/**
 * Full-screen "found a new nation" title screen shown before a population
 * exists. Lets the player pick how many citizens to simulate and how many
 * provinces to divide the island into — bigger populations are more
 * representative but take longer; more provinces spread people thinner and
 * ease regional pressure (see `appConfig.population` / `appConfig.regions`).
 */
function NewGameSetupPage({ onStart }: NewGameSetupPageProps) {
	const [selectedSize, setSelectedSize] = useState<number>(
		appConfig.population.size,
	);
	const [selectedScaleId, setSelectedScaleId] = useState<string>(
		appConfig.regions.defaultRegionScale,
	);
	const populationLegendId = useId();
	const regionLegendId = useId();

	const selectedScale =
		appConfig.regions.regionScaleOptions.find(
			(option) => option.id === selectedScaleId,
		) ?? appConfig.regions.regionScaleOptions[0];

	return (
		<main className="flex min-h-screen items-center justify-center p-4 font-sans sm:p-6">
			<div className="w-full max-w-md border-2 border-primary bg-surface shadow-lg shadow-surface-shadow">
				<header className="border-b-4 border-accent bg-neutral-950 px-6 py-5 text-center text-on-dark sm:px-8">
					<p className="font-label text-sm text-on-dark-muted tracking-overline">
						Executive Office of the President
					</p>
					<h1 className="mt-2 text-base text-highlight sm:text-lg">
						{appConfig.productName}
					</h1>
					<p className="mt-1 font-label text-xs text-on-dark-muted tracking-overline">
						Found a New Nation
					</p>
				</header>

				<form
					className="space-y-6 px-6 py-8 sm:px-8"
					onSubmit={(event) => {
						event.preventDefault();
						if (!selectedScale) return;
						onStart({
							size: selectedSize,
							boundingRadius: selectedScale.boundingRadius,
						});
					}}
				>
					<fieldset className="space-y-3">
						<legend
							id={populationLegendId}
							className="font-label text-[10px] text-muted-foreground tracking-overline"
						>
							Starting population
						</legend>
						<div className="grid grid-cols-1 gap-2">
							{appConfig.population.sizeOptions.map((size) => {
								const isSelected = size === selectedSize;
								return (
									<label
										key={size}
										className={`flex w-full cursor-pointer items-center border-2 px-4 py-3 transition-colors ${
											isSelected
												? "border-primary bg-primary text-primary-foreground"
												: "border-primary/30 bg-surface-muted text-foreground hover:border-primary/60"
										}`}
									>
										<input
											type="radio"
											name="population-size"
											value={size}
											checked={isSelected}
											onChange={() => setSelectedSize(size)}
											className="sr-only"
										/>
										<span className="text-sm sm:text-base">
											{size.toLocaleString()} citizens
										</span>
										{size === appConfig.population.size && (
											<span className="ml-2 font-label text-[10px] tracking-overline opacity-70">
												(default)
											</span>
										)}
									</label>
								);
							})}
						</div>
					</fieldset>

					<fieldset className="space-y-3">
						<legend
							id={regionLegendId}
							className="font-label text-[10px] text-muted-foreground tracking-overline"
						>
							Provinces
						</legend>
						<div className="grid grid-cols-1 gap-2">
							{appConfig.regions.regionScaleOptions.map((option) => {
								const isSelected = option.id === selectedScaleId;
								return (
									<label
										key={option.id}
										className={`flex w-full cursor-pointer items-center border-2 px-4 py-3 transition-colors ${
											isSelected
												? "border-primary bg-primary text-primary-foreground"
												: "border-primary/30 bg-surface-muted text-foreground hover:border-primary/60"
										}`}
									>
										<input
											type="radio"
											name="region-scale"
											value={option.id}
											checked={isSelected}
											onChange={() => setSelectedScaleId(option.id)}
											className="sr-only"
										/>
										<span className="text-sm sm:text-base">{option.label}</span>
										{option.id === appConfig.regions.defaultRegionScale && (
											<span className="ml-2 font-label text-[10px] tracking-overline opacity-70">
												(default)
											</span>
										)}
									</label>
								);
							})}
						</div>
					</fieldset>

					<p className="text-sm leading-relaxed text-muted-foreground">
						Larger populations take longer to generate and to simulate each
						in-game day, but give a more granular economy. More provinces spread
						people thinner and ease regional pressure; fewer pack the same
						population tighter.
					</p>

					<button
						type="submit"
						className="w-full border-2 border-primary bg-primary px-4 py-3 text-sm text-primary-foreground transition-opacity hover:opacity-90"
					>
						Continue to nation setup
					</button>
				</form>
			</div>
		</main>
	);
}

export type { NewGameSetupOptions };
export { NewGameSetupPage };
