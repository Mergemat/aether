import {
  type Icon,
  IconHandFinger,
  IconHandGrab,
  IconHandLoveYou,
  IconHandStop,
  IconHandTwoFingers,
} from "@tabler/icons-react";

const ICONS: Record<string, Icon> = {
  Open_Palm: IconHandStop,
  Closed_Fist: IconHandGrab,
  Pointing_Up: IconHandFinger,
  Victory: IconHandTwoFingers,
  ILoveYou: IconHandLoveYou,
};

export function GestureIcon({
  gesture,
  className,
}: {
  gesture: string;
  className?: string;
}) {
  const Glyph = ICONS[gesture] ?? IconHandStop;
  return <Glyph aria-hidden className={className} stroke={1.5} />;
}
