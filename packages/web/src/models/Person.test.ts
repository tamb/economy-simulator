import { describe, expect, it } from "vitest";
import { Person } from "./Person";

describe("Person roleId", () => {
	it("round-trips roleId through snapshot serialization", () => {
		const person = new Person();
		person.setRoleId(65);
		const restored = Person.fromSnapshot(person.toSnapshot());
		expect(restored.getRoleId()).toBe(65);
	});
});
