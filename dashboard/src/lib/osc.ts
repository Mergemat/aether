export interface OscMessage {
  address: string;
  value: number;
}

// "#bundle\0" followed by the "immediately" timetag (0 seconds, 1 fraction)
const BUNDLE_HEADER = [
  0x23, 0x62, 0x75, 0x6e, 0x64, 0x6c, 0x65, 0x00, 0, 0, 0, 0, 0, 0, 0, 1,
];
const COMMA = 0x2c;
const TAG_INT = 0x69;
const TAG_FLOAT = 0x66;

// Grown on demand and reused, so steady-state encoding allocates nothing
let bytes = new Uint8Array(1024);
let view = new DataView(bytes.buffer);

function reserve(offset: number, size: number) {
  if (offset + size <= bytes.length) {
    return;
  }
  const next = new Uint8Array(Math.max(bytes.length * 2, offset + size));
  next.set(bytes);
  bytes = next;
  view = new DataView(next.buffer);
}

function writeMessage(offset: number, { address, value }: OscMessage) {
  // Null-terminated and padded to a 4-byte boundary
  const addressSize = Math.ceil((address.length + 1) / 4) * 4;
  reserve(offset, addressSize + 8);

  for (let i = 0; i < address.length; i += 1) {
    bytes[offset + i] = address.charCodeAt(i);
  }
  bytes.fill(0, offset + address.length, offset + addressSize);
  let cursor = offset + addressSize;

  // Same typing as node-osc, which the bridge used before: whole numbers go
  // out as int32, everything else as float32
  const isInt = Math.floor(value) === value;
  bytes[cursor] = COMMA;
  bytes[cursor + 1] = isInt ? TAG_INT : TAG_FLOAT;
  bytes[cursor + 2] = 0;
  bytes[cursor + 3] = 0;
  cursor += 4;

  if (isInt) {
    view.setInt32(cursor, value);
  } else {
    view.setFloat32(cursor, value);
  }
  return cursor + 4;
}

/**
 * Encode messages into one ready-to-send OSC packet: a plain message when
 * there is one, otherwise a bundle so they share a single UDP datagram.
 * Returns a view into a shared buffer that is only valid until the next call.
 */
export function encodeOscPacket(
  messages: OscMessage[]
): Uint8Array<ArrayBuffer> {
  if (messages.length === 1) {
    return bytes.subarray(0, writeMessage(0, messages[0]));
  }

  reserve(0, BUNDLE_HEADER.length);
  bytes.set(BUNDLE_HEADER);
  let offset = BUNDLE_HEADER.length;

  for (const message of messages) {
    reserve(offset, 4);
    const start = offset + 4;
    const end = writeMessage(start, message);
    view.setInt32(offset, end - start);
    offset = end;
  }

  return bytes.subarray(0, offset);
}
