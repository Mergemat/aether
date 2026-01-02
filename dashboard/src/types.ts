import type { GESTURES } from "./lib/constants";

export type Hand = "left" | "right";
export type Mode = "trigger" | "fader" | "knob" | "switch";

export interface HandData {
  y: number;
  rot: number;
}

export interface GestureHandData {
  gesture: string;
  y: number;
  rot: number;
}

export interface BothHandsData {
  left: GestureHandData;
  right: GestureHandData;
}

export interface Mapping {
  id: string;
  enabled: boolean;
  gesture: string;
  hand: Hand;
  address: string;
  mode: Mode;
}

export type Gesture = keyof typeof GESTURES;
