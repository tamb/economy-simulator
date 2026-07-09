import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Person } from "../models/Person";
import { formatPercentStat, PersonCard } from "./PersonCard";

vi.mock("../context/FacePoolContext", () => ({
	useFacePool: () => ({
		getFace: () => undefined,
		faceIds: [],
		isReady: true,
	}),
}));

vi.mock("facesjs/react", () => ({
	Face: () => null,
}));

function makePerson(overrides: {
	health?: number;
	happiness?: number;
	name?: string;
}): Person {
	const person = new Person();
	person.setIndex(0);
	person.setName(overrides.name ?? "Test Citizen");
	person.setAge(30);
	person.setSex("F");
	person.setIsAlive(true);
	person.setOverallHealth(overrides.health);
	person.setOverallHappiness(overrides.happiness);
	person.setOpenness(50);
	person.setConscientiousness(50);
	person.setExtraversion(50);
	person.setAgreeableness(50);
	person.setNeuroticism(50);
	return person;
}

describe("formatPercentStat", () => {
	it("ceils fractional values up to the next whole number", () => {
		expect(formatPercentStat(72.1)).toBe("73%");
		expect(formatPercentStat(72)).toBe("72%");
		expect(formatPercentStat(undefined)).toBe("—");
	});
});

describe("PersonCard", () => {
	it("displays ceiled health and happiness", () => {
		render(
			<PersonCard person={makePerson({ health: 72.1, happiness: 40.01 })} />,
		);

		expect(screen.getByText("73%")).toBeInTheDocument();
		expect(screen.getByText("41%")).toBeInTheDocument();
	});

	it("calls onOpenGlossary when the help button is clicked", () => {
		const onOpenGlossary = vi.fn();
		render(
			<PersonCard
				person={makePerson({ health: 50, happiness: 50 })}
				onOpenGlossary={onOpenGlossary}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "What do these stats mean?" }),
		);
		expect(onOpenGlossary).toHaveBeenCalledOnce();
	});
});
