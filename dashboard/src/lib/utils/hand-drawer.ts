import {
  type GestureRecognizerResult,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// --- Stylish Cyberpunk / Sci-Fi HUD Theme ---
const THEME = {
  cyan: "#00f3ff",
  cyanDim: "rgba(0, 243, 255, 0.2)",
  cyanGlow: "rgba(0, 243, 255, 0.6)",
  blue: "#0066ff",
  blueDim: "rgba(0, 102, 255, 0.2)",
  white: "#ffffff",
  whiteDim: "rgba(255, 255, 255, 0.7)",
  alert: "#ff0055",
  font: "bold 12px 'JetBrains Mono', monospace",
  fontSmall: "10px 'JetBrains Mono', monospace",
};

interface HandValues {
  gesture: string;
  y: number;
  rot: number;
}

const PI_2 = Math.PI * 2;
const START_ANGLE = -Math.PI / 2;

// Helper to set glow effect
const setGlow = (ctx: CanvasRenderingContext2D, color: string, blur: number) => {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
};

const resetGlow = (ctx: CanvasRenderingContext2D) => {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
};

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

  // Outer glow for bones
  setGlow(ctx, THEME.cyan, 15);
  ctx.lineWidth = 3;
  ctx.strokeStyle = THEME.cyanDim;
  ctx.stroke();

  // Inner core for bones
  resetGlow(ctx);
  ctx.lineWidth = 1;
  ctx.strokeStyle = THEME.cyan;
  ctx.stroke();

  // 2. Draw Joints (Nodes)
  for (const landmark of landmarks) {
    const cx = landmark.x * width;
    const cy = landmark.y * height;

    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, PI_2);

    // Node Glow
    setGlow(ctx, THEME.white, 10);
    ctx.fillStyle = THEME.white;
    ctx.fill();

    // Reset for next
    resetGlow(ctx);
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

  // --- 1. Rotation Ring (Tech Circle) ---
  const ringRadius = 32;

  // Background Ring (Thin, technical)
  ctx.beginPath();
  ctx.arc(palmX, palmY, ringRadius, 0, PI_2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = THEME.cyanDim;
  ctx.stroke();

  // Decorative Ticks on Ring
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * PI_2;
    const x1 = palmX + Math.cos(angle) * (ringRadius - 2);
    const y1 = palmY + Math.sin(angle) * (ringRadius - 2);
    const x2 = palmX + Math.cos(angle) * (ringRadius + 2);
    const y2 = palmY + Math.sin(angle) * (ringRadius + 2);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = THEME.cyanDim;
    ctx.stroke();
  }

  // Active Value Arc
  const endAngle = START_ANGLE - values.rot * PI_2;
  ctx.beginPath();
  ctx.arc(palmX, palmY, ringRadius, START_ANGLE, endAngle, true); // counter-clockwise

  setGlow(ctx, THEME.cyan, 15);
  ctx.lineWidth = 3;
  ctx.strokeStyle = THEME.cyan;
  ctx.stroke();
  resetGlow(ctx);

  // Label "ROT"
  ctx.save();
  ctx.translate(palmX, palmY);
  ctx.scale(-1, 1); // Mirror text
  ctx.fillStyle = THEME.white;
  ctx.font = THEME.fontSmall;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ROT", 0, -4);

  // Numeric Value
  ctx.fillStyle = THEME.cyan;
  ctx.font = "bold 10px 'JetBrains Mono'";
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

  const sliderDist = 50;
  const sliderX = handedness === "right" ? minX - sliderDist : maxX + sliderDist;
  const sliderHeight = 100;
  const sliderTop = palmY - sliderHeight / 2;
  const sliderBottom = palmY + sliderHeight / 2;

  // Track Line (Dashed/Tech)
  ctx.beginPath();
  ctx.moveTo(sliderX, sliderTop);
  ctx.lineTo(sliderX, sliderBottom);
  ctx.lineWidth = 1;
  ctx.strokeStyle = THEME.blueDim;
  ctx.setLineDash([4, 4]); // Dashed line
  ctx.stroke();
  ctx.setLineDash([]); // Reset

  // Active Fill Bar
  const fillHeight = sliderHeight * values.y;
  const currentY = sliderBottom - fillHeight;

  ctx.beginPath();
  ctx.moveTo(sliderX, sliderBottom);
  ctx.lineTo(sliderX, currentY);
  setGlow(ctx, THEME.cyan, 10);
  ctx.lineWidth = 4;
  ctx.strokeStyle = THEME.cyan;
  ctx.stroke();
  resetGlow(ctx);

  // Indicator Triangle/Tick at current level
  ctx.beginPath();
  const tickSize = 6;
  if (handedness === "right") {
    ctx.moveTo(sliderX - tickSize, currentY);
    ctx.lineTo(sliderX - tickSize * 2, currentY - tickSize / 2);
    ctx.lineTo(sliderX - tickSize * 2, currentY + tickSize / 2);
  } else {
    ctx.moveTo(sliderX + tickSize, currentY);
    ctx.lineTo(sliderX + tickSize * 2, currentY - tickSize / 2);
    ctx.lineTo(sliderX + tickSize * 2, currentY + tickSize / 2);
  }
  ctx.fillStyle = THEME.white;
  ctx.fill();

  // Label
  ctx.save();
  ctx.translate(sliderX, sliderBottom + 20);
  ctx.scale(-1, 1);
  ctx.fillStyle = THEME.white;
  ctx.font = THEME.font;
  ctx.textAlign = "center";
  ctx.fillText("Y-AXIS", 0, 0);
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
