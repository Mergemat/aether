export const GESTURES = [
  "Open_Palm",
  "Closed_Fist",
  "Pointing_Up",
  "Victory",
  "ILoveYou",
] as const;

export const GESTURE_LABELS: Record<string, string> = {
  Open_Palm: "Open palm",
  Closed_Fist: "Fist",
  Pointing_Up: "Point up",
  Victory: "Victory",
  ILoveYou: "I love you",
};

export const MODE_LABELS = {
  trigger: "Trigger",
  fader: "Fader",
  knob: "Knob",
  switch: "Switch",
} as const;

export const IGNORED_GESTURES = ["Thumb_Up", "Thumb_Down"] as const;

/**
 * Palm height range the fader spans, in image coordinates (0 = top of the
 * frame). Shared by hand processing and the overlay's fader rulers.
 */
export const FADER_TOP = 0.4;
export const FADER_BOTTOM = 0.8;
