/** Hex size (outer radius) in pixels */
export const HEX_SIZE = 32;

/** Hex dimensions for pointy-top */
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

/**
 * Compute the left offset (in half-hex units) for a given row,
 * based on the board's row sizes. The first widest row has offset 0.
 */
export function computeLeftOffset(rowSizes: number[], row: number): number {
  const maxLen = Math.max(...rowSizes);
  const pivot = rowSizes.indexOf(maxLen);
  return row <= pivot ? pivot - row : row - pivot;
}

/**
 * Compute all left offsets for a board.
 */
export function computeLeftOffsets(rowSizes: number[]): number[] {
  return rowSizes.map((_, i) => computeLeftOffset(rowSizes, i));
}

/**
 * Convert hex grid coordinates to pixel position (center of hex).
 * Pointy-top hexagons with the offset layout described in the rules.
 */
export function hexToPixel(
  row: number,
  col: number,
  leftOffsets: number[],
): { x: number; y: number } {
  const y = row * HEX_HEIGHT * 0.75 + HEX_SIZE;
  const x = col * HEX_WIDTH + (leftOffsets[row] * HEX_WIDTH) / 2 + HEX_WIDTH / 2;
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

/** Compute SVG width for the board */
export function computeBoardWidth(rowSizes: number[], leftOffsets: number[]): number {
  const maxRow = rowSizes.indexOf(Math.max(...rowSizes));
  return (rowSizes[maxRow] - 1) * HEX_WIDTH + HEX_WIDTH + (leftOffsets[maxRow] * HEX_WIDTH) / 2 + HEX_WIDTH;
}

/** Compute SVG height for the board */
export function computeBoardHeight(rowCount: number): number {
  return (rowCount - 1) * HEX_HEIGHT * 0.75 + HEX_HEIGHT;
}
