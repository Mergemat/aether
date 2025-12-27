import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const processHandLandmarks = (
  landmarks: NormalizedLandmark[],
  handedness: string
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
  const dx = landmarks[17].x - landmarks[5].x;
  const dy = landmarks[17].y - landmarks[5].y;

  let rotRaw = Math.atan2(dy, isLeft ? dx : -dx);
  if (isLeft) {
    rotRaw = -rotRaw;
  }

  const maxAngle = Math.PI / 4;

  return {
    y: Math.max(0, Math.min(1, scaledY)),
    rot: Math.max(0, Math.min(1, (rotRaw / maxAngle + 1) / 2)),
  };
};
