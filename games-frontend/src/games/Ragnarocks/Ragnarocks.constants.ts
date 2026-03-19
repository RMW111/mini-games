/** Row sizes for the Ragnarocks board: 10 rows, 86 hexes total */
export const ROW_SIZES = [5, 6, 7, 8, 9, 10, 11, 11, 10, 9];

/**
 * Left offsets for each row (in half-hex units) relative to row 6 (leftmost).
 * Used for hex-to-pixel conversion and neighbor calculation.
 */
export const LEFT_OFFSETS = [6, 5, 4, 3, 2, 1, 0, 1, 2, 3];

/** Hex size (outer radius) in pixels */
export const HEX_SIZE = 32;

/** Hex dimensions for pointy-top */
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

/**
 * Convert hex grid coordinates to pixel position (center of hex).
 * Pointy-top hexagons with the offset layout described in the rules.
 */
export function hexToPixel(row: number, col: number): { x: number; y: number } {
  // Vertical spacing: 3/4 of hex height
  const y = row * HEX_HEIGHT * 0.75 + HEX_SIZE;

  // Horizontal: each cell is HEX_WIDTH apart, offset by the row's LEFT_OFFSET
  // LEFT_OFFSETS are in half-hex units, so multiply by HEX_WIDTH / 2
  const x = col * HEX_WIDTH + (LEFT_OFFSETS[row] * HEX_WIDTH) / 2 + HEX_WIDTH / 2;

  return { x, y };
}

/**
 * Generate SVG points for a pointy-top hexagon centered at (cx, cy).
 */
export function hexPoints(cx: number, cy: number, size: number = HEX_SIZE): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(" ");
}

/** Total SVG width and height for the board */
export const BOARD_WIDTH =
  (ROW_SIZES[6] - 1) * HEX_WIDTH + HEX_WIDTH + LEFT_OFFSETS[6] * HEX_WIDTH / 2 + HEX_WIDTH;
export const BOARD_HEIGHT = (ROW_SIZES.length - 1) * HEX_HEIGHT * 0.75 + HEX_HEIGHT;
