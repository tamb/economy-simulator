import type { CategoryId } from "economy-simulator-data";
import type { FaceId } from "../lib/faces";
import type { RegionId } from "../lib/regions";

/**
 * Big Five / OCEAN personality dimensions — the widely accepted
 * five-factor model in modern psychology.
 */
type PersonalityTrait =
	| "openness"
	| "conscientiousness"
	| "extraversion"
	| "agreeableness"
	| "neuroticism";

type PersonSex = "M" | "F";

/** Serializable person shape stored in IndexedDB. */
interface PersonSnapshot {
	index?: number;
	name?: string;
	faceId?: FaceId;
	age?: number;
	sex?: PersonSex;
	isAlive?: boolean;
	openness?: number;
	conscientiousness?: number;
	extraversion?: number;
	agreeableness?: number;
	neuroticism?: number;
	overallHappiness?: number;
	overallHealth?: number;
	categoryId?: CategoryId;
	subSectorId?: string;
	roleId?: number;
	regionId?: RegionId;
}

class Person {
	#index?: number;
	#name?: string;
	#faceId?: FaceId;
	#age?: number;
	#sex?: PersonSex;
	#isAlive?: boolean;
	#openness?: number;
	#conscientiousness?: number;
	#extraversion?: number;
	#agreeableness?: number;
	#neuroticism?: number;
	#overallHappiness?: number;
	#overallHealth?: number;
	#categoryId?: CategoryId;
	#subSectorId?: string;
	#roleId?: number;
	#regionId?: RegionId;

	static fromSnapshot(snapshot: PersonSnapshot): Person {
		const person = new Person();
		person.setIndex(snapshot.index);
		person.setName(snapshot.name);
		person.setFaceId(snapshot.faceId);
		person.setAge(snapshot.age);
		person.setSex(snapshot.sex);
		person.setIsAlive(snapshot.isAlive);
		person.setOpenness(snapshot.openness);
		person.setConscientiousness(snapshot.conscientiousness);
		person.setExtraversion(snapshot.extraversion);
		person.setAgreeableness(snapshot.agreeableness);
		person.setNeuroticism(snapshot.neuroticism);
		person.setOverallHappiness(snapshot.overallHappiness);
		person.setOverallHealth(snapshot.overallHealth);
		person.setCategoryId(snapshot.categoryId);
		person.setSubSectorId(snapshot.subSectorId);
		person.setRoleId(snapshot.roleId);
		person.setRegionId(snapshot.regionId);
		return person;
	}

	toSnapshot(): PersonSnapshot {
		return {
			index: this.#index,
			name: this.#name,
			faceId: this.#faceId,
			age: this.#age,
			sex: this.#sex,
			isAlive: this.#isAlive,
			openness: this.#openness,
			conscientiousness: this.#conscientiousness,
			extraversion: this.#extraversion,
			agreeableness: this.#agreeableness,
			neuroticism: this.#neuroticism,
			overallHappiness: this.#overallHappiness,
			overallHealth: this.#overallHealth,
			categoryId: this.#categoryId,
			subSectorId: this.#subSectorId,
			roleId: this.#roleId,
			regionId: this.#regionId,
		};
	}

	getIndex(): number | undefined {
		return this.#index;
	}

	setIndex(value: number | undefined): void {
		this.#index = value;
	}

	getName(): string | undefined {
		return this.#name;
	}

	setName(value: string | undefined): void {
		this.#name = value;
	}

	getFaceId(): FaceId | undefined {
		return this.#faceId;
	}

	setFaceId(value: FaceId | undefined): void {
		this.#faceId = value;
	}

	getAge(): number | undefined {
		return this.#age;
	}

	setAge(value: number | undefined): void {
		this.#age = value;
	}

	getSex(): PersonSex | undefined {
		return this.#sex;
	}

	setSex(value: PersonSex | undefined): void {
		this.#sex = value;
	}

	getIsAlive(): boolean | undefined {
		return this.#isAlive;
	}

	setIsAlive(value: boolean | undefined): void {
		this.#isAlive = value;
	}

	isLiving(): boolean {
		return this.#isAlive !== false;
	}

	getOpenness(): number | undefined {
		return this.#openness;
	}

	setOpenness(value: number | undefined): void {
		this.#openness = value;
	}

	getConscientiousness(): number | undefined {
		return this.#conscientiousness;
	}

	setConscientiousness(value: number | undefined): void {
		this.#conscientiousness = value;
	}

	getExtraversion(): number | undefined {
		return this.#extraversion;
	}

	setExtraversion(value: number | undefined): void {
		this.#extraversion = value;
	}

	getAgreeableness(): number | undefined {
		return this.#agreeableness;
	}

	setAgreeableness(value: number | undefined): void {
		this.#agreeableness = value;
	}

	getNeuroticism(): number | undefined {
		return this.#neuroticism;
	}

	setNeuroticism(value: number | undefined): void {
		this.#neuroticism = value;
	}

	getOverallHappiness(): number | undefined {
		return this.#overallHappiness;
	}

	setOverallHappiness(value: number | undefined): void {
		this.#overallHappiness = value;
	}

	getOverallHealth(): number | undefined {
		return this.#overallHealth;
	}

	setOverallHealth(value: number | undefined): void {
		this.#overallHealth = value;
	}

	getCategoryId(): CategoryId | undefined {
		return this.#categoryId;
	}

	setCategoryId(value: CategoryId | undefined): void {
		this.#categoryId = value;
	}

	getSubSectorId(): string | undefined {
		return this.#subSectorId;
	}

	setSubSectorId(value: string | undefined): void {
		this.#subSectorId = value;
	}

	getRoleId(): number | undefined {
		return this.#roleId;
	}

	setRoleId(value: number | undefined): void {
		this.#roleId = value;
	}

	getRegionId(): RegionId | undefined {
		return this.#regionId;
	}

	setRegionId(value: RegionId | undefined): void {
		this.#regionId = value;
	}

	getTrait(trait: PersonalityTrait): number | undefined {
		switch (trait) {
			case "openness":
				return this.#openness;
			case "conscientiousness":
				return this.#conscientiousness;
			case "extraversion":
				return this.#extraversion;
			case "agreeableness":
				return this.#agreeableness;
			case "neuroticism":
				return this.#neuroticism;
		}
	}

	setTrait(trait: PersonalityTrait, value: number | undefined): void {
		switch (trait) {
			case "openness":
				this.#openness = value;
				break;
			case "conscientiousness":
				this.#conscientiousness = value;
				break;
			case "extraversion":
				this.#extraversion = value;
				break;
			case "agreeableness":
				this.#agreeableness = value;
				break;
			case "neuroticism":
				this.#neuroticism = value;
				break;
		}
	}
}

export { Person, type PersonalityTrait, type PersonSex, type PersonSnapshot };
