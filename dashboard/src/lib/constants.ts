export const GESTURES = [
  "Open_Palm",
  "Closed_Fist",
  "Pointing_Up",
  "Victory",
  "ILoveYou",
] as const;

export const GESTURE_EMOJIS = {
  Open_Palm: "✋",
  Closed_Fist: "✊",
  Pointing_Up: "☝️",
  Victory: "✌️",
  ILoveYou: "🤟",
} as const;

export const IGNORED_GESTURES = ["Thumb_Up", "Thumb_Down"] as const;
