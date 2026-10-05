import type { GESTURES } from "./lib/constants";

export type Hand = "left" | "right";
export type Mode = "trigger" | "fader" | "knob" | "switch";

export interface HandData {
  rot: number;
  y: number;
}

export interface GestureHandData {
  gesture: string;
  rot: number;
  y: number;
}

export interface BothHandsData {
  left: GestureHandData;
  right: GestureHandData;
}

export interface Mapping {
  address: string;
  enabled: boolean;
  gesture: string;
  hand: Hand;
  id: string;
  mode: Mode;
}

export type Gesture = (typeof GESTURES)[number];
