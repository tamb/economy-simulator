function CreditsPage() {
	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Attribution</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Third-party libraries and assets used in this application.
				</p>
			</header>

			<section className="space-y-3 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Cartoon Faces</h3>
				<p className="text-sm leading-relaxed">
					Citizen portraits on the Population page are generated with{" "}
					<a
						href="https://github.com/zengm-games/facesjs"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline underline-offset-2 hover:text-cyan-dark"
					>
						faces.js
					</a>
					, a JavaScript library for vector-based cartoon faces by ZenGM Games.
				</p>
				<p className="font-label text-[10px] tracking-overline text-muted-foreground">
					License: Apache-2.0 ·{" "}
					<a
						href="https://github.com/zengm-games/facesjs"
						target="_blank"
						rel="noopener noreferrer"
						className="underline underline-offset-2 hover:text-foreground"
					>
						github.com/zengm-games/facesjs
					</a>
				</p>
			</section>

			<section className="space-y-3 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Old Parchment Paper</h3>
				<p className="text-sm leading-relaxed">
					The parchment background texture is{" "}
					<a
						href="https://opengameart.org/content/old-parchment-paper"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline underline-offset-2 hover:text-cyan-dark"
					>
						Old Parchment Paper
					</a>{" "}
					by cron, from OpenGameArt.org.
				</p>
				<p className="font-label text-[10px] tracking-overline text-muted-foreground">
					License: CC0 ·{" "}
					<a
						href="https://opengameart.org/content/old-parchment-paper"
						target="_blank"
						rel="noopener noreferrer"
						className="underline underline-offset-2 hover:text-foreground"
					>
						opengameart.org/content/old-parchment-paper
					</a>
				</p>
			</section>

			<section className="space-y-3 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Wood Texture Tiles</h3>
				<p className="text-sm leading-relaxed">
					The wood desk background texture is from{" "}
					<a
						href="https://opengameart.org/content/wood-texture-tiles"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline underline-offset-2 hover:text-cyan-dark"
					>
						Wood Texture Tiles
					</a>{" "}
					by JCW, from OpenGameArt.org.
				</p>
				<p className="font-label text-[10px] tracking-overline text-muted-foreground">
					License: CC0 ·{" "}
					<a
						href="https://opengameart.org/content/wood-texture-tiles"
						target="_blank"
						rel="noopener noreferrer"
						className="underline underline-offset-2 hover:text-foreground"
					>
						opengameart.org/content/wood-texture-tiles
					</a>
				</p>
			</section>
		</div>
	);
}

export { CreditsPage };
