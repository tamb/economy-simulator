import { NavLink, Outlet } from "react-router";

const setupPages = [
	{ path: "/setup", label: "Nation Setup" },
	{ path: "/atlas", label: "Sector Atlas" },
];

function SetupAppShell() {
	return (
		<main className="min-h-screen p-4 font-sans sm:p-6">
			<div className="mx-auto flex max-w-6xl gap-4">
				<nav
					className="w-44 shrink-0 border-2 border-primary bg-surface-muted sm:w-52"
					aria-label="Setup navigation"
				>
					<div className="border-b-2 border-primary bg-neutral-950 px-4 py-4 text-on-dark">
						<p className="font-label text-[10px] tracking-overline">Founding</p>
						<p className="mt-1 text-[10px] leading-relaxed sm:text-xs">
							Configure before play
						</p>
					</div>
					<ul className="p-2">
						{setupPages.map((item) => (
							<li key={item.path}>
								<NavLink
									to={item.path}
									end={item.path === "/setup"}
									className={({ isActive }) =>
										`block w-full cursor-pointer border-2 px-3 py-2 text-left transition-colors ${
											isActive
												? "border-primary bg-primary text-primary-foreground"
												: "border-transparent bg-surface text-foreground hover:border-primary/30"
										}`
									}
								>
									<span className="font-label text-[10px] tracking-overline">
										{item.label}
									</span>
								</NavLink>
							</li>
						))}
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
							Nation Founding
						</p>
					</header>

					<section className="px-6 py-8 sm:px-8">
						<Outlet />
					</section>
				</div>
			</div>
		</main>
	);
}

export { SetupAppShell };
