export type Hand = "any" | "left" | "right";
export type Mode = "trigger" | "fader" | "knob";

export interface Mapping {
  id: string;
  enabled: boolean;
  gesture: string;
  hand: Hand;
  address: string;
  mode: Mode;
  range: { min: number; max: number };
  value?: number;
}

export interface HandData {
  y: number;
  rot: number;
}
