import type { Hand, Mapping } from "@/types";

export const GESTURES = [
  "Open_Palm",
  "Closed_Fist",
  "Pointing_Up",
  "Victory",
  "Thumb_Up",
  "Thumb_Down",
  "ILoveYou",
];

export const SMOOTHING = 0.2;

const CHANNEL_REGEX = /\/ch\/(\d+)/;

export const uid = () => crypto.randomUUID();

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const getNextAvailableAddress = (
  ms: Mapping[],
  hand: Hand,
  gesture: string,
  mode: string
) => {
  return `/${hand}/${GESTURES.indexOf(gesture)}/${mode}`;
};
