import { createWsMsg } from "src/utils/createWsMsg.ts";
import {
  CellValue,
  PlayerColor,
  type RagnarocksMsg,
  type RagnarocksMsgPayload,
  type RagnarocksMsgType,
} from "src/games/Ragnarocks/Ragnarocks.types.ts";
import { computeLeftOffsets } from "src/games/Ragnarocks/Ragnarocks.constants.ts";

export const createRagnarocksMsg = (type: RagnarocksMsgType, payload?: RagnarocksMsgPayload) =>
  createWsMsg(type, payload) as RagnarocksMsg;

export const getOppositeColor = (color: PlayerColor) =>
  color === PlayerColor.White ? PlayerColor.Red : PlayerColor.White;

export const isValidCell = (board: number[][], row: number, col: number): boolean =>
  row >= 0 && row < board.length && col >= 0 && col < board[row].length;

export const isOccupied = (cell: number): boolean => cell !== CellValue.Empty;

/**
 * Step one cell in the given direction from (row, col).
 * Returns null if out of bounds.
 * Directions: 0=E, 1=W, 2=NE, 3=NW, 4=SE, 5=SW
 */
export function hexStep(
  board: number[][],
  row: number,
  col: number,
  direction: number,
): [number, number] | null {
  const rowSizes = board.map((r) => r.length);
  const leftOffsets = computeLeftOffsets(rowSizes);
  let nr: number, nc: number;

  switch (direction) {
    case 0: // E
      nr = row;
      nc = col + 1;
      break;
    case 1: // W
      nr = row;
      nc = col - 1;
      break;
    case 2: { // NE
      nr = row - 1;
      if (nr < 0) return null;
      const shift = leftOffsets[nr] - leftOffsets[row];
      nc = shift === -1 ? col + 1 : col;
      break;
    }
    case 3: { // NW
      nr = row - 1;
      if (nr < 0) return null;
      const shift = leftOffsets[nr] - leftOffsets[row];
      nc = shift === -1 ? col : col - 1;
      break;
    }
    case 4: { // SE
      nr = row + 1;
      if (nr >= board.length) return null;
      const shift = leftOffsets[nr] - leftOffsets[row];
      nc = shift === -1 ? col + 1 : col;
      break;
    }
    case 5: { // SW
      nr = row + 1;
      if (nr >= board.length) return null;
      const shift = leftOffsets[nr] - leftOffsets[row];
      nc = shift === -1 ? col : col - 1;
      break;
    }
    default:
      return null;
  }

  if (!isValidCell(board, nr, nc)) return null;
  return [nr, nc];
}

/**
 * Get all cells reachable in a straight line from (row, col) in all 6 directions.
 * Stops before occupied cells.
 */
export function getReachableCells(
  board: number[][],
  row: number,
  col: number,
): [number, number][] {
  const result: [number, number][] = [];

  for (let dir = 0; dir < 6; dir++) {
    let cr = row;
    let cc = col;

    while (true) {
      const next = hexStep(board, cr, cc, dir);
      if (!next) break;
      const [nr, nc] = next;
      if (isOccupied(board[nr][nc])) break;
      result.push([nr, nc]);
      cr = nr;
      cc = nc;
    }
  }

  return result;
}

/**
 * Get hex neighbors of a cell.
 */
export function getNeighbors(board: number[][], row: number, col: number): [number, number][] {
  const result: [number, number][] = [];
  for (let dir = 0; dir < 6; dir++) {
    const next = hexStep(board, row, col, dir);
    if (next) result.push(next);
  }
  return result;
}

/**
 * Check if a viking at (row, col) is nomadic (in a region with enemy vikings).
 * A settled viking is in a region with only same-color vikings.
 */
export function isVikingNomadic(board: number[][], row: number, col: number): boolean {
  const cell = board[row][col];
  if (cell !== CellValue.WhiteViking && cell !== CellValue.RedViking) return false;

  const myColor = cell;
  const visited = new Set<string>();
  const stack: [number, number][] = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;

    const v = board[r][c];
    if (v === CellValue.Runestone) continue;

    visited.add(key);

    // Found enemy viking in this region
    if (
      (v === CellValue.WhiteViking || v === CellValue.RedViking) &&
      v !== myColor
    ) {
      return true;
    }

    for (const [nr, nc] of getNeighbors(board, r, c)) {
      if (!visited.has(`${nr},${nc}`)) {
        stack.push([nr, nc]);
      }
    }
  }

  return false;
}
