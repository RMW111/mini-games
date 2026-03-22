import { useMemo } from "react";
import { CellValue, TurnPhase } from "src/games/Ragnarocks/Ragnarocks.types.ts";
import {
  HEX_SIZE,
  hexPoints,
  hexToPixel,
  computeLeftOffsets,
  computeBoardWidth,
  computeBoardHeight,
} from "src/games/Ragnarocks/Ragnarocks.constants.ts";
import { isVikingNomadic } from "src/games/Ragnarocks/Ragnarocks.utils.ts";
import styles from "../Ragnarocks.module.scss";

const COLORS = {
  cellEmpty: "#2c2c2c",
  cellEmptyStroke: "#444444",
  cellReachable: "#3a3a3a",
  cellReachableStroke: "#ffffff",
  cellSelected: "#3a3a3a",
  cellSelectedStroke: "#ffffff",
  whiteViking: "#383838",
  whiteVikingStroke: "#555555",
  redViking: "#3a2c2c",
  redVikingStroke: "#5a3333",
  runestone: "#555555",
  runestoneStroke: "#777777",
};

interface HexBoardProps {
  board: number[][];
  selectedViking: [number, number] | null;
  reachableCells: Set<string>;
  isMyTurn: boolean;
  isGameOver: boolean;
  phase: TurnPhase;
  myVikingValue: CellValue;
  onCellClick: (row: number, col: number) => void;
}

const VikingIcon = ({ cx, cy, color }: { cx: number; cy: number; color: "white" | "red" }) => {
  const iconColor = color === "white" ? "#ffffff" : "#ff4d4d";
  const iconSize = HEX_SIZE * 0.9;
  const scale = iconSize / 24;
  return (
    <g
      transform={`translate(${cx - iconSize / 2}, ${cy - iconSize / 2}) scale(${scale})`}
      style={{ pointerEvents: "none" }}
    >
      <path
        d="m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9"
        fill="none"
        stroke={iconColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z"
        fill="none"
        stroke={iconColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};

const RunestoneIcon = ({ cx, cy }: { cx: number; cy: number }) => {
  const iconSize = HEX_SIZE * 0.9;
  const scale = iconSize / 24;
  return (
    <g
      transform={`translate(${cx - iconSize / 2}, ${cy - iconSize / 2}) scale(${scale})`}
      style={{ pointerEvents: "none" }}
    >
      <path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        fill="none"
        stroke="#aaaaaa"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};

const HexBoard = ({
  board,
  selectedViking,
  reachableCells,
  isMyTurn,
  isGameOver,
  phase,
  myVikingValue,
  onCellClick,
}: HexBoardProps) => {
  const rowSizes = useMemo(() => board.map((r) => r.length), [board]);
  const leftOffsets = useMemo(() => computeLeftOffsets(rowSizes), [rowSizes]);
  const boardWidth = useMemo(() => computeBoardWidth(rowSizes, leftOffsets), [rowSizes, leftOffsets]);
  const boardHeight = useMemo(() => computeBoardHeight(board.length), [board.length]);

  const getCellFill = (cellValue: number, row: number, col: number) => {
    const isSelected =
      selectedViking && selectedViking[0] === row && selectedViking[1] === col;
    if (isSelected) return COLORS.cellSelected;

    switch (cellValue) {
      case CellValue.WhiteViking:
        return COLORS.whiteViking;
      case CellValue.RedViking:
        return COLORS.redViking;
      case CellValue.Runestone:
        return COLORS.runestone;
      default:
        return reachableCells.has(`${row},${col}`) ? COLORS.cellReachable : COLORS.cellEmpty;
    }
  };

  const getCellStroke = (cellValue: number, row: number, col: number) => {
    const isSelected =
      selectedViking && selectedViking[0] === row && selectedViking[1] === col;
    if (isSelected) return COLORS.cellSelectedStroke;

    switch (cellValue) {
      case CellValue.WhiteViking:
        return COLORS.whiteVikingStroke;
      case CellValue.RedViking:
        return COLORS.redVikingStroke;
      case CellValue.Runestone:
        return COLORS.runestoneStroke;
      default:
        return reachableCells.has(`${row},${col}`)
          ? COLORS.cellReachableStroke
          : COLORS.cellEmptyStroke;
    }
  };

  const getCellCursor = (cellValue: number, row: number, col: number) => {
    if (!isMyTurn || isGameOver) return "default";

    if (phase === TurnPhase.MoveViking) {
      if (cellValue === myVikingValue && isVikingNomadic(board, row, col)) return "pointer";
      if (selectedViking && reachableCells.has(`${row},${col}`)) return "pointer";
    }

    if (phase === TurnPhase.PlaceRunestone) {
      if (reachableCells.has(`${row},${col}`)) return "pointer";
    }

    return "default";
  };

  const emptyCells: React.ReactNode[] = [];
  const occupiedCells: React.ReactNode[] = [];
  const highlightedCells: React.ReactNode[] = [];

  board.forEach((row, rowI) =>
    row.forEach((cell, colI) => {
      const { x, y } = hexToPixel(rowI, colI, leftOffsets);
      const key = `${rowI},${colI}`;
      const isReachable = reachableCells.has(key);
      const isSelected =
        selectedViking && selectedViking[0] === rowI && selectedViking[1] === colI;

      const node = (
        <g key={key} onClick={() => onCellClick(rowI, colI)}>
          <polygon
            points={hexPoints(x, y)}
            fill={getCellFill(cell, rowI, colI)}
            stroke={getCellStroke(cell, rowI, colI)}
            strokeWidth={isReachable || isSelected ? 2 : 1.5}
            style={{ cursor: getCellCursor(cell, rowI, colI) }}
          />
          {(cell === CellValue.WhiteViking || cell === CellValue.RedViking) && (
            <VikingIcon cx={x} cy={y} color={cell === CellValue.WhiteViking ? "white" : "red"} />
          )}
          {cell === CellValue.Runestone && <RunestoneIcon cx={x} cy={y} />}
        </g>
      );

      if (isReachable || isSelected) {
        highlightedCells.push(node);
      } else if (cell !== CellValue.Empty) {
        occupiedCells.push(node);
      } else {
        emptyCells.push(node);
      }
    }),
  );

  return (
    <div className={styles.boardContainer}>
      <svg
        width={boardWidth}
        height={boardHeight}
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
      >
        {emptyCells}
        {occupiedCells}
        {highlightedCells}
      </svg>
    </div>
  );
};

export default HexBoard;
