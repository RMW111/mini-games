import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicTacToe from "./TicTacToe.tsx";
import { CellValue, type GameState } from "./TicTacToe.types.ts";
import { ParticipantRole } from "src/types/participant.ts";
import { SessionStatus, type Session } from "src/types/session.ts";

const mockSendGameMsg = vi.fn();
const mockNavigate = vi.fn();

vi.mock("jotai/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jotai/index")>();
  return {
    ...actual,
    useAtom: () => [{ id: "user1" }, vi.fn()],
  };
});

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "ticTacToe" }),
}));

vi.mock("src/hooks/useSessionWS.ts", () => ({
  useSessionWS: () => ({ sendGameMsg: mockSendGameMsg, sendCursorMsg: vi.fn() }),
}));

vi.mock("src/api", () => ({
  API: {
    sessions: {
      createNew: vi.fn().mockResolvedValue({ sessionId: "new-session" }),
    },
  },
}));

const emptyBoard: CellValue[][] = [
  [CellValue.Empty, CellValue.Empty, CellValue.Empty],
  [CellValue.Empty, CellValue.Empty, CellValue.Empty],
  [CellValue.Empty, CellValue.Empty, CellValue.Empty],
];

const creatorParticipant = {
  userId: "user1",
  role: ParticipantRole.Creator,
  email: "user1@test.com",
  avatarUrl: "",
};

const opponentParticipant = {
  userId: "user2",
  role: ParticipantRole.Player,
  email: "user2@test.com",
  avatarUrl: "",
};

const buildSession = (
  overrides: Partial<GameState> = {},
  sessionOverrides: Partial<Session<GameState>> = {}
): Session<GameState> => ({
  id: "session1",
  status: SessionStatus.InProgress,
  createdAt: "2026-01-01",
  participants: [creatorParticipant, opponentParticipant],
  gameState: {
    board: emptyBoard,
    currentTurn: CellValue.X,
    winner: null,
    isDraw: false,
    ...overrides,
  },
  ...sessionOverrides,
});

const renderComponent = (session: Session<GameState>) => {
  const socket = createRef<WebSocket>() as React.RefObject<WebSocket>;
  return render(
    <TicTacToe
      socket={socket}
      session={session}
      updateGameState={vi.fn()}
      serverMsg={null as any}
    />
  );
};

describe("TicTacToe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 9 cells", () => {
    renderComponent(buildSession());
    // Each cell is a div rendered by renderCell; the board has 3x3 = 9 cells
    const cells = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("cell")
    );
    expect(cells).toHaveLength(9);
  });

  it('shows "Ожидание соперника..." when only one participant', () => {
    const session = buildSession({}, { participants: [creatorParticipant] });
    renderComponent(session);
    expect(screen.getByText("Ожидание соперника...")).toBeInTheDocument();
  });

  it('shows "Ваш ход" when it is the user\'s turn', () => {
    renderComponent(buildSession({ currentTurn: CellValue.X }));
    expect(screen.getByText("Ваш ход")).toBeInTheDocument();
  });

  it('shows "Ход соперника" when it is the opponent\'s turn', () => {
    renderComponent(buildSession({ currentTurn: CellValue.O }));
    expect(screen.getByText("Ход соперника")).toBeInTheDocument();
  });

  it('shows "Вы победили!" when the user wins', () => {
    const board: CellValue[][] = [
      [CellValue.X, CellValue.X, CellValue.X],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
    ];
    renderComponent(
      buildSession(
        { board, winner: CellValue.X, currentTurn: CellValue.O },
        { status: SessionStatus.Completed }
      )
    );
    expect(screen.getByText(/Вы победили/)).toBeInTheDocument();
  });

  it('shows "Вы проиграли" when the opponent wins', () => {
    const board: CellValue[][] = [
      [CellValue.O, CellValue.O, CellValue.O],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
    ];
    renderComponent(
      buildSession(
        { board, winner: CellValue.O, currentTurn: CellValue.X },
        { status: SessionStatus.Completed }
      )
    );
    expect(screen.getByText(/Вы проиграли/)).toBeInTheDocument();
  });

  it('shows "Ничья" on draw', () => {
    renderComponent(
      buildSession(
        { isDraw: true },
        { status: SessionStatus.Completed }
      )
    );
    expect(screen.getByText(/Ничья/)).toBeInTheDocument();
  });

  it("sends a move message when clicking an empty cell on user's turn", async () => {
    const user = userEvent.setup();
    renderComponent(buildSession({ currentTurn: CellValue.X }));
    const cells = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("cell")
    );
    await user.click(cells[0]);
    expect(mockSendGameMsg).toHaveBeenCalledOnce();
  });

  it("does not send a move when clicking an occupied cell", async () => {
    const user = userEvent.setup();
    const board: CellValue[][] = [
      [CellValue.O, CellValue.Empty, CellValue.Empty],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
    ];
    renderComponent(buildSession({ board, currentTurn: CellValue.X }));
    const cells = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("cell")
    );
    await user.click(cells[0]);
    expect(mockSendGameMsg).not.toHaveBeenCalled();
  });

  it("does not send a move when it is the opponent's turn", async () => {
    const user = userEvent.setup();
    renderComponent(buildSession({ currentTurn: CellValue.O }));
    const cells = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("cell")
    );
    await user.click(cells[0]);
    expect(mockSendGameMsg).not.toHaveBeenCalled();
  });

  it("highlights winning cells", () => {
    const board: CellValue[][] = [
      [CellValue.X, CellValue.X, CellValue.X],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
      [CellValue.Empty, CellValue.Empty, CellValue.Empty],
    ];
    renderComponent(
      buildSession(
        { board, winner: CellValue.X },
        { status: SessionStatus.Completed }
      )
    );
    const cells = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("cell")
    );
    expect(cells[0].className).toMatch(/winner/);
    expect(cells[1].className).toMatch(/winner/);
    expect(cells[2].className).toMatch(/winner/);
    expect(cells[3].className).not.toMatch(/winner/);
  });

  it('shows "Новая игра" button when game is over', () => {
    renderComponent(
      buildSession(
        { isDraw: true },
        { status: SessionStatus.Completed }
      )
    );
    expect(screen.getByText("Новая игра")).toBeInTheDocument();
  });

  it('does not show "Новая игра" button while game is in progress', () => {
    renderComponent(buildSession());
    expect(screen.queryByText("Новая игра")).not.toBeInTheDocument();
  });
});
