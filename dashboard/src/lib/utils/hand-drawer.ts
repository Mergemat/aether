import {
  type DrawingUtils,
  type GestureRecognizerResult,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

export const drawHandResults = (
  ctx: CanvasRenderingContext2D,
  results: GestureRecognizerResult,
  drawingUtils: DrawingUtils
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!results.landmarks) {
    return;
  }

  for (const landmarks of results.landmarks) {
    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS);
    drawingUtils.drawLandmarks(landmarks);
  }
};
