import {
  type GestureRecognizerResult,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// --- Sleek Minimalist Theme ---
const THEME = {
  primary: "#ffffff",
  primaryDim: "rgba(255, 255, 255, 0.4)",
  secondary: "#a1a1aa", // Zinc 400
  secondaryDim: "rgba(161, 161, 170, 0.2)",
  font: "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSmall: "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

interface HandValues {
  gesture: string;
  y: number;
  rot: number;
}

const PI_2 = Math.PI * 2;
const START_ANGLE = -Math.PI / 2;

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
    ctx.arc(cx, cy, 2.5, 0, PI_2);

    // Simple minimal node
    ctx.fillStyle = THEME.primary;
    ctx.fill();
  }
};

const drawHUD = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  values: HandValues,
  handedness: "left" | "right",
  width: number,
  height: number
) => {
  // Palm Center Calculation
  const p0 = landmarks[0];
  const p5 = landmarks[5];
  const p17 = landmarks[17];
  const palmX = ((p0.x + p5.x + p17.x) / 3) * width;
  const palmY = ((p0.y + p5.y + p17.y) / 3) * height;

  // --- 1. Rotation Ring ---
  const ringRadius = 32;

  // Background Ring (Simple circle)
  ctx.beginPath();
  ctx.arc(palmX, palmY, ringRadius, 0, PI_2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = THEME.secondaryDim;
  ctx.stroke();

  // Active Value Arc
  const endAngle = START_ANGLE - values.rot * PI_2;
  ctx.beginPath();
  ctx.arc(palmX, palmY, ringRadius, START_ANGLE, endAngle, true); // counter-clockwise

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = THEME.primary;
  ctx.stroke();

  // Label "ROT"
  ctx.save();
  ctx.translate(palmX, palmY);
  ctx.scale(-1, 1); // Mirror text
  ctx.fillStyle = THEME.primary;
  ctx.font = THEME.fontSmall;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ROT", 0, -6);

  // Numeric Value
  ctx.fillStyle = THEME.primary;
  ctx.font = THEME.font;
  ctx.fillText(values.rot.toFixed(2), 0, 8);
  ctx.restore();

  // --- 2. Y-Value Slider (Vertical Bar) ---
  // Determine bounding box for positioning
  let minX = landmarks[0].x;
  let maxX = landmarks[0].x;
  for (const l of landmarks) {
    if (l.x < minX) {
      minX = l.x;
    }
    if (l.x > maxX) {
      maxX = l.x;
    }
  }
  minX *= width;
  maxX *= width;

  const sliderDist = 40;
  const sliderX = handedness === "right" ? minX - sliderDist : maxX + sliderDist;
  const sliderHeight = 80;
  const sliderTop = palmY - sliderHeight / 2;
  const sliderBottom = palmY + sliderHeight / 2;

  // Track Line
  ctx.beginPath();
  ctx.moveTo(sliderX, sliderTop);
  ctx.lineTo(sliderX, sliderBottom);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = THEME.secondaryDim;
  ctx.stroke();

  // Active Fill Bar
  const fillHeight = sliderHeight * values.y;
  const currentY = sliderBottom - fillHeight;

  ctx.beginPath();
  ctx.moveTo(sliderX, sliderBottom);
  ctx.lineTo(sliderX, currentY);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = THEME.primary;
  ctx.stroke();

  // Indicator Dot
  ctx.beginPath();
  ctx.arc(sliderX, currentY, 3, 0, PI_2);
  ctx.fillStyle = THEME.primary;
  ctx.fill();

  // Label
  ctx.save();
  ctx.translate(sliderX, sliderBottom + 16);
  ctx.scale(-1, 1);
  ctx.fillStyle = THEME.secondary;
  ctx.font = THEME.fontSmall;
  ctx.textAlign = "center";
  ctx.fillText("Y", 0, 0);
  ctx.restore();
};

export const drawHandResults = (
  ctx: CanvasRenderingContext2D,
  results: GestureRecognizerResult,
  handValues?: { left?: HandValues; right?: HandValues }
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
    const handedness = results.handednesses[i]?.[0]?.categoryName?.toLowerCase() as
      | "left"
      | "right";
    const values = handValues?.[handedness];

    drawSkeleton(ctx, landmarks, width, height);

    if (values && values.gesture !== "None") {
      drawHUD(ctx, landmarks, values, handedness, width, height);
    }
  }
};
