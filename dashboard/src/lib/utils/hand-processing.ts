import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const processHandLandmarks = (
  landmarks: NormalizedLandmark[],
  handedness: string
) => {
  const y = 1 - landmarks[9].y;

  const MIN_Y = 0.2;
  const MAX_Y = 0.8;
  const scaledY = (y - MIN_Y) / (MAX_Y - MIN_Y);

  const isLeft = handedness.toLowerCase() === "left";
  const dx = landmarks[17].x - landmarks[5].x;
  const dy = landmarks[17].y - landmarks[5].y;
  const rotRaw = Math.atan2(dy, isLeft ? dx : -dx);
  const maxAngle = Math.PI / 4;

  return {
    y: scaledY,
    rot: (rotRaw / maxAngle + 1) / 2,
  };
};
