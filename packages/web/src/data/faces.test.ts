import { describe, expect, it } from "vitest";
import {
	FACE_POOL_SIZE,
	formatFaceId,
	getFacePoolIds,
	isFaceId,
} from "./faces";

describe("faces data", () => {
	it("formats short zero-padded ids", () => {
		expect(formatFaceId(0)).toBe("00");
		expect(formatFaceId(9)).toBe("09");
		expect(formatFaceId(99)).toBe("99");
	});

	it("builds the configured pool size", () => {
		const ids = getFacePoolIds();
		expect(ids).toHaveLength(FACE_POOL_SIZE);
		expect(ids[0]).toBe("00");
		expect(ids.at(-1)).toBe("99");
	});

	it("validates stored face ids", () => {
		expect(isFaceId("00")).toBe(true);
		expect(isFaceId("99")).toBe(true);
		expect(isFaceId("100")).toBe(false);
		expect(isFaceId("abc")).toBe(false);
	});
});
