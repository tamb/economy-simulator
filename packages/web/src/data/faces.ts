import { appConfig } from "economy-simulator-data";

const FACE_POOL_SIZE = appConfig.facePool.size;

type FaceId = string;

function formatFaceId(index: number): FaceId {
	return index.toString().padStart(2, "0");
}

function getFacePoolIds(): FaceId[] {
	return Array.from({ length: FACE_POOL_SIZE }, (_, index) =>
		formatFaceId(index),
	);
}

function isFaceId(value: unknown): value is FaceId {
	return typeof value === "string" && /^\d{2}$/.test(value);
}

export type { FaceId };
export { FACE_POOL_SIZE, formatFaceId, getFacePoolIds, isFaceId };
