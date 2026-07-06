import type { ReactNode } from "react";

export type AppPage = "atlas" | "population" | "credits";

const pages: { id: AppPage; label: string; subtitle: string }[] = [
	{
		id: "atlas",
		label: "Sector Atlas",
		subtitle: "Economic Sector Atlas",
	},
	{
		id: "population",
		label: "Population",
		subtitle: "Population Registry",
	},
	{
		id: "credits",
		label: "Credits",
		subtitle: "Credits & Attribution",
	},
];

interface AppShellProps {
	page: AppPage;
	onPageChange: (page: AppPage) => void;
	children: ReactNode;
}

export function AppShell({ page, onPageChange, children }: AppShellProps) {
	const activePage = pages.find((item) => item.id === page) ?? pages[0];

	return (
		<main className="min-h-screen bg-surface p-4 font-sans sm:p-6">
			<div className="mx-auto flex max-w-6xl gap-4">
				<nav
					className="w-44 shrink-0 border-2 border-primary bg-surface-muted sm:w-52"
					aria-label="Main navigation"
				>
					<div className="border-b-2 border-primary bg-neutral-950 px-4 py-4 text-on-dark">
						<p className="font-label text-[10px] tracking-overline">Navigation</p>
						<p className="mt-1 text-[10px] leading-relaxed sm:text-xs">
							economy-simulator
						</p>
					</div>
					<ul className="p-2">
						{pages.map((item) => {
							const isActive = item.id === page;
							return (
								<li key={item.id}>
									<button
										type="button"
										onClick={() => onPageChange(item.id)}
										className={`w-full cursor-pointer border-2 px-3 py-2 text-left transition-colors ${
											isActive
												? "border-primary bg-primary text-primary-foreground"
												: "border-transparent bg-surface text-foreground hover:border-primary/30"
										}`}
									>
										<span className="font-label text-[10px] tracking-overline">
											{item.label}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				</nav>

				<div className="min-w-0 flex-1 border-2 border-primary bg-surface shadow-lg shadow-surface-shadow">
					<header className="border-b-4 border-accent bg-neutral-950 px-6 py-5 text-center text-on-dark sm:px-8">
						<p className="font-label text-sm text-on-dark-muted tracking-overline">
							Executive Office of the President
						</p>
						<h1 className="mt-2 text-base text-highlight sm:text-lg">
							economy-simulator
						</h1>
						<p className="mt-1 font-label text-xs text-on-dark-muted tracking-overline">
							{activePage.subtitle}
						</p>
					</header>

					<div className="border-b border-primary px-6 py-1 sm:px-8" />

					<section className="px-6 py-8 sm:px-8">{children}</section>

					<footer className="border-t-2 border-primary bg-surface-muted px-6 py-3 sm:px-8">
						<p className="font-label text-center text-xs text-muted-foreground tracking-overline">
							Reference: economic-sectors.md · {new Date().getFullYear()}
						</p>
					</footer>
				</div>
			</div>
		</main>
	);
}
