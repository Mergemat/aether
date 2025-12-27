export type Hand = "left" | "right";
export type Mode = "trigger" | "fader" | "knob";

export interface HandData {
  y: number;
  rot: number;
}

export interface Mapping {
  id: string;
  enabled: boolean;
  gesture: string;
  hand: Hand;
  address: string;
  mode: Mode;
}
