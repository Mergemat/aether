/**
 * Draws tracked hands over the camera preview: a thin skeleton and a small
 * label with the hand and its gesture. Runs in the vision worker.
 */
import {
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { GESTURE_LABELS } from "@/lib/constants";
import type { Hand } from "@/types";

// Mirrors --print and --panel in index.css
const PRINT_RGB = "230, 227, 220";
const PANEL_RGB = "24, 25, 27";
const FONT = '"IBM Plex Mono", ui-monospace, monospace';
const FINGERTIPS = new Set([4, 8, 12, 16, 20]);

export interface HandDetection {
  gesture: string;
  landmarks: NormalizedLandmark[];
  side: Hand;
}

interface Point {
  x: number;
  y: number;
}

export function createHandOverlay(ctx: OffscreenCanvasRenderingContext2D) {
  // Device pixels per CSS pixel, so strokes and text keep their size
  let px = 1;

  function drawSkeleton(points: Point[], alpha: number) {
    ctx.beginPath();
    for (const { start, end } of HandLandmarker.HAND_CONNECTIONS) {
      ctx.moveTo(points[start].x, points[start].y);
      ctx.lineTo(points[end].x, points[end].y);
    }
    ctx.strokeStyle = `rgba(${PRINT_RGB}, ${0.75 * alpha})`;
    ctx.lineWidth = 1.5 * px;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    for (const [i, { x, y }] of points.entries()) {
      const radius = (FINGERTIPS.has(i) ? 3.5 : 2.5) * px;
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fillStyle = `rgba(${PRINT_RGB}, ${alpha})`;
    ctx.fill();
  }

  function drawLabel(points: Point[], hand: HandDetection) {
    const side = hand.side === "left" ? "L" : "R";
    const text = `${side} · ${GESTURE_LABELS[hand.gesture] ?? hand.gesture}`;
    // Below the wrist, where it never covers the fingers
    const [wrist] = points;
    const size = 11 * px;
    const padX = 6 * px;
    const padY = 4 * px;

    ctx.font = `500 ${size}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const width = ctx.measureText(text).width + padX * 2;
    const height = size + padY * 2;
    const x = Math.min(
      Math.max(wrist.x - width / 2, 4 * px),
      ctx.canvas.width - width - 4 * px
    );
    const y = Math.min(wrist.y + 14 * px, ctx.canvas.height - height - 4 * px);

    ctx.fillStyle = `rgba(${PANEL_RGB}, 0.85)`;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = `rgb(${PRINT_RGB})`;
    ctx.fillText(text, x + width / 2, y + height / 2);
  }

  return {
    resize(width: number, height: number, pixelRatio: number) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      px = pixelRatio;
    },

    draw(hands: HandDetection[], frameWidth: number, frameHeight: number) {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);

      // Same crop as the preview's object-cover, mirrored like the preview
      const scale = Math.max(width / frameWidth, height / frameHeight);
      const ox = (width - frameWidth * scale) / 2;
      const oy = (height - frameHeight * scale) / 2;

      for (const hand of hands) {
        const points = hand.landmarks.map(({ x, y }) => ({
          x: ox + (1 - x) * frameWidth * scale,
          y: oy + y * frameHeight * scale,
        }));
        const active = hand.gesture !== "None";
        drawSkeleton(points, active ? 1 : 0.4);
        if (active) {
          drawLabel(points, hand);
        }
      }
    },
  };
}
