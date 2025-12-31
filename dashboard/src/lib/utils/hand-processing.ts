import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { clamp } from "./clamp";

const PALM_INDICES = [0, 5, 9, 13, 17];

const ROTATION_LANDMARK_MAP = new Map<string, [number, number]>([
  ["Open_Palm", [5, 17]],
  ["ILoveYou", [5, 17]],
  ["Victory", [5, 9]],
  ["Pointing_Up", [0, 5]],
  ["Closed_Fist", [0, 9]],
  ["Thumb_Up", [0, 9]],
  ["Thumb_Down", [0, 9]],
]);

const getRotationLandmarks = (gesture: string): [number, number] => {
  return ROTATION_LANDMARK_MAP.get(gesture) ?? [0, 9];
};

export const processHandLandmarks = (
  landmarks: NormalizedLandmark[],
  handedness: string,
  gesture = "None"
) => {
  // Average palm joints to get a stable center point
  const avgY =
    PALM_INDICES.reduce((sum, i) => sum + landmarks[i].y, 0) /
    PALM_INDICES.length;

  const y = 1 - avgY;

  const MIN_Y = 0.2;
  const MAX_Y = 0.6;
  const scaledY = (y - MIN_Y) / (MAX_Y - MIN_Y);

  const isLeft = handedness.toLowerCase() === "left";

  // Get gesture-specific landmarks for rotation
  const [fromIdx, toIdx] = getRotationLandmarks(gesture);
  const dx = landmarks[toIdx].x - landmarks[fromIdx].x;
  const dy = landmarks[toIdx].y - landmarks[fromIdx].y;

  let rotRaw = Math.atan2(dy, isLeft ? dx : -dx);
  if (isLeft) {
    rotRaw = -rotRaw;
  }

  const maxAngle = Math.PI / 4;

  const normY = Math.max(0, Math.min(1, scaledY));
  const normRot = Math.max(0, Math.min(1, (rotRaw / maxAngle + 1) / 2));

  return {
    y: Math.round(clamp(normY, 0, 1) * 1000) / 1000,
    rot: Math.round(clamp(normRot, 0, 1) * 1000) / 1000,
  };
};
