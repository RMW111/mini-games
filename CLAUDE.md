# Workflow

For every task that involves code changes:

1. Create a new git branch before making any changes: `git checkout -b <descriptive-branch-name>`
2. Make all changes on that branch
3. Commit the changes
4. Push the branch to GitHub
5. Open a Pull Request on GitHub so the user can review the diff and decide whether to merge

Branch names should be short and descriptive in English (e.g. `feature/tic-tac-toe-frontend`, `fix/session-slug-mismatch`).

# Frontend Components (`games-frontend/src/components/`)

## UI Components (`ui/`)

- **Button** — Universal button with variants (`primary`, `secondary`, `danger`), loading spinner, disabled state. Can render as `<a>` via `href` prop.
- **Panel** — Dark card/panel container (bg, border, shadow, 320px width, flex column). Base for side panels, game-over screens, waiting screens. Accepts `className` for overrides.
- **CopyableInput** — Read-only input with a copy-to-clipboard button. Shows check icon on success for 2.5s.
- **Popup** — Modal dialog with overlay, title, close button, and fade/zoom animations. Closes on overlay click.
- **Loader** — Centered spinner with optional text. Used for loading states.
- **Cursor** — Animated SVG cursor for multiplayer participant pointers.

## Layout Components (`layout/`)

- **GameLayout** — Flex container for game pages (centered, flex-start alignment, gap). Wrap the board + side panel inside it.
- **Container** — Max-width wrapper (1440px) with horizontal padding.
- **CreateGameLayout** — Card with title/description header for game creation pages. Wraps settings content.
- **Header** — Site header with logo, user avatar, and dropdown menu (profile, logout).
- **ProtectedRoute** — Auth guard that redirects to `/login` if not authenticated.

## Icons (`icons/`)

CheckIcon, CrossIcon, CopyIcon, TrophyIcon, WarningIcon, BrokenHeartIcon

## Shared Styles

- **`src/styles/colors.scss`** — SCSS color variables. Import via `@use '../../styles/colors' as *`.
