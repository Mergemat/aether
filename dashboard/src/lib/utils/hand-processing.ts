import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { clamp } from "./clamp";

/**
 * Get the landmark indices to use for rotation calculation based on gesture.
 * Different gestures have different fingers visible/extended, so we use
 * landmarks that are most reliable for each gesture.
 *
 * Returns [fromIndex, toIndex] for calculating the rotation angle.
 */
const getRotationLandmarks = (gesture: string): [number, number] => {
  switch (gesture) {
    // Full palm visible - use index to pinky base
    case "Open_Palm":
    case "ILoveYou":
      return [5, 17];

    // Index and middle extended - use index to middle base
    case "Victory":
      return [5, 9];

    // Only index extended - use wrist to index base
    case "Pointing_Up":
      return [0, 5];

    // Fist-based gestures - use wrist to middle base (stable palm points)
    case "Closed_Fist":
    case "Thumb_Up":
    case "Thumb_Down":
      return [0, 9];

    // Default fallback - use wrist to middle base
    default:
      return [0, 9];
  }
};

export const processHandLandmarks = (
  landmarks: NormalizedLandmark[],
  handedness: string,
  gesture = "None"
) => {
  // Average palm joints to get a stable center point
  const palmIndices = [0, 5, 9, 13, 17];
  const avgY =
    palmIndices.reduce((sum, i) => sum + landmarks[i].y, 0) /
    palmIndices.length;

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
