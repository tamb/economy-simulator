import { describe, expect, it } from "vitest";
import { Person, type PersonSnapshot } from "./Person";

describe("Person", () => {
	it("reads and writes identity fields through accessors", () => {
		const person = new Person();

		person.setIndex(42);
		person.setName("Ada Lovelace");
		person.setFaceId("07");
		person.setAge(36);
		person.setSex("F");
		person.setIsAlive(true);

		expect(person.getIndex()).toBe(42);
		expect(person.getName()).toBe("Ada Lovelace");
		expect(person.getFaceId()).toBe("07");
		expect(person.getAge()).toBe(36);
		expect(person.getSex()).toBe("F");
		expect(person.getIsAlive()).toBe(true);
		expect(person.isLiving()).toBe(true);
	});

	it("reads and writes stats and traits through accessors", () => {
		const person = new Person();

		person.setOverallHealth(80);
		person.setOverallHappiness(65);
		person.setOpenness(4);
		person.setConscientiousness(5);
		person.setExtraversion(3);
		person.setAgreeableness(2);
		person.setNeuroticism(1);

		expect(person.getOverallHealth()).toBe(80);
		expect(person.getOverallHappiness()).toBe(65);
		expect(person.getTrait("openness")).toBe(4);
		expect(person.getTrait("conscientiousness")).toBe(5);
		expect(person.getTrait("extraversion")).toBe(3);
		expect(person.getTrait("agreeableness")).toBe(2);
		expect(person.getTrait("neuroticism")).toBe(1);
	});

	it("updates traits through setTrait", () => {
		const person = new Person();

		person.setTrait("openness", 7);
		person.setTrait("neuroticism", 2);

		expect(person.getOpenness()).toBe(7);
		expect(person.getNeuroticism()).toBe(2);
	});

	it("reads and writes job sector fields through accessors", () => {
		const person = new Person();

		person.setCategoryId("services");
		person.setSubSectorId("healthcare");

		expect(person.getCategoryId()).toBe("services");
		expect(person.getSubSectorId()).toBe("healthcare");
	});

	it("reads and writes home region through accessors", () => {
		const person = new Person();

		person.setRegionId("R07");

		expect(person.getRegionId()).toBe("R07");
	});

	it("treats missing isAlive as living", () => {
		const person = new Person();

		expect(person.getIsAlive()).toBeUndefined();
		expect(person.isLiving()).toBe(true);
	});

	it("round-trips through snapshot serialization", () => {
		const snapshot: PersonSnapshot = {
			index: 1,
			name: "Test Citizen",
			faceId: "42",
			age: 10,
			sex: "M",
			isAlive: true,
			openness: 1,
			conscientiousness: 2,
			extraversion: 3,
			agreeableness: 4,
			neuroticism: 5,
			overallHappiness: 55,
			overallHealth: 66,
			categoryId: "services",
			subSectorId: "healthcare",
			regionId: "R07",
		};

		const person = Person.fromSnapshot(snapshot);

		expect(person.toSnapshot()).toEqual(snapshot);
	});
});
