import {
  type GestureRecognizerResult,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// --- Sleek Minimalist Theme ---
const THEME = {
  primary: "#7780fc",
  primaryDim: "#7780fc",
  secondary: "rgba(161, 161, 170, 1)", // Zinc 400
  secondaryDim: "rgba(161, 161, 170, 1)",
  font: "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSmall:
    "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const PI_2 = Math.PI * 2;

const drawSkeleton = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number
) => {
  // 1. Draw Connections (Bones)
  ctx.beginPath();
  for (const connection of HandLandmarker.HAND_CONNECTIONS) {
    const start = landmarks[connection.start];
    const end = landmarks[connection.end];
    ctx.moveTo(start.x * width, start.y * height);
    ctx.lineTo(end.x * width, end.y * height);
  }

  // Clean bone lines
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = THEME.primaryDim;
  ctx.stroke();

  // 2. Draw Joints (Nodes)
  for (const landmark of landmarks) {
    const cx = landmark.x * width;
    const cy = landmark.y * height;

    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, PI_2);

    // Simple minimal node
    ctx.fillStyle = THEME.primary;
    ctx.fill();
  }
};

export const drawHandResults = (
  ctx: CanvasRenderingContext2D,
  results: GestureRecognizerResult
) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (!results.landmarks?.length) {
    return;
  }

  // Common config
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < results.landmarks.length; i++) {
    const landmarks = results.landmarks[i];
    drawSkeleton(ctx, landmarks, width, height);
  }
};
